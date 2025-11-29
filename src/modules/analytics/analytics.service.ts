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
        // Создаем новую запись, если нет
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

      // Функция для вычисления нового значения поля (поддерживает и number, и bigint)
      const computeNewValue = (
        current: number | bigint,
        update?: { increment?: number; decrement?: number; set?: number },
      ) => {
        if (!update) return undefined;
        if (update.set !== undefined) return update.set;

        // Безопасное преобразование bigint в number для вычислений
        let val = typeof current === 'bigint' ? Number(current) : current;

        if (update.increment) val += update.increment;
        if (update.decrement) val -= update.decrement;
        return val;
      };

      return this.prisma.userAnalytics.update({
        where: { userId },
        data: {
          totalBoards: computeNewValue(
            currentAnalytics.totalBoards,
            data.totalBoards,
          ),
          totalColumns: computeNewValue(
            currentAnalytics.totalColumns,
            data.totalColumns,
          ),
          totalTasks: computeNewValue(
            currentAnalytics.totalTasks,
            data.totalTasks,
          ),
          completedTasks: computeNewValue(
            currentAnalytics.completedTasks,
            data.completedTasks,
          ),
          completedTasksTotal: computeNewValue(
            currentAnalytics.completedTasksTotal,
            data.completedTasksTotal,
          ),
          inProgressTasks: computeNewValue(
            currentAnalytics.inProgressTasks,
            data.inProgressTasks,
          ),
          currentStreak: computeNewValue(
            currentAnalytics.currentStreak,
            data.currentStreak,
          ),
          longestStreak: computeNewValue(
            currentAnalytics.longestStreak,
            data.longestStreak,
          ),
          totalTimeSpent: computeNewValue(
            currentAnalytics.totalTimeSpent,
            data.totalTimeSpent,
          ),
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

  // Получаем статистику задач только за ТЕКУЩУЮ неделю (с понедельника)
  async getTasksPerDay(userId: string) {
    const result = await this.prisma.$queryRaw<
      { day: number; count: number }[]
    >`
      SELECT EXTRACT(DOW FROM "createdAt") AS day, COUNT(*) AS count
      FROM "Task"
      WHERE "userId" = ${userId}
        AND "createdAt" >= DATE_TRUNC('week', NOW())
      GROUP BY day
    `;

    // Создаём объект с начальными нулями для каждого дня
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const counts: Record<string, number> = Object.fromEntries(
      daysOfWeek.map((d) => [d, 0]),
    );

    result.forEach(({ day, count }) => {
      const d = Number(day);
      const index = d === 0 ? 6 : d - 1;
      counts[daysOfWeek[index]] = Number(count);
    });

    return counts;
  }

  // Упрощённый метод для обновления аналитики (используется в UserActivityService)
  async updateAnalyticsCustom(
    userId: string,
    data: {
      totalTimeSpentIncrement?: number;
      currentStreak?: number;
      longestStreak?: number;
      lastHeartbeat?: Date;
    },
  ) {
    return this.updateAnalytics(userId, {
      totalTimeSpent: data.totalTimeSpentIncrement
        ? { increment: data.totalTimeSpentIncrement }
        : undefined,
      currentStreak: data.currentStreak
        ? { set: data.currentStreak }
        : undefined,
      longestStreak: data.longestStreak
        ? { set: data.longestStreak }
        : undefined,
      lastHeartbeat: data.lastHeartbeat,
    });
  }
}