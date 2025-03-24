import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserDto } from './dto/user.dto';
import { generateJwtToken, verifyJwtToken } from '../../common/utils/jwt.util';
import { sendVerificationEmail } from '../../email/email.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');

    const { passwordHash, ...userData } = user;
    return userData;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
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

  async update(id: string, data: UpdateUserDto) {
    const { isActive, ...updateData } = data; // Оставляем isActive без изменений, если оно не передано

    const user = await this.prisma.user.update({
      where: { id },
      data: updateData, // Передаем только данные для обновления, кроме isActive
    });

    if (!user) throw new NotFoundException('Не удалось обновить пользователя');
    return user;
  }

  async remove(id: string) {
    const user = await this.prisma.user.delete({ where: { id } });
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
    const token = generateJwtToken(email);

    // Отправка email с магической ссылкой
    await sendVerificationEmail(
      email,
      'Your Magic Link',
      `Here is your magic link: <your-link-to-activate>?token=${token}`,
    );

    return { message: 'Verification email sent.' };
  }

  // Новый метод для активации пользователя через магическую ссылку
  async activateUserByToken(token: string) {
    let email: string;

    try {
      email = verifyJwtToken(token); // Расшифровка токена и получение email
    } catch (error) {
      throw new BadRequestException(
        'Неверная ссылка или срок действия ссылки истёк',
      );
    }

    // Находим пользователя по email
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    // Если пользователь уже активирован, ничего не нужно делать
    if (user.isActive) {
      throw new BadRequestException('Пользователь уже активирован');
    }

    const updatedUser = await this.prisma.user.update({
      where: { email },
      data: { isActive: true },
    });

    return { message: 'User successfully activated', user: updatedUser };
  }
}
