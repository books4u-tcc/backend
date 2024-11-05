import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, Role } from '../entities/message.entity';
import { Conversation } from '../entities/conversation.entity';
import axios from 'axios';

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  async saveMessage(
    content: string,
    role: Role,
    conversation: Conversation,
    suggestions: string[] = [],
    canGenerateRecommendations: boolean = false,
  ): Promise<Message> {
    const message = this.messageRepository.create({
      content,
      role,
      conversation,
      suggestions,
      canGenerateRecommendations,
    });
    return this.messageRepository.save(message);
  }

  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      order: { createdAt: 'ASC' },
    });
  }

}
