import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import dayjs from 'dayjs';
import { UserActivityDto } from './dto/user-activiti.dto';
import { AchievementsService } from '../achievement/achievement.service';

interface MotivationalMessage {
  emoji: string;
  text: string;
}

@Injectable()
export class UserActivityService {
  constructor(
    private prisma: PrismaService,
    private analyticsService: AnalyticsService,
    private achievementsService: AchievementsService,
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

  private getMotivationalMessage(totalMinutes: number): MotivationalMessage {
    const totalHours = Math.floor(totalMinutes / 60);

    if (totalHours < 1) return { emoji: '🌱', text: 'Только начинаете!' };
    if (totalHours < 10) return { emoji: '🚀', text: 'Набираете обороты!' };
    if (totalHours < 50) return { emoji: '🔥', text: 'Горите! Продолжайте!' };
    if (totalHours < 100)
      return { emoji: '💪', text: 'Невероятная преданность!' };
    return { emoji: '👑', text: 'Вы настоящий мастер!' };
  }

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
      if (!user) {
        throw new NotFoundException(`User ${userId} not found`);
      }

      // ✅ Используем AnalyticsService - он создаст analytics если нет
      let analytics = await this.prisma.userAnalytics.findUnique({
        where: { userId },
      });

      // Если analytics нет - создаём через сервис
      if (!analytics) {
        analytics = await this.analyticsService.updateAnalytics(userId, {});
      }

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
      const updatedAnalytics =
        await this.analyticsService.updateAnalyticsCustom(userId, {
          totalTimeSpentIncrement: secondsToAdd > 0 ? secondsToAdd : undefined,
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastHeartbeat: secondsToAdd > 0 ? now : undefined,
        });

      const totalTimeSpentNumber = Number(updatedAnalytics.totalTimeSpent);

      // ===== Achievements: 5 minutes =====
      if (totalTimeSpentNumber >= 5 * 60) {
        await this.achievementsService.unlockAchievement(
          userId,
          'five-minutes',
        );
      }

      // ===== Achievements: Streaks =====
      await this.achievementsService.checkStreakAchievements(
        userId,
        newCurrentStreak,
      );

      // ===== Motivation and time breakdown =====
      const totalMinutes = Math.floor(totalTimeSpentNumber / 60);
      const motivationalMessage = this.getMotivationalMessage(totalMinutes);
      const timeBreakdown = this.calculateTimeBreakdown(totalMinutes);

      return {
        totalTimeSpent: totalTimeSpentNumber,
        totalTimeSpentFormatted: this.formatTimeSpent(totalTimeSpentNumber),
        currentStreak: updatedAnalytics.currentStreak,
        longestStreak: updatedAnalytics.longestStreak,
        lastHeartbeat: updatedAnalytics.lastHeartbeat ?? undefined,
        motivationalMessage,
        timeBreakdown,
        totalHours: Math.floor(totalMinutes / 60),
        totalMinutes,
      };
    } catch (err: unknown) {
      // Не повторяем, если это NotFoundException
      if (err instanceof NotFoundException) {
        throw err;
      }

      if (retry < 3) {
        return this.updateUserActivity(userId, secondsToAdd, retry + 1);
      }

      if (err instanceof Error) throw err;
      throw new Error('Unknown error updating user activity');
    }
  }

  // ✅ ИСПРАВЛЕННЫЙ МЕТОД
  async getUserActivityStatus(userId: string): Promise<UserActivityDto> {
    // Проверяем пользователя
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ✅ Получаем или создаём analytics через сервис
    const analytics = await this.analyticsService.updateAnalytics(userId, {});

    const totalMinutes = Math.floor(Number(analytics.totalTimeSpent) / 60);

    return {
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      totalTimeSpent: Number(analytics.totalTimeSpent),
      totalTimeSpentFormatted: this.formatTimeSpent(
        Number(analytics.totalTimeSpent),
      ),
      motivationalMessage: this.getMotivationalMessage(totalMinutes),
      timeBreakdown: this.calculateTimeBreakdown(totalMinutes),
      totalHours: Math.floor(totalMinutes / 60),
      totalMinutes,
      lastHeartbeat: analytics.lastHeartbeat ?? undefined,
    };
  }
}
