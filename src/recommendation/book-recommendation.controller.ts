import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { BookRecomendationService } from './book-recommendation.service';
import { BookRecomendation } from 'entities/bookRecomendation.entity';
import axios from 'axios';

@Controller('books')
export class BookRecomendationController {
  constructor(private readonly bookService: BookRecomendationService) {}

  @Get('search')
  async searchBook(@Query('query') query: string) {
    if (!query) {
      return { message: 'Query parameter "q" is required' };
    }

    return this.bookService.getBookInfo(query);
  }

}