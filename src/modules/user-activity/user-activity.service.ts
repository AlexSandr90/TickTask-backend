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

  async updateUserActivity(userId: string, retry = 0): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new Error(`User ${userId} not found`);

      const analytics = await this.prisma.userAnalytics.findUnique({
        where: { userId },
      });

      if (!analytics) throw new Error(`Analytics for user ${userId} not found`);

      const now = new Date();
      const today = dayjs().startOf('day');

      // ======== Streak logic ========
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

      const lastHeartbeat = analytics.lastHeartbeat;
      const minutesSinceLastHeartbeat = lastHeartbeat
        ? (now.getTime() - lastHeartbeat.getTime()) / 60000
        : Infinity;

      const shouldIncrement = minutesSinceLastHeartbeat >= 1;

      // ======== Update user ========
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLogin: now,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
        },
      });

      // ======== Update analytics ========
      const updatedAnalytics = await this.analyticsService.updateAnalytics(
        userId,
        {
          totalTimeSpent: shouldIncrement ? { increment: 1 } : undefined,
          currentStreak: { set: newCurrentStreak },
          longestStreak: { set: newLongestStreak },
          lastHeartbeat: shouldIncrement ? now : undefined,
        },
      );

      return {
        ...updatedAnalytics,
        totalTimeSpentFormatted: this.formatTimeSpent(
          updatedAnalytics.totalTimeSpent,
        ),
      };
    } catch (err) {
      // Retry до 3 раз
      if (retry < 3) {
        return this.updateUserActivity(userId, retry + 1);
      }
      throw err;
    }
  }
}
