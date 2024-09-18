import { IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class CreateConversationDto {
  @IsNotEmpty({ message: "title is required." })
  @MinLength(3, { message: "title must be at least 3 characters long." })
  @MaxLength(50, { message: "title must be at most 50 characters long." })
  title: string;
}
