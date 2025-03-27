import * as jwt from 'jsonwebtoken';
import { APP_CONFIG } from '../../configurations/app.config';
import { BadRequestException } from '@nestjs/common';

interface JwtPayload {
  email: string;
}

// Функция для генерации токена
export function generateJwtToken(email: string) {
  const secretJWT = APP_CONFIG.secretJWT;
  console.log('SECRET при генерации:', secretJWT); // Проверяем секрет
  if (!secretJWT) {
    throw new Error('JWT secret is not defined'); // Вы можете выбросить ошибку, если секретный ключ отсутствует
  }

  const payload = { email };
  return jwt.sign(payload, secretJWT, { expiresIn: '1h' }); // Генерация токена с временем жизни 1 час
}

// Функция для верификации токена
export function verifyJwtToken(token: string): string {
  const secretJWT = APP_CONFIG.secretJWT;

  console.log('SECRET:', secretJWT); // Проверяем секретный ключ

  if (!secretJWT) {
    throw new Error('JWT secret is not defined');
  }

  try {
    const decoded = jwt.verify(token, secretJWT) as JwtPayload;
    console.log('Decoded token:', decoded); // Проверяем, что токен успешно декодируется
    return decoded.email;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    if (error.name === 'TokenExpiredError') {
      throw new BadRequestException('Срок действия токена истёк');
    }
    throw new BadRequestException('Неверная ссылка или токен повреждён');
  }
}

