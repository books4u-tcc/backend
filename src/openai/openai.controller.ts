import { Controller, Get, Post, Body, Res, HttpStatus, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { OpenAiService } from "./openai.service";

@Controller('openai')
export class OpenaiController {
  constructor(private readonly openAiService: OpenAiService) {}

  @Get('thread')
  async createThread(@Res() res: Response): Promise<void> {
    try {
      const threadId = await this.openAiService.createThread();
      res.status(HttpStatus.OK).json({ threadId });
    } catch (error) {
      console.error(error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Failed to create thread' });
    }
  }

  @Post('message')
  async submitMessage(
    @Body('message') message: string,
    @Body('threadId') threadId: string
  ): Promise<object> {
    try {
      const response = await this.openAiService.addMessage(threadId, message);

      return {response}
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to send message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
