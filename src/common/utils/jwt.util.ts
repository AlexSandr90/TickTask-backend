import * as jwt from 'jsonwebtoken';
import { APP_CONFIG } from '../../configurations/app.config';
import { BadRequestException } from '@nestjs/common';


interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

// Функция для генерации токена с добавлением ID пользователя
export function generateJwtToken(email: string, sub: string)  {
  const secretJWT = APP_CONFIG.secretJWT;


  if (!secretJWT) {
    throw new Error('JWT secret is not defined');
  }

  const payload = { email, sub }; // Добавляем ID в payload
  return jwt.sign(payload, secretJWT, { expiresIn: '10d' }); // Генерация токена с временем жизни 10 дней
}

// Функция для верификации токена и извлечения ID пользователя
export function verifyJwtToken(token: string): JwtPayload {
  const secretJWT = APP_CONFIG.secretJWT;

  if (!secretJWT) {
    throw new Error('JWT secret is not defined');
  }

  try {
    const decoded = jwt.verify(token, secretJWT) as JwtPayload;

    console.log('✅ Декодированный токен:', decoded);

    if (!decoded.email || !decoded.sub) {
      throw new BadRequestException('Неверный токен');
    }

    return { email: decoded.email, sub: decoded.sub, iat: decoded.iat, exp: decoded.exp };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new BadRequestException('Срок действия токена истёк');
    }
    throw new BadRequestException('Неверная ссылка или токен повреждён');
  }
}