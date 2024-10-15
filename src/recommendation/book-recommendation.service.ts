import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import { BookRecomendation } from 'entities/bookRecomendation.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class BookRecomendationService {
  constructor(

  ) {}

  async getBookInfo(query: string): Promise<Partial<BookRecomendation>> {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=` + query,
      );

      const bookItem = response.data.items?.[0];
      const volumeInfo = bookItem?.volumeInfo;

      if (!volumeInfo) {
        throw new HttpException('Book not found', HttpStatus.NOT_FOUND);
      }

      return {
        name: volumeInfo.title || 'No title available',
        author: volumeInfo.authors?.join(', ') || 'Author not available',
        imageUrl: volumeInfo.imageLinks?.thumbnail || null,
        externalLink: volumeInfo.infoLink || '',
      };
    } catch (error) {
      console.error('Error fetching book info:', error.message);
      throw new HttpException(
        'Failed to fetch book data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

}
