import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserDto } from './dto/user.dto';
import { generateJwtToken, verifyJwtToken } from '../../common/utils/jwt.util';
import { sendVerificationEmail } from '../../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(email: string) {
    console.log('🔍 findOne called with email:', email); // Логируем перед запросом

    const user = await this.prisma.user.findUnique({
      where: {
        email, // Ищем по email
      },
    });

    if (!user) {
      console.error(`❌ User not found with email: ${email}`);
      throw new Error('User not found');
    }

    return user;

  }
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async createUser(username: string, email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        isActive: false, // Статус пользователя по умолчанию неактивен
      },
    });
  }

  async update(email: string, data: UpdateUserDto) {
    const { isActive, ...updateData } = data; // Оставляем isActive без изменений, если оно не передано

    const user = await this.prisma.user.update({
      where: { email },
      data: updateData, // Передаем только данные для обновления, кроме isActive
    });

    if (!user) throw new NotFoundException('Не удалось обновить пользователя');
    return user;
  }

  async remove(email: string) {
    const user = await this.prisma.user.delete({ where: { email } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return { message: 'Пользователь успешно удалён' };
  }

  async updateRefreshToken(
    userId: string,
    refreshToken: string,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }

  // Новый метод для отправки магической ссылки
  async sendMagicLink(email: string) {
    // Проверяем, существует ли пользователь с данным email
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Пользователь с таким email не найден');
    }

    // Генерация токена для магической ссылки
    const token = generateJwtToken(email, user.id);

    // Формируем ссылку
    const magicLink = `https://ticktask-backend.onrender.com/users/activate/${token}`;

    // Отправка email с магической ссылкой
    await sendVerificationEmail(email, 'Your Magic Link', magicLink);

    return { message: 'Verification email sent.' };
  }

  async activateUserByToken(token: string) {
    let email: string;
    let userId: string;

    try {
      console.log('🔑 Пришёл токен для активации пользователя:', token);

      // Расшифровка токена и получение email и userId
      const decoded = verifyJwtToken(token); // Расшифровываем токен
      email = decoded.email;
      userId = decoded.sub; // Извлекаем userId из токена

      console.log('✅ Токен расшифрован, email:', email, 'userId:', userId); // Логируем email и userId
    } catch (error) {
      console.error('⛔ Ошибка при расшифровке токена:', error.message);
      throw new BadRequestException(`Неверная ссылка или срок действия ссылки истёк. Ошибка: ${error.message}`);
    }

    console.log('⚡ Обновление статуса пользователя на активного...');
    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { isActive: true },
    });

    console.log('✅ Пользователь успешно активирован:', updatedUser); // Логируем успешное обновление

    return { message: 'User successfully activated', user: updatedUser };
  }

  async findOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    username: string;
  }): Promise<any> {
    try {
      // Проверка на пустые значения
      if (!data.googleId || !data.email || !data.username) {
        throw new Error('Missing required fields: googleId, email, or username');
      }

      // Сначала ищем пользователя по googleId
      let user = await this.prisma.user.findUnique({
        where: { googleId: data.googleId },
      });

      // Если пользователь не найден по googleId, ищем по email
      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { email: data.email },
        });
      }

      // Если пользователь все еще не найден, создаем нового
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            googleId: data.googleId,
            email: data.email,
            username: data.username,
          },
        });
        console.log('Created new user:', user);
      } else {
        console.log('Found existing user:', user);
      }

      return user;
    } catch (error) {
      console.error('Error in findOrCreateGoogleUser:', error);
      throw new Error('Error while finding or creating Google user');
    }
  }

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword }, // Обновляем захэшированный пароль
    });

    return updatedUser;
  }

  async updatePasswordResetToken(userId: string, resetToken: string) {
    // Обновляем пользователя, добавляя токен сброса пароля
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: resetToken }, // добавляем поле токена сброса
    });

    return updatedUser;
  }

  async findByPasswordResetToken(resetToken: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: resetToken, // Используем правильное имя переменной
      },
    });

    if (!user) {
      throw new NotFoundException('Неверный или устаревший токен');
    }

    return user;
  }
}
