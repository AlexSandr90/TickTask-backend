import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import dayjs from 'dayjs';
import { UserActivityDto } from './dto/user-activiti.dto';

@Injectable()
export class UserActivityService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
  ) {}

  private formatTimeSpent(seconds: number): string {
    if (seconds <= 0) return '0 секунд';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const hoursStr =
      hours > 0
        ? `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`
        : '';
    const minsStr =
      mins > 0
        ? `${mins} ${mins === 1 ? 'минута' : mins < 5 ? 'минуты' : 'минут'}`
        : '';
    const secsStr =
      secs > 0
        ? `${secs} ${secs === 1 ? 'секунда' : secs < 5 ? 'секунды' : 'секунд'}`
        : '';

    return [hoursStr, minsStr, secsStr].filter(Boolean).join(' ');
  }

  async updateUserActivity(
    userId: string,
    secondsToAdd: number = 0, // теперь сервер принимает секунды
    retry = 0,
  ): Promise<UserActivityDto> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error(`User ${userId} not found`);

      const analytics = await this.prisma.userAnalytics.findUnique({
        where: { userId },
      });
      if (!analytics) throw new Error(`Analytics for user ${userId} not found`);

      const now = new Date();
      const today = dayjs().startOf('day');

      // ===== Streak logic =====
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

      // ===== Update user =====
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lastLogin: now,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
        },
      });

      // ===== Update analytics =====
      const updatedAnalytics = await this.analyticsService.updateAnalytics(
        userId,
        {
          totalTimeSpent:
            secondsToAdd > 0
              ? { increment: secondsToAdd } // прибавляем секунды
              : undefined,
          currentStreak: { set: newCurrentStreak },
          longestStreak: { set: newLongestStreak },
          lastHeartbeat: secondsToAdd > 0 ? now : undefined,
        },
      );

      return {
        totalTimeSpent: updatedAnalytics.totalTimeSpent,
        totalTimeSpentFormatted: this.formatTimeSpent(
          updatedAnalytics.totalTimeSpent,
        ),
        currentStreak: updatedAnalytics.currentStreak,
        longestStreak: updatedAnalytics.longestStreak,
        lastHeartbeat: updatedAnalytics.lastHeartbeat ?? undefined,
      };
    } catch (err: unknown) {
      if (retry < 3)
        return this.updateUserActivity(userId, secondsToAdd, retry + 1);
      if (err instanceof Error) throw err;
      throw new Error('Unknown error updating user activity');
    }
  }
}
