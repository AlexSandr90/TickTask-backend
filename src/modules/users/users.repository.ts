import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(timezone);

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
    return this.prisma.user.findFirst({
      where: { passwordResetToken: resetToken },
    });
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async findOneByIdAndAvatarPath(id: string, avatarPath: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { avatarPath: true },
    });
  }

  // --------- USER OPERATIONS ---------

  async createUser(data: {
    username: string;
    email: string;
    passwordHash: string;
    timezone: string;
  }) {
    return this.prisma.user.create({
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

  async resetToDefaultAvatar(userId: string, avatarPath: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarPath },
    });
  }

  // ------------TIMEZONE------------

  updateTimezone(userId: string, timezone: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { timezone },
    });
  }

  isValidTimezone(timezone: string): boolean {
    try {
      dayjs().tz(timezone);
      return true;
    } catch (e) {
      return false;
    }
  }

  async findAll(): Promise<{ id: string; username: string; avatarPath: string | null }[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatarPath: true,
      },
    });
  }
}
