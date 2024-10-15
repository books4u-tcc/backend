import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookRecomendationService } from './book-recommendation.service';
import { BookRecomendationController } from './book-recommendation.controller';
import { BookRecomendation } from 'entities/bookRecomendation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BookRecomendation])],
  controllers: [BookRecomendationController],
  providers: [BookRecomendationService],
  exports: [BookRecomendationService], // Exporte o serviço
})

export class BookRecomendationModule {}