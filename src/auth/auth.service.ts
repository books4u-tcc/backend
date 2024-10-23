import {Injectable, UnauthorizedException, BadRequestException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Account} from '../entities/account.entity';
import * as bcrypt from 'bcrypt';
import {JwtService} from '@nestjs/jwt';
import {RegisterUserDto} from "../dto/register-user.dto";
import {LoginUserDto} from "../dto/login-user.dto";
import {Conversation} from "../entities/conversation.entity";
import {Message} from "../entities/message.entity";
import {UpdateUserDto} from "../dto/update-user.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly jwtService: JwtService,
  ) {
  }

  async register(registerDto: RegisterUserDto): Promise<Account> {
    const {displayName, email, password} = registerDto;

    const existingAccount = await this.accountRepository.findOne({
      where: {email},
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
    const {email, password} = loginDto;

    const account = await this.accountRepository.findOne({where: {email}});
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      throw new UnauthorizedException('Invalid e-mail or password.');
    }

    const payload = {sub: account.id, email: account.email};
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
    });
    return {accessToken};
  }

  async deleteAccount(user: any) {
    const account = await this.accountRepository.findOne({
      where: { id: user.sub },
      relations: ['conversations'],
    });

    if (!account) {
      throw new BadRequestException('Account not found.');
    }


    try {
      for (const conversation of account.conversations) {
        await this.messageRepository.delete({ conversation });
      }

      await this.conversationRepository.delete({ createdBy: account });

      await this.accountRepository.delete(account.id);

    } catch (e) {
      throw new BadRequestException('Could not delete the account and its related data.');
    }
    return { message: 'Account deleted successfully.' };
  }

  async updateAccount(user: any, updateDto: UpdateUserDto): Promise<Account> {
    const account = await this.accountRepository.findOne({ where: { id: user.sub } });

    if (!account) {
      throw new BadRequestException('Account not found.');
    }
    console.log(updateDto);

    if (updateDto.displayName) {
      account.displayName = updateDto.displayName;
    }
    if (updateDto.email) {
      const existingAccount = await this.accountRepository.findOne({ where: { email: updateDto.email } });
      if (existingAccount && existingAccount.id !== account.id) {
        throw new BadRequestException('E-mail is already in use.');
      }
      account.email = updateDto.email;
    }
    if (updateDto.password) {
      account.passwordHash = await bcrypt.hash(updateDto.password, 10);
    }

    return this.accountRepository.save(account);
  }

}
