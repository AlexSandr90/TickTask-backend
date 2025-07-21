import { UsersRepository } from '../users.repository';
import { UserDto } from '../../auth/dto/create-user.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserWithoutPassword } from '../interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { AUTH_CONFIG } from '../../../configurations/auth.config';
import { User } from '@prisma/client';
import { Response } from 'express';
// import { Response } from '@nestjs/common';

@Injectable()
export class UserBusinessValidator {
  constructor(private readonly usersRepository: UsersRepository) {}

  async validateBusinessRules(userDTO: UserDto): Promise<void> {
    this.validateTimezone(userDTO.timezone);

    await this.validateEmailUnique(userDTO.email);
  }

  async createUser(userDto: UserDto): Promise<UserWithoutPassword> {
    const hashedPassword = await bcrypt.hash(userDto.password, 10);

    const newUser = await this.usersRepository.createUser({
      username: userDto.username,
      email: userDto.email,
      passwordHash: hashedPassword,
      timezone: userDto.timezone ?? 'UTC',
    });

    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async validateUserCredentials(
    email: string,
    password: string,
  ): Promise<User> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new BadRequestException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    return user;
  }

  setAuthCookies(
    res: Response,
    newAccessToken: string,
    newRefreshToken: string,
  ): void {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', newAccessToken, {
      httpOnly: true,
      secure: isProduction, // secure: true только в проде (нужно для SameSite=None)
      maxAge: AUTH_CONFIG.expireJwt,
      path: '/',
      sameSite: isProduction ? 'none' : 'lax', // None требует secure
      domain: isProduction ? 'taskcraft.click' : undefined, // домен не нужен на localhost
    });

    res.cookie('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      maxAge: AUTH_CONFIG.expireJwtRefresh,
      path: '/',
      sameSite: isProduction ? 'none' : 'lax',
      domain: isProduction ? 'taskcraft.click' : undefined,
    });
  }

  private validateTimezone(timezone?: string): void {
    if (!timezone) return;

    if (timezone !== 'UTC' && !this.usersRepository.isValidTimezone(timezone)) {
      throw new BadRequestException('Timezone not valid');
    }
  }

  private async validateEmailUnique(email: string): Promise<void> {
    const existUser = await this.usersRepository.findByEmail(email);

    if (existUser) {
      throw new BadRequestException('A user with this email already exists.');
    }
  }
}
