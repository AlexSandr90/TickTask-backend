import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ColumnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.column.findMany();
  }

  async findOne(id: string) {
    return this.prisma.column.findUnique({ where: { id } });
  }

  async create(columnData: { title: string; boardId: string }) {
    return this.prisma.column.create({
      data: {
        title: columnData.title,
        board: { connect: { id: columnData.boardId } },
      },
    });
  }

  async update(id: string, data: { title?: string; }) {
    return this.prisma.column.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.column.delete({ where: { id } });
  }
}
