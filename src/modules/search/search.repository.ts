import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchBoards(userId: string, query: string, dateFrom?: Date | null) {
    const whereClause: any = {
      userId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    if (dateFrom) {
      whereClause.createdAt = { gte: dateFrom };
    }

    return this.prisma.board.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        position: true,
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async searchColumns(
    userId: string,
    query: string,
    dateFrom?: Date | null,
    // boardId: string,
  ) {
    const whereClause: any = {
      board: { userId },
      title: { contains: query, mode: 'insensitive' },
    };

    if (dateFrom) {
      whereClause.createdAt = { gte: dateFrom };
    }

    return this.prisma.column.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        position: true,
        boardId: true,
        board: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async searchTasks(
    userId: string,
    query: string,
    searchInFields: string[] = ['title'],
    dateFrom?: Date | null,
  ) {
    const orConditions: any[] = [];

    if (searchInFields.includes('title')) {
      orConditions.push({ title: { contains: query, mode: 'insensitive' } });
    }

    if (searchInFields.includes('description')) {
      orConditions.push({
        description: { contains: query, mode: 'insensitive' },
      });
    }

    if (searchInFields.includes('tags')) {
      orConditions.push({ tags: { has: query } });
    }

    const whereClause: any = {
      column: { board: { userId } },
    };

    if (orConditions.length > 1) {
      whereClause.OR = orConditions;
    } else if (orConditions.length === 1) {
      Object.assign(whereClause, orConditions[0]);
    } else {
      whereClause.title = { contains: query, mode: 'insensitive' };
    }

    if (dateFrom) {
      whereClause.createdAt = { gte: dateFrom };
    }

    const result = this.prisma.task.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        deadline: true,
        position: true,
        priority: true,
        tags: true,
        columnId: true,
        column: {
          select: {
            id: true,
            title: true,
            boardId: true,
            board: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'asc' },
    });

    return result;
  }
}
