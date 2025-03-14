import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { APP_CONFIG } from '../../../configurations/app.config';

@Injectable()
// @ts-ignore
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!APP_CONFIG.secretJWT) {
      throw new Error('JWT secret is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: APP_CONFIG.secretJWT,
    });
  }

  static async validate(payload: any): Promise<any> {
    return payload;
  }
}
