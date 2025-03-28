import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { APP_CONFIG } from '../../../configurations/app.config'; // Это ваша конфигурация
import { Request } from 'express';  // Импортируем Request из express

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    if (!APP_CONFIG.secretJWT) {
      throw new Error('JWT secret is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Извлекаем токен только из куки
        (request: Request) => {
          return request?.cookies?.access_token; // Токен из куки
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: APP_CONFIG.secretJWT, // Использование вашего конфигурационного ключа
    });
  }

  async validate(payload: any): Promise<any> {
    // Возвращаем данные из payload, которые можно использовать в других частях приложения
    return { userId: payload.sub, email: payload.email }; // например, вы можете возвращать ID и email пользователя
  }
}
