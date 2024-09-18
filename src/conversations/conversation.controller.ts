import {Controller, Post, Get, Delete, Param, Body, UseGuards, Req, UsePipes, ValidationPipe} from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';
import { Account } from '../entities/account.entity';
import { CreateConversationDto} from "../dto/create-conversation.dto";

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async createConversation(
    @Body() createConversationDto: CreateConversationDto,
    @Req() req: Request,
  ) {
    const user = req.user as Account;
    return this.conversationService.createConversation(createConversationDto.title, user);
  }

  @Get()
  async getUserConversations(@Req() req: Request) {
    const user = req.user as Account;
    return this.conversationService.getUserConversations(user);
  }

  @Get(':id')
  async getConversation(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as Account;
    return this.conversationService.getConversationById(id, user);
  }

  @Delete(':id')
  async deleteConversation(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as Account;
    await this.conversationService.deleteConversation(id, user);
    return { message: 'Conversation deleted successfully' };
  }
}
