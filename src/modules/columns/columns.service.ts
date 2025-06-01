import { Injectable, NotFoundException } from '@nestjs/common';
import { ColumnsRepository } from './columns.repository';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ColumnsService {
  constructor(
    private readonly columnRepository: ColumnsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getAllColumns(boardId: string) {
    return this.columnRepository.findAll(boardId);
  }

  async findColumnById(id: string) {
    return this.columnRepository.findOne(id);
  }

  async createColumn(title: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with id ${boardId} not found!`);
    }

    return this.columnRepository.create({ title, boardId });
  }

  async updateColumn(
    id: string,
    title?: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    const updatedColumn = await this.columnRepository.update(
      id,
      { title },
      position,
    );
    return updatedColumn;
  }

  async updateColumnPositions(updates: { id: string; position: number }[]) {
    const transactions = updates.map(({ id, position }) => {
      return this.prisma.column.update({
        where: { id },
        data: { position },
      });
    });

    return this.prisma.$transaction(transactions);
  }

  async deleteColumn(id: string) {
    return this.columnRepository.delete(id);
  }
}
