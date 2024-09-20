import { IsNotEmpty, IsEmail } from 'class-validator';

export class LoginUserDto {
  @IsEmail({}, {message: "email must be a valid email."})
  @IsNotEmpty({message: "email is required."})
  email: string;

  @IsNotEmpty({message: "password is required."})
  password: string;
}
