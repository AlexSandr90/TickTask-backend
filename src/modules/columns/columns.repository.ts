import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ColumnDto } from './dto/column.dto';
import { CreateColumnDto } from './dto/create-column.dto';

@Injectable()
export class ColumnsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(boardId: string) {
    return this.prisma.column.findMany({ where: { boardId } });
  }

  async findOne(id: string) {
    return this.prisma.column.findUnique({ where: { id } });
  }

  async create(columnData: CreateColumnDto) {
    return this.prisma.column.create({
      data: {
        title: columnData.title,
        board: { connect: { id: columnData.boardId } },
      },
    });
  }

  async update(id: string, data: ColumnDto) {
    return this.prisma.column.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.column.delete({ where: { id } });
  }
}
