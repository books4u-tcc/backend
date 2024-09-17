import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entities/account.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    displayName: string,
    email: string,
    password: string,
  ): Promise<Account> {
    const existingAccount = await this.accountRepository.findOne({
      where: { email },
    });
    if (existingAccount) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const account = this.accountRepository.create({
      displayName,
      email,
      passwordHash,
    });
    return this.accountRepository.save(account);
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const account = await this.accountRepository.findOne({ where: { email } });
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: account.id, email: account.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
    });
    return { accessToken };
  }
}
