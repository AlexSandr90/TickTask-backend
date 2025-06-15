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
    position?: number,
  ) {
    const updatedColumn = await this.columnRepository.update(id, { title, position });
    return updatedColumn;
  }

  async updateColumnPositions(
    boardId: string,
    updates: { id: string; newIndex: number }[]
  ) {
    const columns = await this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });

    const newOrder = [...columns];

    for (const { id, newIndex } of updates) {
      const currentIndex = newOrder.findIndex((col) => col.id === id);
      if (currentIndex === -1) continue;

      const [moved] = newOrder.splice(currentIndex, 1);
      newOrder.splice(newIndex, 0, moved);
    }

    const transactions = newOrder.map((col, idx) =>
      this.prisma.column.update({
        where: { id: col.id },
        data: { position: idx + 1 },
      })
    );

    return this.prisma.$transaction(transactions);
  }

  async deleteColumn(id: string) {
    return this.columnRepository.delete(id);
  }
}
