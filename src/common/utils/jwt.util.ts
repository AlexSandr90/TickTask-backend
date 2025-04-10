import * as jwt from 'jsonwebtoken';
import { APP_CONFIG } from '../../configurations/app.config';
import { BadRequestException } from '@nestjs/common';

interface JwtPayload {
  email: string;
  sub: string;
  iat: number;
  exp: number;
}

export function generateJwtToken(email: string, sub: string) {
  const secretJWT = APP_CONFIG.secretJWT;

  if (!secretJWT) {
    throw new Error('JWT secret is not defined');
  }

  const payload = { email, sub };
  return jwt.sign(payload, secretJWT, { expiresIn: '10d' });
}

export function verifyJwtToken(token: string): JwtPayload {
  const secretJWT = APP_CONFIG.secretJWT;

  if (!secretJWT) {
    throw new Error('JWT secret is not defined');
  }

  try {
    const decoded = jwt.verify(token, secretJWT) as JwtPayload;

    if (!decoded.email || !decoded.sub) {
    }

    return {
      email: decoded.email,
      sub: decoded.sub,
      iat: decoded.iat,
      exp: decoded.exp,
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new BadRequestException('Token expired');
    }
    throw new BadRequestException('Invalid link or token is corrupted');
  }
}
