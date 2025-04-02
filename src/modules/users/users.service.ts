import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
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
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }
    const { passwordHash, googleId, passwordResetToken, ...safeUser } = user;
    return safeUser;
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
        isActive: false,
      },
    });
  }

  async update(email: string, data: UpdateUserDto) {
    const { isActive, ...updateData } = data;

    const user = await this.prisma.user.update({
      where: { email },
      data: updateData,
    });

    if (!user) throw new NotFoundException('Не удалось обновить пользователя');

    const { refreshToken, passwordHash, ...safeUser } = user;

    return safeUser;
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

  async sendMagicLink(email: string) {
    if (!email) {
      throw new BadRequestException('Email не передан');
    }

    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Пользователь с таким email не найден');
    }

    const token = generateJwtToken(email, user.id);
    const magicLink = `https://ticktask-backend.onrender.com/users/activate/${token}`;

    try {
      await sendVerificationEmail(email, 'Your Magic Link', magicLink);
    } catch (error) {
      throw new InternalServerErrorException('Ошибка отправки письма');
    }

    return { message: 'Verification email sent.' };
  }

  async activateUserByToken(token: string) {
    if (!token) {
      throw new BadRequestException('Токен не передан');
    }

    let email: string;

    try {
      const decoded = verifyJwtToken(token);
      email = decoded.email;
    } catch (error) {
      throw new BadRequestException(
        `Неверная ссылка или срок действия истёк. Ошибка: ${error.message}`,
      );
    }

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (user.isActive) {
      throw new BadRequestException('Пользователь уже активирован');
    }

    try {
      const updatedUser = await this.prisma.user.update({
        where: { email },
        data: { isActive: true },
      });

      return { message: 'User successfully activated', user: updatedUser };
    } catch (error) {
      throw new InternalServerErrorException(
        'Не удалось активировать пользователя',
      );
    }
  }

  async findOrCreateGoogleUser(data: {
    googleId: string;
    email: string;
    username: string;
  }): Promise<any> {
    try {
      if (!data.googleId || !data.email || !data.username) {
      }

      let user = await this.prisma.user.findUnique({
        where: { googleId: data.googleId },
      });

      if (!user) {
        user = await this.prisma.user.findUnique({
          where: { email: data.email },
        });
      }

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            googleId: data.googleId,
            email: data.email,
            username: data.username,
          },
        });
      } else {
      }

      return user;
    } catch (error) {
      throw new Error('Error while finding or creating Google user');
    }
  }

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedPassword },
    });
  }

  async updatePasswordResetToken(userId: string, resetToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordResetToken: resetToken },
    });
  }

  async findByPasswordResetToken(resetToken: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: resetToken,
      },
    });

    if (!user) {
      throw new NotFoundException('Неверный или устаревший токен');
    }

    return user;
  }
}
