import { Injectable, NotFoundException } from '@nestjs/common';
import { ColumnsRepository } from './columns.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class ColumnsService {
  constructor(
    private readonly columnRepository: ColumnsRepository,
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  async getAllColumns(boardId: string) {
    return this.columnRepository.findAll(boardId);
  }

  async findColumnById(id: string) {
    return this.columnRepository.findOne(id);
  }

  async createColumn(title: string, boardId: string, userId: string) {
    const startTime = Date.now();

    // ✅ ВСЁ В ОДНОЙ ТРАНЗАКЦИИ - БЫСТРО И АТОМАРНО
    const column = await this.prisma.$transaction(async (tx) => {
      const boardStartTime = Date.now();

      // 1️⃣ Проверка доступа к доске (только нужное поле)
      const board = await tx.board.findUnique({
        where: { id: boardId },
        select: { userId: true }, // ✅ Только userId, не все поля
      });

      if (!board) {
        throw new NotFoundException(`Board with id ${boardId} not found!`);
      }

      console.log(`🔍 Board validated in ${Date.now() - boardStartTime}ms`);

      const columnStartTime = Date.now();

      // 2️⃣ Вычисляем позицию (быстро благодаря индексу)
      const lastColumn = await tx.column.findFirst({
        where: { boardId },
        orderBy: { position: 'desc' },
        select: { position: true }, // ✅ Только position
      });
      const finalPosition = (lastColumn?.position || 0) + 1000;

      console.log(
        `🔍 getNextPosition took ${Date.now() - columnStartTime}ms, next: ${finalPosition}`,
      );

      // 3️⃣ Создаём колонку
      const newColumn = await tx.column.create({
        data: {
          title,
          position: finalPosition,
          boardId,
        },
      });

      console.log(`✅ Column created in ${Date.now() - columnStartTime}ms`);

      const analyticsStartTime = Date.now();

      // 4️⃣ Обновляем аналитику
      await tx.userAnalytics.upsert({
        where: { userId },
        create: {
          userId,
          totalBoards: 0,
          totalColumns: 1,
          totalTasks: 0,
        },
        update: {
          totalColumns: { increment: 1 },
        },
      });

      console.log(
        `✅ Analytics updated in ${Date.now() - analyticsStartTime}ms`,
      );

      return newColumn;
    });

    console.log(`✅ Total createColumn time: ${Date.now() - startTime}ms`);

    return column;
  }

  async updateColumn(id: string, title?: string, position?: number) {
    const updatedColumn = await this.columnRepository.update(id, {
      title,
      position,
    });
    return updatedColumn;
  }

  async updateColumnPositions(
    boardId: string,
    updates: { id: string; position: number }[],
  ) {
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

  async searchColumnsInBoard(
    boardId: string,
    query: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    return this.columnRepository.searchColumnsInBoard(boardId, query, position);
  }

  async searchColumnsInUser(query: string, position: 'asc' | 'desc' = 'asc') {
    return this.columnRepository.searchColumnsInUser(query, position);
  }

  async deleteColumn(id: string) {
    return this.columnRepository.delete(id);
  }
}
