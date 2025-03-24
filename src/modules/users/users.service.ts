import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return user;
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
      },
    });
  }

  async update(id: string, data: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    if (!user) throw new NotFoundException('Не удалось обновить пользователя');
    return user;
  }

  async remove(id: string) {
    const user = await this.prisma.user.delete({ where: { id } });
    if (!user) throw new NotFoundException('Пользователь не найден');
    return { message: 'Пользователь успешно удалён' };
  }

  async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken },
    });
  }
}
