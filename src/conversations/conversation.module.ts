import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../entities/conversation.entity';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { Account } from '../entities/account.entity';
import { JwtModule } from '@nestjs/jwt';
import {MessageModule} from "../messages/message.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Account]),
    JwtModule.register({}),
    TypeOrmModule.forFeature([Conversation]), // Import the Conversation entity
    MessageModule, // Import the MessageModule here
  ],
  controllers: [ConversationController],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationModule {}
