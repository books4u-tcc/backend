import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from "../dto/register-user.dto";
import { LoginUserDto } from "../dto/login-user.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterUserDto): Promise<Account> {
    const { displayName, email, password } = registerDto;

    const existingAccount = await this.accountRepository.findOne({
      where: { email },
    });
    if (existingAccount) {
      throw new BadRequestException('E-mail is already in use.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const account = this.accountRepository.create({
      displayName,
      email,
      passwordHash,
    });
    return this.accountRepository.save(account);
  }

  async login(loginDto: LoginUserDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;

    const account = await this.accountRepository.findOne({ where: { email } });
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      throw new UnauthorizedException('Invalid e-mail or password.');
    }

    const payload = { sub: account.id, email: account.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
    });
    return { accessToken };
  }
}
