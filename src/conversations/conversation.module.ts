import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { Account } from '../entities/account.entity';
import { JwtModule } from '@nestjs/jwt';
import {MessageModule} from "../messages/message.module";
import { BookRecomendationService } from 'recommendation/book-recommendation.service';
import { BookRecomendationModule } from 'recommendation/book-recommendation.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Account]),
    JwtModule.register({}),
    MessageModule, // Import the MessageModule here
    BookRecomendationModule
  ],
  
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
