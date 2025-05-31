import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.board.findMany({ where: { userId } });
  }

  async findAllWithColumns(userId: string, position: 'asc' | 'desc') {
    return this.prisma.board.findMany({
      where: { userId },
      include: {
        columns: {
          orderBy: { position },
          include: {
            tasks: { orderBy: { position } },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.board.findUnique({ where: { id } });
  }

  async findOneWithColumns(id: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position },
          include: {
            tasks: { orderBy: { position } },
          },
        },
      },
    });
  }

  async findOneByUserAndId(id: string, userId: string) {
    return this.prisma.board.findFirst({
      where: { id, userId },
    });
  }

  async findOneByUserAndIdWithColumns(
    id: string,
    userId: string,
    position: 'asc' | 'desc',
  ) {
    return this.prisma.board.findFirst({
      where: { id, userId },
      include: {
        columns: {
          orderBy: { position },
          include: {
            tasks: { orderBy: { position } },
          },
        },
      },
    });
  }

  async create(boardData: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        title: boardData.title,
        description: boardData.description,
        userId: boardData.userId,
      },
    });
  }

  async update(id: string, data: UpdateBoardDto) {
    return this.prisma.board.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.board.delete({ where: { id } });
  }
}
