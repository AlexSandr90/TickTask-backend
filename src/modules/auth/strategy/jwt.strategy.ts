import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { APP_CONFIG } from '../../../configurations/app.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req) => req?.cookies?.access_token,
      ]),
      secretOrKey: APP_CONFIG.secretJWT || 'veryHardSecret',
    });
  }

  async validate(payload: any) {
    console.log('🎯 Payload in validate:', payload); // Логируем payload
    const user = await this.usersService.findOne(payload.email); // Ищем по email, который передан в payload
    return user;
  }
}
