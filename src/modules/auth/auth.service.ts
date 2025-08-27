import {
  Response,
  HttpStatus,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
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
    @Response() res: any,
  ): Promise<void> {
    const user = await this.userBusinessValidator.validateUserCredentials(
      email,
      password,
    );
    const { accessToken, refreshToken } = await this.generateTokens(user);

    this.userBusinessValidator.setAuthCookies(res, accessToken, refreshToken);
    res.status(HttpStatus.OK).json({ message: 'Successfully logged in' });
    return;
  }

  async refreshToken(
    refreshToken: string,
    @Response() res: any,
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
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async googleLogin(user: any): Promise<any> {
    try {
      if (!user.googleId || !user.email || !user.username) {
        throw new UnauthorizedException('Invalid Google user data!');
      }

      return await this.usersRepository.findOrCreateGoogleUser({
        googleId: user.googleId,
        email: user.email,
        username: user.username,
      });
    } catch (e) {
      throw new UnauthorizedException('Invalid Google user data!');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestException('No user with this email address found.');
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetLink = `${APP_CONFIG.baseUrl}/reset-password?token=${resetToken}`;

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
}
