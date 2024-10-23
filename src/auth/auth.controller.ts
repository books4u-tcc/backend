import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  UsePipes,
  ValidationPipe, Delete, Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto} from "../dto/login-user.dto";
import {UpdateUserDto} from "../dto/update-user.dto";

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async register(@Body() registerDto: RegisterUserDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async login(@Body() loginDto: LoginUserDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  deleteAccount(@Req() req: Request) {
    return this.authService.deleteAccount(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateAccount(@Req() req: Request, @Body() updateDto: UpdateUserDto) {
    return this.authService.updateAccount(req.user, updateDto);
  }

}
