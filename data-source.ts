import { DataSource } from 'typeorm';
import { Account } from './src/entities/account.entity';
import { Conversation } from './src/entities/conversation.entity';
import { Message } from 'entities/message.entity';
import { BookRecomendation } from 'entities/bookRecomendation.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DATABASE_HOST,
  port: 3306,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [Account, Conversation, Message, BookRecomendation],
  synchronize: false,
  migrations: ['src/migrations/*.ts'],
});

AppDataSource.initialize()
  .then(() => {
    console.log('Data Source has been initialized!');
  })
  .catch((err) => {
    console.error('Error during Data Source initialization', err);
  });
