import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@Injectable()
export class BoardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.board.findMany();
  }

  async findOne(id: string) {
    return this.prisma.board.findUnique({ where: { id } });
  }

  async create(boardData: CreateBoardDto) {
    return this.prisma.board.create({
      data: {
        title: boardData.title,
        description: boardData.description,
        user: { connect: { id: boardData.userId } },
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
