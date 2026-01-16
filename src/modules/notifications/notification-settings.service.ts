import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationSettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings(userId: string) {
    let settings = await this.prisma.notificationSettings.findUnique({
      where: { userId },
    });

    // Создаём настройки по умолчанию, если их нет
    if (!settings) {
      settings = await this.prisma.notificationSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateSettings(userId: string, data: Partial<any>) {
    return this.prisma.notificationSettings.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    });
  }

  async canSendNotification(
    userId: string,
    type: NotificationType,
  ): Promise<boolean> {
    const settings = await this.getSettings(userId);

    if (!settings.inAppEnabled) return false;

    // Проверяем тихий режим
    if (
      settings.quietHoursEnabled &&
      settings.quietHoursStart &&
      settings.quietHoursEnd
    ) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

      if (
        currentTime >= settings.quietHoursStart &&
        currentTime <= settings.quietHoursEnd
      ) {
        return false;
      }
    }

    // Проверяем настройки для конкретного типа
    const typeMapping: Record<NotificationType, keyof typeof settings> = {
      TASK_ASSIGNED: 'taskAssigned',
      TASK_DEADLINE_SOON: 'taskDeadlineSoon',
      TASK_OVERDUE: 'taskOverdue',
      TASK_COMPLETED: 'taskCompleted',
      TASK_COMMENTED: 'taskCommented',
      TASK_PRIORITY_CHANGED: 'taskPriorityChanged',
      BOARD_INVITATION: 'boardInvitation',
      BOARD_REMOVED: 'boardRemoved',
      BOARD_ROLE_CHANGED: 'boardRoleChanged',
      BOARD_DELETED: 'boardDeleted',
      NEW_BOARD_MEMBER: 'newBoardMember',
      ACHIEVEMENT_UNLOCKED: 'achievementUnlocked',
      STREAK_MILESTONE: 'streakMilestone',
    };

    const settingKey = typeMapping[type];
    return settings[settingKey] !== false;
  }
}
