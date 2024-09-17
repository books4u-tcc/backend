import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Account } from './entities/account.entity';
import * as dotenv from 'dotenv';
import { Conversation } from './entities/conversation.entity';
import { Message } from 'entities/message.entity';
import { BookRecomendation } from 'entities/bookRecomendation.entity';
import { AIModule } from 'ai/ai.module';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: "localhost",
      port: 3306,
      username: 'root',
      password: 'positivo',
      database: 'books4u_db',
      entities: [Account, Conversation, Message, BookRecomendation],
      synchronize: true,
    }),
    AuthModule, AIModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
