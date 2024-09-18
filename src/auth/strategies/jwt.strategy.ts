import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Account } from '../../entities/account.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Account)
    private readonly accountRepository: Repository<Account>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        '8c24b65640ef35492143b1c7d2bc4eab9d4173d41472c9336eea41f79a15ec96',
    });
  }

  async validate(payload: any): Promise<Account> {
    const user = await this.accountRepository.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
