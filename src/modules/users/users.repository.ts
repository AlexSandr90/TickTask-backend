import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email } });

    if (!user) throw new Error('User not found');
    const { passwordHash, googleId, passwordResetToken, ...safeUser } = user;
    return safeUser;
  }

  async findByEmail(email: string) {
    return await this.prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: {
    username: string;
    email: string;
    passwordHash: string;
  }) {
    return await this.prisma.user.create({
      data: { ...data, isActive: false },
    });
  }

  async updateUser(email: string, updateData: any) {
    return await this.prisma.user.update({
      where: { email },
      data: updateData,
    });
  }

  async removeUser(email: string) {
    return await this.prisma.user.delete({ where: { email } });
  }

  async updateRefreshToken(userId: string, refreshToken: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  async activateUser(email: string) {
    return await this.prisma.user.update({
      where: { email },
      data: { isActive: true },
    });
  }

  async findByGoogleId(googleId: string) {
    return await this.prisma.user.findUnique({ where: { googleId } });
  }

  async createGoogleUser(data: {
    googleId: string;
    email: string;
    username: string;
  }) {
    return await this.prisma.user.create({
      data: {
        googleId: data.googleId,
        email: data.email,
        username: data.username,
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  async updatePasswordResetToken(userId: string, resetToken: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: resetToken },
    });
  }

  async findByPasswordResetToken(resetToken: string) {
    return await this.prisma.user.findFirst({
      where: { passwordResetToken: resetToken },
    });
  }

  async updateAvatarPath(userId: string, avatarPath: string) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { avatarPath },
    });
  }
}
