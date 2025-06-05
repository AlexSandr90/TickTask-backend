import { Response } from 'express';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from './users.repository';
import { UpdateUserDto } from './dto/user.dto';
import { generateJwtToken } from '../../common/utils/jwt.util';
import * as process from 'node:process';
import { sendVerificationEmail } from '../../email/email.service';
import { User } from '@prisma/client';
import { DEFAULT_AVATAR_PATH } from '../../common/constants';
import { SupabaseAvatarService } from './avatar/supabase-avatar.service';
import { AUTH_CONFIG } from '../../configurations/auth.config';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly supabaseService: SupabaseAvatarService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService, // добавьте сюда
  ) {}

  async findOne(email: string) {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new Error('User not found');
    }

    const { passwordHash, googleId, passwordResetToken, ...safeUser } = user;

    return {
      ...safeUser,
      hasPassword: !!passwordHash,
    };
  }

  async findByEmail(email: string) {
    return await this.usersRepository.findByEmail(email);
  }

  async findOneById(id: string) {
    return await this.usersRepository.findById(id);
  }

  async createUser(
    username: string,
    email: string,
    passwordHash: string,
    timezone: string,
  ) {
    return this.usersRepository.createUser({
      username,
      email,
      passwordHash,
      timezone,
    });
  }

  async update(email: string, data: UpdateUserDto) {
    const { isActive, ...updateData } = data;

    const user = await this.usersRepository.updateUser(email, updateData);

    if (!user) throw new NotFoundException('Failed to update user');

    const { refreshToken, passwordHash, ...safeUser } = user;

    return safeUser;
  }

  async remove(email: string) {
    const user = await this.usersRepository.removeUser(email);
    if (!user) throw new NotFoundException('User not found');
    return { message: 'User has been removed' };
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.usersRepository.updateRefreshToken(userId, refreshToken);
  }

  async sendMagicLink(email: string) {
    if (!email) throw new BadRequestException('Email not sent');

    const user = await this.findByEmail(email);
    if (!user) throw new NotFoundException('User with this email not found');

    const token = generateJwtToken(email, user.id);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const magikLink = `${baseUrl}/activate/${token}`;

    try {
      await sendVerificationEmail(email, 'Your Magic Link', magikLink);
    } catch (error) {
      throw new InternalServerErrorException('Error sending email');
    }

    return { message: 'Verification email sent.' };
  }

  async activateUserByTokenAndGenerateToken(token: string, res: Response) {
    if (!token) {
      throw new BadRequestException('Token not transferred');
    }

    let decoded: { email: string; id: string };

    try {
      decoded = this.jwtService.verify(token, {
        secret: process.env.JWT_MAGIC_SECRET,
      });
    } catch (error) {
      throw new BadRequestException(
        `Invalid or expired link. Error: ${error.message || error}`,
      );
    }

    const user = await this.usersRepository.findByEmail(decoded.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isActive) {
      throw new BadRequestException('The user is already activated');
    }

    try {
      const updatedUser = await this.usersRepository.activateUser(
        decoded.email,
      );

      const { accessToken, refreshToken } =
        await this.authService.generateTokens(updatedUser);

      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        maxAge: Number(AUTH_CONFIG.expireJwt),
        path: '/',
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? 'taskcraft.click' : undefined,
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        maxAge: Number(AUTH_CONFIG.expireJwtRefresh),
        path: '/',
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? 'taskcraft.click' : undefined,
      });

      return res.json({ user: updatedUser, accessToken });
    } catch (error) {
      throw new InternalServerErrorException('Failed to activate user');
    }
  }

  async findOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    username: string;
  }): Promise<User> {
    if (!data.googleId || !data.email || !data.username) {
      throw new BadRequestException('Missing required Google user data');
    }
    try {
      const userByGoogleId = await this.usersRepository.findByGoogleId(
        data.googleId,
      );

      if (userByGoogleId) {
        return userByGoogleId;
      }

      return await this.usersRepository.findOrCreateGoogleUser(data);
    } catch (e) {
      console.error('Error in findOrCreateGoogleUser:', e);
      throw new Error('Error while finding or creating Google user');
    }
  }

  // Обновление пароля
  async changePassword(
    userId: string,
    currentPassword: string, // Текущий пароль пользователя
    newPassword: string, // Новый пароль
  ): Promise<string> {
    // Шаг 1: Получаем пользователя по ID
    const user = await this.usersRepository.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Шаг 2: Проверяем, правильный ли текущий пароль
    if (!user.passwordHash) {
      throw new UnauthorizedException('Password hash not found');
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );

    // Шаг 3: Хешируем новый пароль
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Шаг 4: Обновляем пароль в базе данных
    await this.usersRepository.updatePassword(userId, passwordHash);

    return 'Password updated successfully';
  }

  async updatePasswordResetToken(userId: string, newPassword: string) {
    return this.usersRepository.updatePasswordResetToken(userId, newPassword);
  }

  async findByPasswordResetToken(resetToken: string) {
    const user =
      await this.usersRepository.findByPasswordResetToken(resetToken);

    if (!user) {
      throw new NotFoundException('Invalid or outdated  token');
    }

    return user;
  }

  async updateAvatarPath(userId: string, avatarPath: string) {
    try {
      return await this.usersRepository.updateAvatarPath(userId, avatarPath);
    } catch (e) {
      throw new InternalServerErrorException('Error updating avatar path');
    }
  }

  async resetToDefaultAvatar(userId: string) {
    try {
      const user = await this.usersRepository.findOneByIdAndAvatarPath(
        userId,
        DEFAULT_AVATAR_PATH,
      );

      if (user && user?.avatarPath && user.avatarPath !== DEFAULT_AVATAR_PATH) {
        await this.supabaseService.deleteAvatar(user.avatarPath);
      }

      return await this.usersRepository.resetToDefaultAvatar(
        userId,
        DEFAULT_AVATAR_PATH,
      );
    } catch (e) {}
  }

  async getUserWithAvatarUrl(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const avatarUrl = user.avatarPath
      ? this.supabaseService.getAvatarUrl(user.avatarPath)
      : this.supabaseService.getAvatarUrl(DEFAULT_AVATAR_PATH);

    const { passwordHash, refreshToken, ...safeUser } = user;
    return {
      ...safeUser,
      avatarUrl,
      hasPassword: !!passwordHash,
    };
  }

  async updateUserTimeZone(userId: string, timezone: string): Promise<User> {
    if (!this.usersRepository.isValidTimezone(timezone)) {
      throw new BadRequestException('Timezone not valid');
    }

    return this.usersRepository.updateTimezone(userId, timezone);
  }

  convertToUserTimezone(date: Date, userTimezone: string): string {
    return dayjs(date).tz(userTimezone).format();
  }

  convertFromUserTimezone(dateString: string, userTimezone: string): Date {
    return dayjs.tz(dateString, userTimezone).utc().toDate();
  }

  getAvailableTimezones(): string[] {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch (e) {
      return this.getFallbackTimezones();
    }
  }

  private getFallbackTimezones(): string[] {
    return [
      'UTC',
      // Europe
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Europe/Rome',
      'Europe/Madrid',
      'Europe/Kyiv',
      'Europe/Moscow',
      'Europe/Istanbul',
      'Europe/Amsterdam',
      'Europe/Vienna',
      'Europe/Warsaw',
      'Europe/Prague',

      // America
      'America/New_York',
      'America/Chicago',
      'America/Denver',
      'America/Los_Angeles',
      'America/Toronto',
      'America/Vancouver',
      'America/Mexico_City',
      'America/Sao_Paulo',
      'America/Buenos_Aires',
      'America/Lima',
      'America/Bogota',

      // Asia
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Kolkata',
      'Asia/Dubai',
      'Asia/Bangkok',
      'Asia/Singapore',
      'Asia/Seoul',
      'Asia/Hong_Kong',
      'Asia/Jakarta',
      'Asia/Manila',
      'Asia/Karachi',
      'Asia/Tehran',

      // Australia & Oceania
      'Australia/Sydney',
      'Australia/Melbourne',
      'Australia/Perth',
      'Pacific/Auckland',
      'Pacific/Honolulu',

      // Africa
      'Africa/Cairo',
      'Africa/Johannesburg',
      'Africa/Lagos',
      'Africa/Nairobi',

      // Others
      'Atlantic/Reykjavik',
      'Indian/Mauritius',
    ];
  }

  getCurrentTimeInUserTimezone(userTimezone: string): string {
    return dayjs().tz(userTimezone).format();
  }
}
