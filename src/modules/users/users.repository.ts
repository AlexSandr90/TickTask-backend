import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  // --------- FIND METHODS ---------

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findSafeUserByEmail(email: string) {
    const user = await this.findByEmail(email);

    if (!user) throw new Error('User not found');
    const { passwordHash, googleId, passwordResetToken, ...safeUser } = user;
    return safeUser;
  }

  async findUserByRefreshToken(refreshToken: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { refreshToken } });
  }

  async findUserByPasswordResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { passwordResetToken: token } });
  }

  async findByPasswordResetToken(resetToken: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { passwordResetToken: resetToken },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({ where: { googleId } });
  }

  // --------- USER OPERATIONS ---------

  async createUser(data: {
    username: string;
    email: string;
    passwordHash: string;
  }) {
    return await this.prisma.user.create({
      data: { ...data, isActive: false },
    });
  }

  async findOrCreateGoogleUser(googleUserData: {
    googleId: string;
    email: string;
    username: string;
    isActive?: boolean;
  }): Promise<User> {
    return this.prisma.user.upsert({
      where: { email: googleUserData.email },
      update: { googleId: googleUserData.googleId },
      create: {
        email: googleUserData.email,
        username: googleUserData.username,
        googleId: googleUserData.googleId,
        isActive:
          googleUserData.isActive !== undefined
            ? googleUserData.isActive
            : true,
      },
    });
  }

  async updateUser(
    email: string,
    updateData: Prisma.UserUpdateInput,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { email },
      data: updateData,
    });
  }

  async updateUserById(
    userId: string,
    updateData: Prisma.UserUpdateInput,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async removeUser(email: string): Promise<User> {
    return this.prisma.user.delete({ where: { email } });
  }

  async activateUser(email: string): Promise<User> {
    return this.prisma.user.update({
      where: { email },
      data: { isActive: true },
    });
  }

  // TOKEN AND PASSWORD OPERATIONS

  async updateRefreshToken(
    userId: string,
    refreshToken: string | null,
  ): Promise<User> {
    return this.updateUserById(userId, { refreshToken });
  }

  async updatePassword(userId: string, passwordHash: string): Promise<User> {
    return this.updateUserById(userId, {
      passwordHash,
      passwordResetToken: null,
    });
  }

  async updatePasswordResetToken(
    userId: string,
    resetToken: string | null,
  ): Promise<User> {
    return this.updateUserById(userId, { passwordResetToken: resetToken });
  }

  // --------- AVATAR ---------

  async updateAvatarPath(userId: string, avatarPath: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarPath },
    });
  }
}
