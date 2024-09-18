import {Injectable, NotFoundException} from '@nestjs/common';
import {Conversation} from '../entities/conversation.entity';
import {Repository} from 'typeorm';
import {InjectRepository} from '@nestjs/typeorm';
import {Account} from '../entities/account.entity';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  async createConversation(title: string, user: Account): Promise<Conversation> {

    const conversation = this.conversationRepository.create({
      title,
      createdBy: user,
    });
    return this.conversationRepository.save(conversation);
  }

  async getUserConversations(user: Account): Promise<Conversation[]> {
    return await this.conversationRepository.find({
      where: {createdBy: {id: user.id}},
      order: {createdAt: 'DESC'},
    });
  }


  async getConversationById(id: string, user: Account): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id, createdBy: { id: user.id } },
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    return conversation;
  }


  async deleteConversation(id: string, user: Account): Promise<void> {
    const conversation = await this.getConversationById(id, user);
    await this.conversationRepository.remove(conversation);
  }
}
