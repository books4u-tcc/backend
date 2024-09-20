import {HttpException, HttpStatus, Injectable} from '@nestjs/common';
import OpenAI from 'openai';
import * as dotenv from 'dotenv';

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
  async createThread(): Promise<string> {
    try {
      console.log('Creating a new thread and running assistant');
      const response = await this.openai.beta.threads.createAndRun({
        assistant_id: this.assistantId,
      });
      console.log('Thread created:', response.thread_id);
      return response.thread_id;
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


  async getMessages(threadId: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 10000));
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
