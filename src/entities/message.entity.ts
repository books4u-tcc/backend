import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Conversation } from './conversation.entity'; // Ajuste o caminho conforme necessário

export enum Role {
  USER = 'USER',
  BOT = 'BOT',
}

@Entity('message') // Nome da tabela no banco de dados
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Conversation, { eager: true }) // Relacionamento com a entidade Conversation
  conversation: Conversation;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.USER,
  })
  role: Role;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'json', nullable: true })
  suggestions: any[];

  @Column({ type: 'boolean', default: false })
  canGenerateRecommendations: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
