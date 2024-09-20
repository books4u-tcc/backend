import {Body, Controller, Delete, Get, Param, Post, Req, UseGuards} from '@nestjs/common';
import {ConversationService} from './conversation.service';
import {OpenAiService} from '../openai/openai.service';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {Request} from 'express';
import {Account} from '../entities/account.entity';
import {MessageService} from '../messages/message.service';
import {Role} from '../entities/message.entity';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationController {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly openAiService: OpenAiService,
    private readonly messageService: MessageService,
  ) {
  }

  @Post()
  async createConversation(@Req() req: Request): Promise<any> {
    const user = req.user as Account;
    // Cria uma nova thread no OpenAI e já executa o assistente
    const threadId = await this.openAiService.createThread();
    // Cria a conversa no banco de dados
    const conversation = await this.conversationService.createConversation('Recomendação de Livros', user, threadId);
    // Pega a primeira mensagem do assistente
    const messages = await this.openAiService.getMessages(threadId);
    // Salvar a mensagem inicial do assistente no banco de dados
    for (const message of messages) {
      await this.messageService.saveMessage(
        message.content,
        Role.BOT,
        conversation,
        [],
        false,
      );
    }

    return {conversationId: conversation.id, messages};
  }

  @Get()
  async getUserConversations(@Req() req: Request) {
    const user = req.user as Account;
    return this.conversationService.getUserConversations(user);
  }

  @Get(':id')
  async getConversation(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as Account;
    return this.conversationService.getConversationByUserId(id, user);
  }

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
      [], // Usuário não tem sugestões
      false // Usuário não pode gerar recomendações
    );

    // Rodar o assistente para processar a mensagem
    const runId = await this.openAiService.runAssistant(conversation.threadId);

    // Fazer polling até a resposta do assistente estar pronta e filtrar por runId
    const assistantMessages = await this.openAiService.checkingStatus(conversation.threadId, runId);

    // Verificar se a resposta do assistente está disponível e salvar no banco de dados
    if (assistantMessages.length > 0) {
      const assistantMessage = assistantMessages[0]; // Sabemos que será uma única resposta

      // Separar a mensagem principal e as sugestões
      const contentParts = assistantMessage.content.split('\n');
      const mainMessage = contentParts[0]; // A primeira linha é a mensagem principal
      const suggestions = contentParts.slice(1).filter((s: string) => s.trim() !== ''); // As sugestões são todas as outras linhas

      // // Verificar se a mensagem contém "Gerar recomendações"
      // let bookName = '';
      // let authorName = '';
      // let imageUrl = '';
      // let externalLink = '';
      //
      // // Loop para procurar os padrões "Nome do livro", "Autor", "Imagem", "Link"
      // contentParts.forEach((part: string) => {
      //   if (part.startsWith('Nome do livro:')) {
      //     bookName = part.replace('Nome do livro:', '').trim();
      //   } else if (part.startsWith('Autor do livro:')) {
      //     authorName = part.replace('Autor do livro:', '').trim();
      //   } else if (part.startsWith('Imagem do livro:')) {
      //     imageUrl = part.replace('Imagem do livro:', '').trim();
      //   } else if (part.startsWith('Link do livro:')) {
      //     externalLink = part.replace('Link do livro:', '').trim();
      //   }
      // });
      //
      // // Se o nome e autor estiverem presentes, salvar a recomendação
      // if (bookName && authorName) {
      //   await this.bookRecomendationService.saveRecomendation(
      //     bookName,
      //     authorName,
      //     imageUrl || null,
      //     externalLink || null
      //   );
      // }

      // Verificar se alguma sugestão contém "Gerar recomendação"
      const canGenerateRecommendations = suggestions.some((suggestion: string | string[]) => suggestion.includes("Gerar recomendações"));

      // Salvar a mensagem do assistente no banco de dados
      await this.messageService.saveMessage(
        mainMessage,               // Conteúdo principal da mensagem do assistente
        Role.BOT,                  // Identificar que é uma mensagem do assistente (BOT)
        conversation,              // Conversação a que pertence
        suggestions,               // As sugestões extraídas
        canGenerateRecommendations  // Se pode gerar recomendações ou não
      );
    }

    return { userMessage };
  }



  // GET /conversations/:conversationId/messages
  @Get(':conversationId/messages')
  async getMessages(@Param('conversationId') conversationId: string): Promise<any> {
    const conversation = await this.conversationService.getConversationById(conversationId);

    const messages = await this.openAiService.getMessages(conversation.threadId);

    // Processar as mensagens para o formato esperado
    const formattedMessages = messages.map((message: any) => {
      const contentParts = message.content.split('\n');

      // Primeira linha é a mensagem principal
      const mainMessage = contentParts[0];

      // As sugestões são todas as outras linhas
      const suggestions = contentParts.slice(1).filter((s: string) => s.trim() !== '');

      // Verifica se uma das sugestões contém "Gerar recomendação"
      const canGenerateRecommendations = suggestions.some((suggestion: string | string[]) => suggestion.includes("Gerar recomendações")) ? 1 : 0;

      return {
        role: message.role,
        message: mainMessage,
        suggestions: suggestions,
        canGenerateRecommendations: canGenerateRecommendations
      };
    });

    return { messages: formattedMessages };
  }

}
