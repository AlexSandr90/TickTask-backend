import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return await this.prisma.user.findFirst({
      where: { email },
    });
  }

  async findById(id: string) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByUserName(username: string) {
    return await this.prisma.user.findFirst({
      where: { username },
    });
  }

  async updateUser(id: string, username: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return null;
    }

    return await this.prisma.user.update({
      where: { id },
      data: {
        username,
        passwordHash: password,
      },
    });
  }

  async createUser(
    email: string,
    password: string,
  ): Promise<any> {
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    const { passwordHash: _, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }
}
