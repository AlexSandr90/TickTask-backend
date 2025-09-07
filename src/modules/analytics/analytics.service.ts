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
      lastHeartbeat?: Date;
    },
  ) {
    try {
      const currentAnalytics = await this.prisma.userAnalytics.findUnique({
        where: { userId },
      });

      if (!currentAnalytics) {
        // Если нет аналитики, создаём новую
        return this.prisma.userAnalytics.create({
          data: {
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
            lastHeartbeat: data.lastHeartbeat ?? undefined,
          },
        });
      }

      // ==== Логика для completedTasksTotal ====
      let newCompletedTasksTotal = currentAnalytics.completedTasksTotal;

      if (data.completedTasksTotal) {
        if (data.completedTasksTotal.increment) {
          newCompletedTasksTotal += data.completedTasksTotal.increment;
        }
        if (data.completedTasksTotal.decrement) {
          newCompletedTasksTotal -= data.completedTasksTotal.decrement;
        }
        if (data.completedTasksTotal.set !== undefined) {
          newCompletedTasksTotal = data.completedTasksTotal.set;
        }
      }

      // Обновляем аналитику
      return this.prisma.userAnalytics.update({
        where: { userId },
        data: {
          totalBoards:
            (data.totalBoards?.set ?? data.totalBoards?.increment)
              ? currentAnalytics.totalBoards +
                (data.totalBoards?.increment ?? 0)
              : undefined,
          totalColumns:
            (data.totalColumns?.set ?? data.totalColumns?.increment)
              ? currentAnalytics.totalColumns +
                (data.totalColumns?.increment ?? 0)
              : undefined,
          totalTasks:
            (data.totalTasks?.set ?? data.totalTasks?.increment)
              ? currentAnalytics.totalTasks + (data.totalTasks?.increment ?? 0)
              : undefined,
          completedTasks:
            (data.completedTasks?.set ?? data.completedTasks?.increment)
              ? currentAnalytics.completedTasks +
                (data.completedTasks?.increment ?? 0)
              : undefined,
          completedTasksTotal: newCompletedTasksTotal,
          inProgressTasks:
            (data.inProgressTasks?.set ?? data.inProgressTasks?.increment)
              ? currentAnalytics.inProgressTasks +
                (data.inProgressTasks?.increment ?? 0)
              : undefined,
          currentStreak:
            (data.currentStreak?.set ?? data.currentStreak?.increment)
              ? currentAnalytics.currentStreak +
                (data.currentStreak?.increment ?? 0)
              : undefined,
          longestStreak:
            (data.longestStreak?.set ?? data.longestStreak?.increment)
              ? currentAnalytics.longestStreak +
                (data.longestStreak?.increment ?? 0)
              : undefined,
          totalTimeSpent:
            (data.totalTimeSpent?.set ?? data.totalTimeSpent?.increment)
              ? currentAnalytics.totalTimeSpent +
                (data.totalTimeSpent?.increment ?? 0)
              : undefined,
          lastHeartbeat: data.lastHeartbeat ?? undefined,
        },
      });
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code?: string }).code === 'P2003'
      ) {
        console.error(`Analytics update failed: User ${userId} not found`);
        throw new BadRequestException(`User with ID ${userId} not found`);
      }
      throw error;
    }
  }

  async getTasksPerDay(userId: string) {
    // Получаем количество задач, сгруппированных по дню недели
    const result = await this.prisma.$queryRaw<
      { day: number; count: number }[]
    >`
      SELECT EXTRACT(DOW FROM "createdAt") AS day, COUNT(*) AS count
      FROM "Task"
      WHERE "userId" = ${userId}
      GROUP BY day
    `;

    // Создаём объект с начальными нулями для каждого дня
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts: Record<string, number> = Object.fromEntries(
      daysOfWeek.map((d) => [d, 0]),
    );

    result.forEach(({ day, count }) => {
      const d = Number(day); // ← приведение к числу
      const index = d === 0 ? 6 : d - 1;
      counts[daysOfWeek[index]] = Number(count);
    });

    return counts;
  }
}
