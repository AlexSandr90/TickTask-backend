import {
  HttpStatus,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
// Убираем импорт Response из express
import { JwtService } from '@nestjs/jwt';
import { UserWithoutPassword } from '../users/interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { randomBytes } from 'crypto';
import { EmailService } from '../../email/email.service';
import { UsersRepository } from '../users/users.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { UserDto } from './dto/create-user.dto';
import { UserBusinessValidator } from '../users/utils/business.validator';
import { APP_CONFIG } from '../../configurations/app.config';
import { AUTH_CONFIG } from '../../configurations/auth.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly userBusinessValidator: UserBusinessValidator,
    private readonly emailService: EmailService,
  ) {}

  async register(userDto: UserDto): Promise<UserWithoutPassword> {
    await this.userBusinessValidator.validateBusinessRules(userDto);
    return this.userBusinessValidator.createUser(userDto);
  }

  async generateTokens(user: User) {
    const payload = { email: user.email, id: user.id };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: AUTH_CONFIG.expireJwt,
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: AUTH_CONFIG.expireJwtRefresh,
    });

    await this.usersRepository.updateRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async login(
    email: string,
    password: string,
    language: string | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res: any, // 🔹 Используем any
  ): Promise<void> {
    const user = await this.userBusinessValidator.validateUserCredentials(
      email,
      password,
    );

    await this.usersRepository.updateLastLoginAndLanguage(user.id, language);

    const { accessToken, refreshToken } = await this.generateTokens(user);

    this.userBusinessValidator.setAuthCookies(res, accessToken, refreshToken);

    const updatedUser = await this.usersRepository.findById(user.id);

    if (!updatedUser) {
      throw new UnauthorizedException('User not found after login');
    }

    res.status(HttpStatus.OK).json({
      message: 'Successfully logged in!',
      access_token: accessToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        language: updatedUser.language,
        theme: updatedUser.theme,
        avatarPath: updatedUser.avatarPath,
      },
    });
  }

  async refreshToken(
    refreshToken: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res: any, // 🔹 Используем any
  ): Promise<{ access_token: string }> {
    try {
      const decoded = this.jwtService.verify(refreshToken);
      const user = await this.usersRepository.findByEmail(decoded.email);

      if (!user) {
        throw new UnauthorizedException('User not found!');
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        await this.generateTokens(user);

      this.userBusinessValidator.setAuthCookies(
        res,
        newAccessToken,
        newRefreshToken,
      );

      return res.json({ access_token: newAccessToken });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async googleLogin(user: any): Promise<any> {
    try {
      if (!user.googleId || !user.email || !user.username) {
        throw new UnauthorizedException('Invalid Google user data!');
      }

      return await this.usersRepository.findOrCreateGoogleUser({
        googleId: user.googleId,
        email: user.email,
        username: user.username,
        language: user.language || 'en',
      });
    } catch {
      throw new UnauthorizedException('Invalid Google user data!');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestException('No user with this email address found.');
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetLink = `${APP_CONFIG.baseUrl}/auth/reset-password?token=${resetToken}`;

    await this.usersRepository.updatePasswordResetToken(user.id, resetToken);

    await this.emailService.sendPasswordResetEmail(
      email,
      'Password Reset',
      resetLink,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findUserByPasswordResetToken(token);

    if (!user) {
      throw new BadRequestException(
        'Password reset token is invalid or expired',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.updatePassword(user.id, hashedPassword);
  }

  async logout(email: string): Promise<void> {
    await this.prisma.user.update({
      where: { email },
      data: {
        refreshToken: null,
      },
    });
  }

  async setPasswordForGoogleUser(
    userId: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userBusinessValidator.findGoogleUserById(userId);
    await this.userBusinessValidator.ensurePasswordNotSet(user);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.updatePassword(user.id, hashedPassword);

    return { message: 'Password has been set successfully' };
  }

  async updateLanguage(
    userId: string,
    language: string,
  ): Promise<{ language: string }> {
    if (!this.usersRepository.isValidLanguage(language)) {
      throw new BadRequestException('Invalid language. Supported: en, ru, ua');
    }

    const user = await this.usersRepository.updateLanguage(userId, language);
    return { language: user.language };
  }
}
