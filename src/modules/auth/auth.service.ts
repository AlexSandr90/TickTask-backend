import {
  BadRequestException,
  HttpStatus,
  Injectable,
  Response,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { UserWithoutPassword } from '../users/interfaces/user.interface';
import { randomBytes } from 'crypto';
import { sendPasswordResetEmail } from '../../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<UserWithoutPassword> {
    if (password !== confirmPassword) {
      throw new UnauthorizedException('Паролі не збігаються');
    }

    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new UnauthorizedException('A user with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.usersService.createUser(
      username,
      email,
      hashedPassword,
    );
    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  async login(
    email: string,
    password: string,
    @Response() res: any,
  ): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { email: user.email, sub: user.id };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = randomBytes(32).toString('hex');

    await this.usersService.updateRefreshToken(user.id, refreshToken);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false, // Убедитесь, что в продакшн-режиме будет true
      maxAge: 10 * 24 * 60 * 60 * 1000, // 1 час
      path: '/',
    });

    return res.status(HttpStatus.OK).json({ message: 'Successful login' });
  }

  async refreshToken(
    email: string,
    refreshToken: string,
    @Response() res: any,
  ): Promise<{ access_token: string }> {
    const user = await this.usersService.findOne(email);

    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '10d' });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: false,
      maxAge: 10 * 24 * 60 * 60 * 1000,
      sameSite: 'None',
    });

    return res.json({ access_token: accessToken });
  }

  async googleLogin(user: any): Promise<any> {
    try {
      if (!user.googleId || !user.email || !user.username) {
      }

      return await this.usersService.findOrCreateGoogleUser({
        googleId: user.googleId,
        email: user.email,
        username: user.username,
      });
    } catch (error) {
      throw new Error('Error during Google login');
    }
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new BadRequestException('No user with this email address found.');
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    await this.usersService.updatePasswordResetToken(user.id, resetToken);

    await sendPasswordResetEmail(email, 'Password reset', resetLink);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByPasswordResetToken(token);
    if (!user) {
      throw new BadRequestException(
        'Password reset token is invalid or expired',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.updatePassword(user.id, hashedPassword);

    await this.usersService.updatePasswordResetToken(user.id, '');
  }
}
