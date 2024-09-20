import {IsNotEmpty, IsEmail, MinLength, MaxLength} from 'class-validator';

export class RegisterUserDto {
  @IsNotEmpty({message: "displayName is required."})
  @MaxLength(50, {message: "displayName must be at most 50 characters."})
  displayName: string;

  @IsEmail({}, {message: "email must be a valid email."})
  @IsNotEmpty({message: "email is required."})
  email: string;

  @IsNotEmpty({message: "password is required."})
  @MinLength(6, {message: "password must be at least 6 characters."})
  password: string;
}
