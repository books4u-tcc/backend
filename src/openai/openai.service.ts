import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import {Beta} from "openai/resources";
import Thread = Beta.Thread;

dotenv.config();

interface MessageContent {
  type: 'text';
  text: {
    value: string;
  };
}

interface Message {
  role: 'user' | 'assistant';
  content: MessageContent[];
}

interface MessagesListResponse {
  body: {
    data: Message[];
  };
}

@Injectable()
export class OpenAiService {
  private readonly openai: OpenAI;
  private readonly assistantId: string;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    this.assistantId = process.env.OPENAI_ASSISTANT_ID ?? (() => {
      throw new Error('OPENAI_ASSISTANT_ID is not defined');
    })();
  }

  // Add a message to a specific thread
  async addMessage(threadId: string, message: string): Promise<any> {
    try {
      console.log(`Sending message to thread: ${threadId}`);
      const response = await this.openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content: [
          {
            type: 'text',
            text: message,
          },
        ],
      });
      console.log('Message sent successfully:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw new HttpException('Failed to send message to OpenAI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Create a new thread and immediately run the assistant
  async createThread(): Promise<Thread> {
    try {
      console.log('Creating a new thread and running assistant');
      const response = await this.openai.beta.threads.create();
      console.log('Thread created:', response);
      return response;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw new HttpException('Failed to create thread with OpenAI', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Run assistant on the given thread
  async runAssistant(threadId: string): Promise<string> {
    console.log('Running assistant for thread: ' + threadId);
    const response = await this.openai.beta.threads.runs.create(threadId, {
      assistant_id: this.assistantId,
    });
    console.log('Run response:', response);
    return response.id;
  }

  async generateTitleForConversation(context: string): Promise<string> {

    try {

      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
        {
          role: "system",
          content: `Você é um assistente especializado em livros. Sua tarefa é gerar um título curto (máximo 4 palavras) para uma conversa com base nas respostas mais recentes do usuário, refletindo gênero, preferências ou características dos livros mencionados.
        Seja direto e conciso. Exemplos de títulos:
        - Para "Ficção Científica": "Livros de Ficção Científica"
        - Para "Ficção Científica, 100 páginas": "Ficção Científica Curtos"
        
        Sempre preste atenção ao contexto da conversa para gerar o titulo, lembrando como os exemplos foram feitos.
        Não inclua palavras como "Tema" ou aspas. Apenas forneça um título curto e claro.`
        },
        {
          role: "user",
          content: `Sugira um título curto e cativante para uma conversa sobre o tema: "${context}"`
        }
      ];
  
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 10, // Reduzido para evitar respostas longas e garantir que o título seja curto
        temperature: 0.3, // Baixa para mais previsibilidade
        stop: ['\n']
      });
  
      const generatedTitle = response.choices[0]?.message?.content?.trim() || 'Recomendação de livros';
      return generatedTitle;
  
    } catch (error) {
      console.error('Erro ao gerar título:', error);
      return 'Recomendação de livros'; // Fallback em caso de erro
    }
  }

  async getMessages(threadId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const messagesList = await this.openai.beta.threads.messages.list(threadId) as unknown as MessagesListResponse;
    return messagesList.body.data.map((message: any) => {
        return {
          role: message.role,
          content: message.content[0].text.value
        }
      }
    );
  }

  async checkingStatus(
    threadId: string,
    runId: string
  ): Promise<any> {
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    let status = 'running';
    let attempt = 0;
    const maxAttempts = 10; // Limitar a quantidade de tentativas de polling

    while (status !== 'completed' && attempt < maxAttempts) {
      console.log(`Aguardando a resposta do assistente (tentativa ${attempt + 1})...`);

      // Espera por 3 segundos antes de verificar novamente o status
      await delay(5000);

      const runObject = await this.openai.beta.threads.runs.retrieve(threadId, runId);
      status = runObject.status;

      console.log('Status atual:', status);

      if (status === 'completed') {
        // Busca as mensagens após o processo ser concluído
        const messagesList = await this.getMessages(threadId);

        // Verifica e filtra a mensagem do assistente correspondente ao runId
        const assistantMessage = messagesList.find(
          (message: any) => message.role === 'assistant'
        );

        // Retorna apenas a mensagem do assistente encontrada
        return assistantMessage ? [assistantMessage] : [];
      }

      attempt++; // Incrementa a tentativa de polling
    }

    // Se após várias tentativas o status ainda não estiver completo, retorne uma resposta vazia
    console.log('Polling expirado sem resposta completa do assistente.');
    return [];
  }

  // Delete a thread
  async deleteThread(threadId: string): Promise<void> {
    try {
      console.log(`Deleting thread: ${threadId}`);
      await this.openai.beta.threads.del(threadId);
      console.log('Thread deleted successfully');
    } catch (error) {
      console.error('Error deleting thread:', error);
      throw new HttpException('Failed to delete thread', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
