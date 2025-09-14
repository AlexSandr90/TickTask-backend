import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import dayjs from 'dayjs';
import { UserActivityDto } from './dto/user-activiti.dto';

interface MotivationalMessage {
  emoji: string;
  text: string;
}

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

  /**
   * Генерирует мотивационное сообщение на основе общего времени в минутах
   * Теперь логика находится на сервере для безопасности
   */
  private getMotivationalMessage(totalMinutes: number): MotivationalMessage {
    const totalHours = Math.floor(totalMinutes / 60);

    if (totalHours < 1) {
      return { emoji: '🌱', text: 'Только начинаете!' };
    }
    if (totalHours < 10) {
      return { emoji: '🚀', text: 'Набираете обороты!' };
    }
    if (totalHours < 50) {
      return { emoji: '🔥', text: 'Горите! Продолжайте!' };
    }
    if (totalHours < 100) {
      return { emoji: '💪', text: 'Невероятная преданность!' };
    }
    return { emoji: '👑', text: 'Вы настоящий мастер!' };
  }

  /**
   * Вычисляет разбивку времени на годы, месяцы, дни, часы, минуты
   * Перенесено с фронта для консистентности данных
   */
  private calculateTimeBreakdown(totalMinutes: number) {
    let remainingMinutes = totalMinutes;

    const minutesInHour = 60;
    const hoursInDay = 24;
    const daysInMonth = 30;
    const monthsInYear = 12;

    const years = Math.floor(
      remainingMinutes /
        (minutesInHour * hoursInDay * daysInMonth * monthsInYear),
    );
    remainingMinutes -=
      years * minutesInHour * hoursInDay * daysInMonth * monthsInYear;

    const months = Math.floor(
      remainingMinutes / (minutesInHour * hoursInDay * daysInMonth),
    );
    remainingMinutes -= months * minutesInHour * hoursInDay * daysInMonth;

    const days = Math.floor(remainingMinutes / (minutesInHour * hoursInDay));
    remainingMinutes -= days * minutesInHour * hoursInDay;

    const hours = Math.floor(remainingMinutes / minutesInHour);
    remainingMinutes -= hours * minutesInHour;

    const minutes = remainingMinutes;

    return { years, months, days, hours, minutes };
  }

  async updateUserActivity(
    userId: string,
    secondsToAdd: number = 0,
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

      // ===== Обновление аналитики =====
      const updatedAnalytics =
        await this.analyticsService.updateAnalyticsCustom(userId, {
          totalTimeSpentIncrement: secondsToAdd > 0 ? secondsToAdd : undefined,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastHeartbeat: secondsToAdd > 0 ? now : undefined,
        });

      // ===== Convert BigInt to number safely =====
      const totalTimeSpentNumber = Number(updatedAnalytics.totalTimeSpent);

      // ===== Вычисляем мотивационное сообщение и разбивку времени =====
      const totalMinutes = Math.floor(totalTimeSpentNumber / 60);
      const motivationalMessage = this.getMotivationalMessage(totalMinutes);
      const timeBreakdown = this.calculateTimeBreakdown(totalMinutes);

      return {
        totalTimeSpent: totalTimeSpentNumber,
        totalTimeSpentFormatted: this.formatTimeSpent(totalTimeSpentNumber),
        currentStreak: updatedAnalytics.currentStreak,
        longestStreak: updatedAnalytics.longestStreak,
        lastHeartbeat: updatedAnalytics.lastHeartbeat ?? undefined,
        // ===== Новые поля для фронтенда =====
        motivationalMessage,
        timeBreakdown,
        totalHours: Math.floor(totalMinutes / 60),
        totalMinutes,
      };
    } catch (err: unknown) {
      if (retry < 3)
        return this.updateUserActivity(userId, secondsToAdd, retry + 1);
      if (err instanceof Error) throw err;
      throw new Error('Unknown error updating user activity');
    }
  }
}
