// src/services/achievement.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AchievementDefinitionDto,
  CreateAchievementDefinitionDto,
  UserAchievementResponseDto,
} from './achievement.dto';

@Injectable()
export class AchievementService {
  constructor(private prisma: PrismaService) {}

  // Создание определения достижения
  async createAchievementDefinition(
    dto: CreateAchievementDefinitionDto,
  ): Promise<AchievementDefinitionDto> {
    const achievement = await this.prisma.achievementDefinition.create({
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        icon: dto.icon || null,
      },
    });

    return {
      ...achievement,
      icon: achievement.icon || undefined, // Преобразуем null в undefined если нужно
    };
  }

  // Получение всех определений достижений
  async getAllAchievementDefinitions(): Promise<AchievementDefinitionDto[]> {
    const achievements = await this.prisma.achievementDefinition.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return achievements.map((achievement) => ({
      ...achievement,
      icon: achievement.icon || undefined, // Преобразуем null в undefined если нужно
    }));
  }

  // Разблокировка достижения для пользователя
  async unlockAchievement(
    userId: string,
    achievementType: string,
  ): Promise<boolean> {
    try {
      // Проверяем, существует ли такое достижение
      const achievementDefinition =
        await this.prisma.achievementDefinition.findUnique({
          where: { type: achievementType },
        });

      if (!achievementDefinition) {
        console.warn(`Achievement definition not found: ${achievementType}`);
        return false;
      }

      // Проверяем, не разблокировано ли уже это достижение
      const existingAchievement = await this.prisma.userAchievement.findUnique({
        where: {
          userId_achievementId: {
            userId,
            achievementId: achievementDefinition.id,
          },
        },
      });

      if (existingAchievement) {
        return false; // Уже разблокировано
      }

      // Разблокируем достижение
      await this.prisma.userAchievement.create({
        data: {
          userId,
          achievementId: achievementDefinition.id,
          unlockedAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      return false;
    }
  }

  // Получение всех достижений пользователя
  async getUserAchievements(
    userId: string,
  ): Promise<UserAchievementResponseDto[]> {
    // Получаем все определения достижений
    const allAchievements = await this.prisma.achievementDefinition.findMany();

    // Получаем разблокированные достижения пользователя
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    // Создаем карту разблокированных достижений
    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]),
    );

    // Формируем ответ со всеми достижениями
    return allAchievements.map((achievement) => ({
      id: achievement.id,
      type: achievement.type,
      name: achievement.title, // title → name
      description: achievement.description,
      iconUrl: achievement.icon || '', // icon → iconUrl
      unlockedAt: unlockedMap.get(achievement.id) || null,
      unlocked: unlockedMap.has(achievement.id), // isUnlocked → unlocked
      progress: undefined, // если нужен прогресс
    }));
  }

  // Проверка достижения "Первая доска"
  async checkFirstBoardAchievement(userId: string): Promise<void> {
    const boardCount = await this.prisma.board.count({
      where: { userId },
    });

    if (boardCount === 1) {
      await this.unlockAchievement(userId, 'first-board');
    }
  }

  async checkFirstColumnAchievement(userId: string): Promise<void> {
    const columnCount = await this.prisma.column.count({
      where: {
        board: {
          userId: userId, // через доску связанной с пользователем
        },
      },
    });

    if (columnCount === 1) {
      await this.unlockAchievement(userId, 'first-colum');
    }
  }

  // Проверка достижения "Первая задача"
  async checkFirstTaskAchievement(userId: string): Promise<void> {
    const taskCount = await this.prisma.task.count({
      where: { userId },
    });

    if (taskCount === 1) {
      await this.unlockAchievement(userId, 'first-task');
    }
  }

  // Проверка достижений стрика
  async checkStreakAchievements(
    userId: string,
    streakDays: number,
  ): Promise<void> {
    const streakAchievements = [
      { days: 3, type: 'streak-3-days' },
      { days: 5, type: 'streak-5-days' },
      { days: 7, type: 'streak-week' },
      { days: 14, type: 'streak-2-weeks' },
      { days: 30, type: 'streak-month' },
    ];

    for (const streak of streakAchievements) {
      if (streakDays >= streak.days) {
        await this.unlockAchievement(userId, streak.type);
      }
    }
  }

  // Инициализация базовых достижений (вызывать при запуске приложения)
  async initializeBasicAchievements(): Promise<{
    message: string;
    count: number;
  }> {
    const basicAchievements = [
      {
        type: 'first-board',
        title: 'Первая доска',
        description: 'Создайте свою первую доску',
        icon: '/achievements/bord.png',
      },
      {
        type: 'first-colum',
        title: 'Первая колонка',
        description: 'Создайте свою первую задачу',
        icon: '/achievements/colum.png',
      },
      {
        type: 'streak-3-days',
        title: 'Трёхдневный стрик',
        description: 'Заходите в приложение 3 дня подряд',
        icon: '/icons/streak-3.svg',
      },
      {
        type: 'streak-5-days',
        title: 'Пятидневный стрик',
        description: 'Заходите в приложение 5 дней подряд',
        icon: '/icons/streak-5.svg',
      },
      {
        type: 'streak-week',
        title: 'Неделя подряд',
        description: 'Заходите в приложение неделю подряд',
        icon: '/icons/streak-week.svg',
      },
      {
        type: 'streak-2-weeks',
        title: 'Две недели подряд',
        description: 'Заходите в приложение 2 недели подряд',
        icon: '/icons/streak-2weeks.svg',
      },
      {
        type: 'streak-month',
        title: 'Месяц подряд',
        description: 'Заходите в приложение месяц подряд',
        icon: '/icons/streak-month.svg',
      },
    ];

    let processedCount = 0;

    for (const achievement of basicAchievements) {
      try {
        await this.prisma.achievementDefinition.upsert({
          where: { type: achievement.type },
          update: {
            title: achievement.title,
            description: achievement.description,
            icon: achievement.icon,
          },
          create: achievement,
        });
        processedCount++;
      } catch (error) {
        console.warn(
          `Ошибка при обработке достижения ${achievement.type}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }

    return {
      message: 'Базовые достижения успешно инициализированы/обновлены',
      count: processedCount,
    };
  }
}
