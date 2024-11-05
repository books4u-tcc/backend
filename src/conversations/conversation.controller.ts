import {Body, Controller, Delete, Get, Param, Post, Req, UseGuards} from '@nestjs/common';
import {ConversationService} from './conversation.service';
import {OpenAiService} from '../openai/openai.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {Request} from 'express';
import {Account} from '../entities/account.entity';
import {MessageService} from '../messages/message.service';
import {Role} from '../entities/message.entity';
import {OptionalJwtAuthGuard} from "../auth/guards/optional-jwt-auth.guard";
import { BookRecomendationService } from 'recommendation/book-recommendation.service';
import { BookRecomendation } from 'entities/bookRecomendation.entity';

@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly openAiService: OpenAiService,
    private readonly messageService: MessageService,
    private readonly bookService: BookRecomendationService
  ) {
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  async createConversation(@Req() req: Request): Promise<any> {
    const user = req.user as Account | undefined;
  
    const threadId = await this.openAiService.createThread();
  
    const generatedTitle = await this.openAiService.generateTitleForConversation('Recomendação de Livros');
    
    const conversationRequest = await this.conversationService.createConversation(
      generatedTitle,
      user ?? null,
      threadId.id
    );
  
    let conversation = [
      {
        id: conversationRequest.id,
        title: conversationRequest.title,
        threadId: conversationRequest.threadId,
      }
    ];
  
    return { message: 'Conversation created successfully', conversation };
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserConversations(@Req() req: Request) {
    const user = req.user as Account;
    return this.conversationService.getUserConversations(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getConversation(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as Account;
    return this.conversationService.getConversationByUserId(id, user);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteConversation(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as Account;
    const threadId = await this.conversationService.getConversationByUserId(id, user).then((conversation) => conversation.threadId);
    // Deleta a conversa no banco de dados
    await this.conversationService.deleteConversation(id, user);
    // Deleta a conversa no OpenAI
    await this.openAiService.deleteThread(threadId);
    return {message: 'Conversation deleted successfully'};
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Post(':conversationId/messages')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body('message') message: string
  ): Promise<any> {
    const conversation = await this.conversationService.getConversationById(conversationId);
  
    // Enviar mensagem do usuário para a thread da OpenAI
    const userMessage = await this.openAiService.addMessage(conversation.threadId, message);
  
    // Salvar mensagem do usuário no banco de dados
    await this.messageService.saveMessage(
      message,
      Role.USER,
      conversation,
      [],
      false
    );
  
        // Recupera todas as mensagens da conversa para gerar o contexto completo
    const contextMessages = await this.openAiService.getMessages(conversation.threadId);

    // Usa o contexto completo para gerar um novo título
    const newTitle = await this.openAiService.generateTitleForConversation(contextMessages);


    await this.conversationService.updateConversationTitle(conversationId, newTitle);
  
    const runId = await this.openAiService.runAssistant(conversation.threadId);
  
    const assistantMessages = await this.openAiService.checkingStatus(conversation.threadId, runId);
  
    if (assistantMessages.length > 0) {
      const assistantMessage = assistantMessages[0];
  
      let contentJson;
  
      try {
        contentJson = JSON.parse(assistantMessage.content);
      } catch (error) {
        throw new Error('Formato inválido da mensagem do assistente');
      }
  
      if (contentJson.options) {
        console.log('SOU UMA OPÇÃO DE RESPOSTA COM MENSAGEM');
        console.log('contentJson.message', contentJson.message);
        console.log('contentJson.options', contentJson.options);
        // Validar que message e suggestions existem
        if (!contentJson.message || !Array.isArray(contentJson.options)) {
          throw new Error('Estrutura inválida da mensagem do assistente');
        }
  
        const mainMessage = contentJson.message;
        const suggestions = contentJson.options;
        const canGenerateRecommendations = !!suggestions.some((suggestion: string) => suggestion.includes("Gerar recomendações"));
        // Retirar a opção de gerar recomendações do suggestions
        suggestions.forEach((suggestion: string, index: number) => {
          if (suggestion.includes("Gerar recomendações") || suggestion.includes("Gerar recomendação")) {
            suggestions.splice(index, 1);
          }
        });
  
        // Salvar a mensagem do assistente no banco de dados
        await this.messageService.saveMessage(
          mainMessage,               // Conteúdo principal da mensagem do assistente
          Role.BOT,                  // Identificar que é uma mensagem do assistente (BOT)
          conversation,              // Conversação a que pertence
          suggestions,               // As sugestões extraídas
          canGenerateRecommendations  // Se pode gerar recomendações ou não
        );
  
        return {
          message: mainMessage,
          options: suggestions,
          canGenerateRecommendations: canGenerateRecommendations,
          title: newTitle,
        };
      
      } else if (contentJson.suggestions) {
        console.log('SOU UMA RECOMENDAÇÃO DE LIVROS');
        console.log('contentJson.message', contentJson.message);
        console.log('contentJson.suggestions', contentJson.suggestions);
  
        const mainMessage = contentJson.message;
        const suggestions = contentJson.suggestions;
  
        // Pegar o último item de suggestions para verificar se é uma string "Gerar Outra Recomendação"
        const canGenerateRecommendations = suggestions[suggestions.length - 1] === "Gerar Outra Recomendação" || "Gerar recomendações" || "Gerar outra recomendação" ? 1 : 0;
        // Retirar a opção de gerar recomendações do suggestions
        if (canGenerateRecommendations) {
          suggestions.pop();
        }
  
        let recommendations: {
          name: string;
          author: string | null;
          imageUrl: string | null;
          externalLink: string | null;
        }[] = [];
  
        const promises = suggestions.map(async (suggestion: any) => {
          const bookData = await this.bookService.getBookInfo(suggestion.title); // Chamada da API de livros
          
          return {
            name: bookData.name || suggestion.title,
            author: bookData.author || suggestion.author,
            imageUrl: bookData.imageUrl || null,
            externalLink: bookData.externalLink || null
          };
        });
        
        recommendations = await Promise.all(promises);
        console.log(recommendations);
  
        await this.messageService.saveMessage(
          mainMessage,      // Conteúdo principal da mensagem do assistente
          Role.BOT,         // Identificar que é uma mensagem do assistente (BOT)
          conversation,     // Conversação a que pertence
          suggestions,      // As sugestões extraídas
          true              // Se pode gerar recomendações ou não
        );
  
        return {
          message: mainMessage,
          recommendations: recommendations,
          canGenerateRecommendations: true,
          title: newTitle,
        };
      }
    }
  }

  @UseGuards(JwtAuthGuard)
// GET /conversations/:conversationId/messages
  @Get(':conversationId/messages')
  async getMessages(@Param('conversationId') conversationId: string): Promise<any> {
    const conversation = await this.conversationService.getConversationById(conversationId);

    const messages = await this.openAiService.getMessages(conversation.threadId);

    // Processar as mensagens para o formato esperado
    const formattedMessages = messages.map((message: any) => {
      let contentJson;

      // Tentar parsear o conteúdo da mensagem como JSON
      try {
        contentJson = JSON.parse(message.content);
      } catch (error) {
        console.error('Erro ao parsear o conteúdo da mensagem como JSON:', error);

        // Se ocorrer um erro no parseamento, usar o conteúdo original
        contentJson = {
          message: message.content,
          suggestions: []
        };
      }

      const mainMessage = contentJson.message;
      const suggestions = contentJson.options || [];

      // Verifica se uma das sugestões contém "Gerar recomendações"
      const canGenerateRecommendations = suggestions.some((suggestion: string) => suggestion.includes("Gerar recomendações")) ? 1 : 0;

      return {
        role: message.role,
        message: mainMessage,
        suggestions: suggestions,
        canGenerateRecommendations: canGenerateRecommendations
      };
    });

    return {messages: formattedMessages};
  }

}
