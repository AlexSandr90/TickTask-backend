import {
  Injectable,
  UnauthorizedException,
  Response,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserWithoutPassword } from '../users/interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { AUTH_CONFIG } from '../../configurations/auth.config';
import { randomBytes } from 'crypto';
import { APP_CONFIG } from '../../configurations/app.config';
import { sendPasswordResetEmail } from '../../email/email.service';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    username: string,
    email: string,
    password: string,
    confirmPassword: string,
  ): Promise<UserWithoutPassword> {
    if (password !== confirmPassword) {
      throw new UnauthorizedException('Passwords not match!');
    }

    const existUser = await this.usersRepository.findByEmail(email);

    if (existUser) {
      throw new UnauthorizedException('A user with this email already exists.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.usersRepository.createUser({
      username,
      email,
      passwordHash: hashedPassword,
    });
    const { passwordHash, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
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
    const user = await this.usersRepository.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Incorrect email or password!');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Incorrect email or password!');
    }

    const { accessToken } = await this.generateTokens(user);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: AUTH_CONFIG.expireJwt,
      path: '/',
      sameSite: 'None',
    });

    return res
      .status(HttpStatus.OK)
      .json({ message: 'Successfully logged in' });
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

      const { accessToken: newAccessToken } = await this.generateTokens(user);

      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: true,
        maxAge: AUTH_CONFIG.expireJwt,
        path: '/',
        sameSite: 'None',
      });

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

    await sendPasswordResetEmail(email, 'Password Reset', resetLink);
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
}
