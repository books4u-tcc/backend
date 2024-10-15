import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Account } from './entities/account.entity';
import * as dotenv from 'dotenv';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { BookRecomendation } from './entities/bookRecomendation.entity';
import { OpenaiModule} from "./openai/openai.module";
import { ConversationModule } from './conversations/conversation.module';
import { MessageModule } from './messages/message.module';
import { BookRecomendationModule } from 'recommendation/book-recommendation.module';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DATABASE_HOST,
      port: 3306,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [Account, Conversation, Message, BookRecomendation],
      synchronize: true,
    }),
    AuthModule,
    OpenaiModule,
    ConversationModule,
    MessageModule,
    BookRecomendationModule
  ],
})
export class AppModule {}
