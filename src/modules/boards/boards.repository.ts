import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BoardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.board.findMany();
  }

  async findOne(id: string) {
    return this.prisma.board.findUnique({ where: { id } });
  }

  async create(boardData: {
    title: string;
    description: string;
    userId: string;
  }) {
    return this.prisma.board.create({
      data: {
        title: boardData.title,
        description: boardData.description,
        user: { connect: { id: boardData.userId } },
      },
    });
  }

  async update(id: string, data: { title?: string; description?: string }) {
    return this.prisma.board.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.board.delete({ where: { id } });
  }
}
