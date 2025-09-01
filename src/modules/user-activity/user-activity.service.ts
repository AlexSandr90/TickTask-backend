import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import dayjs from 'dayjs';

@Injectable()
export class UserActivityService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {}

  private formatTimeSpent(minutes: number): string {
    if (minutes <= 0) return '0 минут';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const hoursStr =
      hours > 0
        ? `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`
        : '';
    const minsStr =
      mins > 0
        ? `${mins} ${mins === 1 ? 'минута' : mins < 5 ? 'минуты' : 'минут'}`
        : '';
    return [hoursStr, minsStr].filter(Boolean).join(' ');
  }

  /**
   * Обновляет активность пользователя:
   * - lastLogin
   * - currentStreak / longestStreak
   * - totalTimeSpent (+1 минута)
   */
  async updateUserActivity(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error(`User ${userId} not found`);

    const now = dayjs();
    const today = now.startOf('day');

    let newCurrentStreak = user.currentStreak;
    let newLongestStreak = user.longestStreak;

    if (!user.lastLogin) {
      newCurrentStreak = 1;
      newLongestStreak = 1;
    } else {
      const lastLogin = dayjs(user.lastLogin).startOf('day');
      const daysDiff = today.diff(lastLogin, 'day');

      if (daysDiff === 1) {
        newCurrentStreak = user.currentStreak + 1;
        newLongestStreak = Math.max(user.longestStreak, newCurrentStreak);
      } else if (daysDiff > 1) {
        newCurrentStreak = 1;
      }
    }

    // Обновляем user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLogin: now.toDate(),
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
      },
    });

    // Обновляем UserAnalytics (+1 минута, streak)
    const analytics = await this.analyticsService.updateAnalytics(userId, {
      totalTimeSpent: { increment: 1 },
      currentStreak: { set: newCurrentStreak },
      longestStreak: { set: newLongestStreak },
    });

    // Возвращаем с читаемым totalTimeSpent
    return {
      ...analytics,
      totalTimeSpentFormatted: this.formatTimeSpent(analytics.totalTimeSpent),
    };
  }
}
