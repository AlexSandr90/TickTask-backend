import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(timezone);

type UserListItem = {
  id: string;
  username: string;
  avatarPath: string | null;
};

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

  async findUserByEmailWithRelations(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        boards: true, // Дошки, які створив користувач
        receivedInvitations: {
          // Запрошення, які отримав
          include: {
            board: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
        sentInvitations: {
          // Запрошення, які надіслав
          include: {
            board: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
        boardsMembers: {
          // Членство в дошках
          include: {
            board: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
        UserAchievement: {
          // Досягнення
          include: {
            // achievement: true,        // Якщо є модель Achievement
          },
        },
        UserAnalytics: true, // Аналітика
      },
    });
  }

  async findSafeUserByEmail(email: string) {
    const user = await this.findByEmail(email);

    if (!user) throw new Error('User not found');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    language?: string;
    timezone: string;
  }) {
    return this.prisma.user.create({
      data: {
        ...data,
        language: data.language || 'en', // 🔹 Дефолтный язык
        isActive: false,
      },
    });
  }

  async findOrCreateGoogleUser(googleUserData: {
    googleId: string;
    email: string;
    username: string;
    language?: string;
    isActive?: boolean;
  }): Promise<User> {
    return this.prisma.user.upsert({
      where: { email: googleUserData.email },
      update: {
        googleId: googleUserData.googleId,
        ...(googleUserData.language && { language: googleUserData.language }), // 🔹 Обновляем язык если передан
      },
      create: {
        email: googleUserData.email,
        username: googleUserData.username,
        googleId: googleUserData.googleId,
        language: googleUserData.language || 'en', // 🔹 Дефолтный язык
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

  async updateEmailChangeRequest(
    userId: string,
    pendingEmail: string,
    emailChangeToken: string,
  ): Promise<User> {
    return this.updateUserById(userId, {
      pendingEmail,
      emailChangeToken,
      isActive: false,
    });
  }

  async confirmEmailChange(token: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { emailChangeToken: token },
    });

    if (!user || !user.pendingEmail) {
      throw new Error('Invalid email change token or pending email not found');
    }

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        email: user.pendingEmail,
        pendingEmail: null,
        emailChangeToken: null,
        isActive: true,
      },
    });
  }

  async cancelEmailChange(userId: string): Promise<User> {
    return this.updateUserById(userId, {
      pendingEmail: null,
      emailChangeToken: null,
      isActive: true,
    });
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
    } catch {
      return false;
    }
  }

  // 🔹 ------------LANGUAGE------------

  async updateLanguage(userId: string, language: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { language },
    });
  }

  isValidLanguage(language: string): boolean {
    const supportedLanguages = ['en', 'ru', 'ua'];
    return supportedLanguages.includes(language);
  }

  // 🔹 Обновление lastLogin и опционально языка
  async updateLastLoginAndLanguage(
    userId: string,
    language?: string,
  ): Promise<User> {
    const updateData: Prisma.UserUpdateInput = {
      lastLogin: new Date(),
    };

    if (language && this.isValidLanguage(language)) {
      updateData.language = language;
    }

    return this.updateUserById(userId, updateData);
  }

  async findAll(): Promise<UserListItem[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatarPath: true,
      },
    });
  }
}
