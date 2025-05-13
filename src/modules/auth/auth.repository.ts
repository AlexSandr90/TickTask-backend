import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findUserByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { refreshToken } });
  }

  async updateUserRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async updateUserPasswordResetToken(
    userId: string,
    resetToken: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: resetToken },
    });
  }

  async findUserByPasswordResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { passwordResetToken: token } });
  }

  async updateUserPassword(
    userId: string,
    hashedPassword: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async createUser(
    username: string,
    email: string,
    hashedPassword: string,
  ): Promise<User> {
    return this.prisma.user.create({
      data: { username, email, passwordHash: hashedPassword },
    });
  }

  async findOrCreateGoogleUser(googleUserData: {
    googleId: string;
    email: string;
    username: string;
  }): Promise<User> {
    return this.prisma.user.upsert({
      where: { email: googleUserData.email },
      update: { googleId: googleUserData.googleId },
      create: {
        email: googleUserData.email,
        username: googleUserData.username,
        googleId: googleUserData.googleId,
      },
    });
  }
}
