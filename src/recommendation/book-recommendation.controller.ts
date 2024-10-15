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

    // Traduzir query do inglês para português
    const translatedQuery = await this.translateToPortuguese(query);
    return this.bookService.getBookInfo(translatedQuery);
  }

  private async translateToPortuguese(text: string): Promise<string> {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text,
    )}&langpair=en|pt`;
    const response = await axios.get(url);
    return response.data.responseData.translatedText;
  }

}