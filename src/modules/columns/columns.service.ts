import { Injectable, NotFoundException } from '@nestjs/common';
import { ColumnsRepository } from './columns.repository';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ColumnsService {
  constructor(
    private readonly columnRepository: ColumnsRepository,
    private readonly prisma: PrismaService,
  ) { }

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
  async updateColumn(id: string, title?: string, position?: number) {
    const updatedColumn = await this.columnRepository.update(id, { title, position });
    return updatedColumn;
  }

  async updateColumnPositions(boardId: string, updates: { id: string; position: number }[]) {
    const columns = await this.prisma.column.findMany({
      where: { boardId },
      select: { id: true },
    });

    const existingIds = new Set(columns.map((col) => col.id));
    const filteredUpdates = updates.filter(({ id }) => existingIds.has(id));

    return this.prisma.$transaction(
      filteredUpdates.map(({ id, position }) =>
        this.prisma.column.update({
          where: { id },
          data: { position },
        }),
      ),
    );
  }

  async searchColumnsInBoard(boardId: string, query: string, position: 'asc' | 'desc' = 'asc') {
    return this.columnRepository.searchColumnsInBoard(boardId, query, position);
  }

  async searchColumnsInUser(query: string, position: 'asc' | 'desc' = 'asc') {
    return this.columnRepository.searchColumnsInUser(query, position);
  }

  async deleteColumn(id: string) {
    return this.columnRepository.delete(id);
  }
}
