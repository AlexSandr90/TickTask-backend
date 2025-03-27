import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
 // Подключите ваш JwtStrategy
import { Request } from 'express';
import { JwtStrategy } from '../modules/auth/strategy/jwt.strategy';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtStrategy: JwtStrategy) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.access_token;

    console.log('Cookies:', request.cookies); // Проверяем, приходят ли куки

    if (!token) {
      throw new UnauthorizedException('Токен отсутствует');
    }

    // Используем Passport для валидации токена
    try {
      const payload = this.jwtStrategy.validate({ access_token: token });
      request.user = payload;  // Можно передать данные в request для дальнейшего использования
      return true;
    } catch (error) {
      throw new UnauthorizedException('Ошибка верификации токена');
    }
  }
}
