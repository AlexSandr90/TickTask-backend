import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  AchievementDefinitionDto,
  CreateAchievementDefinitionDto,
  InitializeAchievementsResponseDto,
  UserAchievementResponseDto,
} from './achievement.dto';

@Injectable()
export class AchievementsService implements OnModuleInit {
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

  // 🔥 Новый метод — проверка, есть ли у пользователя ачивка
  async hasAchievement(
    userId: string,
    achievementType: string,
  ): Promise<boolean> {
    const achievementDefinition =
      await this.prisma.achievementDefinition.findUnique({
        where: { type: achievementType },
      });

    if (!achievementDefinition) return false;

    const existing = await this.prisma.userAchievement.findUnique({
      where: {
        userId_achievementId: {
          userId,
          achievementId: achievementDefinition.id,
        },
      },
    });

    return !!existing;
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
      await this.unlockAchievement(userId, 'first-column');
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
  async onModuleInit() {
    await this.initializeBasicAchievements();
  }

  public async initializeBasicAchievements(): Promise<InitializeAchievementsResponseDto> {
    const supabaseBaseUrl = process.env.SUPABASE_ACHIEVEMENTS_URL;

    const basicAchievements = [
      {
        type: 'first-board',
        title: 'Первая доска',
        description: 'Создайте свою первую доску',
        icon: `${supabaseBaseUrl}/first-board.png`,
      },
      {
        type: 'first-column',
        title: 'Первая колонка',
        description: 'Добавьте первую колонку',
        icon: `${supabaseBaseUrl}/first-column.png`,
      },
      {
        type: 'first-task',
        title: 'Первая карточка',
        description: 'Создайте свою первую карточку',
        icon: `${supabaseBaseUrl}/first-task.png`,
      },
      {
        type: 'five-minutes',
        title: 'Первые 5 минут',
        description: 'Проведите 5 минут в приложении',
        icon: `${supabaseBaseUrl}/five-minutes.png`,
      },
      {
        type: 'streak-3-days',
        title: 'Серия 3 дня',
        description: 'Используйте приложение 3 дня подряд',
        icon: `${supabaseBaseUrl}/streak-3-days.png`,
      },
      {
        type: 'streak-5-days',
        title: 'Серия 5 дней',
        description: 'Используйте приложение 5 дней подряд',
        icon: `${supabaseBaseUrl}/streak-5-days.png`,
      },
      {
        type: 'streak-week',
        title: 'Неделя подряд',
        description: 'Заходите в приложение неделю подряд',
        icon: `${supabaseBaseUrl}/streak-week.png`,
      },
      {
        type: 'streak-2-weeks',
        title: 'Две недели подряд',
        description: 'Заходите в приложение 2 недели подряд',
        icon: `${supabaseBaseUrl}/streak-2-weeks.png`,
      },
      {
        type: 'streak-month',
        title: 'Месяц подряд',
        description: 'Заходите в приложение месяц подряд',
        icon: `${supabaseBaseUrl}/streak-month.png`,
      },
    ];

    const typesToKeep = basicAchievements.map((a) => a.type);

    // Удаляем все, чего нет в актуальном списке
    await this.prisma.achievementDefinition.deleteMany({
      where: { type: { notIn: typesToKeep } },
    });

    // Обновляем или создаем актуальные достижения
    let processedCount = 0;
    for (const achievement of basicAchievements) {
      const existing = await this.prisma.achievementDefinition.findUnique({
        where: { type: achievement.type },
      });
      if (existing) {
        await this.prisma.achievementDefinition.update({
          where: { type: achievement.type },
          data: achievement,
        });
      } else {
        await this.prisma.achievementDefinition.create({ data: achievement });
      }
      processedCount++;
    }

    return {
      message: 'Базовые достижения успешно синхронизированы',
      count: processedCount,
    };
  }
}
