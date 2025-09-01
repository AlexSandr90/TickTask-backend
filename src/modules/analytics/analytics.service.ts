import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async updateAnalytics(
    userId: string,
    data: {
      totalBoards?: { increment?: number; decrement?: number; set?: number };
      totalColumns?: { increment?: number; decrement?: number; set?: number };
      totalTasks?: { increment?: number; decrement?: number; set?: number };
      completedTasks?: { increment?: number; decrement?: number; set?: number };
      completedTasksTotal?: {
        increment?: number;
        decrement?: number;
        set?: number;
      };
      inProgressTasks?: {
        increment?: number;
        decrement?: number;
        set?: number;
      };
      currentStreak?: { increment?: number; decrement?: number; set?: number };
      longestStreak?: { increment?: number; decrement?: number; set?: number };
      totalTimeSpent?: { increment?: number; decrement?: number; set?: number };
    },
  ) {
    try {
      return await this.prisma.userAnalytics.upsert({
        where: { userId },
        update: data,
        create: {
          userId,
          totalBoards:
            data.totalBoards?.set ?? data.totalBoards?.increment ?? 0,
          totalColumns:
            data.totalColumns?.set ?? data.totalColumns?.increment ?? 0,
          totalTasks: data.totalTasks?.set ?? data.totalTasks?.increment ?? 0,
          completedTasks:
            data.completedTasks?.set ?? data.completedTasks?.increment ?? 0,
          completedTasksTotal:
            data.completedTasksTotal?.set ??
            data.completedTasksTotal?.increment ??
            0,
          inProgressTasks:
            data.inProgressTasks?.set ?? data.inProgressTasks?.increment ?? 0,
          currentStreak:
            data.currentStreak?.set ?? data.currentStreak?.increment ?? 0,
          longestStreak:
            data.longestStreak?.set ?? data.longestStreak?.increment ?? 0,
          totalTimeSpent:
            data.totalTimeSpent?.set ?? data.totalTimeSpent?.increment ?? 0,
        },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (
          error as {
            code?: string;
          }
        ).code === 'P2003'
      ) {
        console.error(`Analytics update failed: User ${userId} not found`);
        throw new BadRequestException(`User with ID ${userId} not found`);
      }
      throw error;
    }
  }
}
