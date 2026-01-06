import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationSettingsService } from './notification-settings.service';
import { FcmService } from './fcm.service';
import { NotificationType } from '@prisma/client';

interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedTaskId?: string;
  relatedBoardId?: string;
  relatedUserId?: string;
  metadata?: any;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private readonly settingsService: NotificationSettingsService,
    private readonly fcmService: FcmService,
  ) {}

  async createNotification(data: CreateNotificationData) {
    // Проверяем настройки пользователя
    const canSend = await this.settingsService.canSendNotification(
      data.userId,
      data.type,
    );

    if (!canSend) {
      return null;
    }

    // Создаём уведомление в БД
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        ...(data.relatedTaskId && { relatedTaskId: data.relatedTaskId }),
        ...(data.relatedBoardId && { relatedBoardId: data.relatedBoardId }),
        ...(data.relatedUserId && { relatedUserId: data.relatedUserId }),
        ...(data.metadata && { metadata: data.metadata }),
      },
    });

    // Отправляем push-уведомление
    const settings = await this.settingsService.getSettings(data.userId);

    if (settings?.pushEnabled) {
      await this.fcmService.sendToUser(data.userId, {
        title: data.title,
        body: data.message,
        data: {
          notificationId: notification.id,
          type: data.type,
          ...(data.relatedTaskId && { relatedTaskId: data.relatedTaskId }),
          ...(data.relatedBoardId && { relatedBoardId: data.relatedBoardId }),
        },
      });
    }

    return notification;
  }

  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    // ✅ Запрашиваем всё параллельно для производительности
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.notification.count({
        where: { userId },
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    // ✅ Возвращаем объект с полной информацией
    return {
      notifications,
      total,
      unreadCount,
    };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Проверка, что уведомление принадлежит пользователю
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });
  }

  async deleteAllNotifications(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  // Хелперы для создания конкретных типов уведомлений

  async notifyTaskAssigned(
    taskId: string,
    assigneeId: string,
    assignerName: string,
    taskTitle: string,
  ) {
    return this.createNotification({
      userId: assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'Новая задача',
      message: `${assignerName} назначил вам задачу: ${taskTitle}`,
      relatedTaskId: taskId,
    });
  }

  async notifyTaskDeadlineSoon(
    taskId: string,
    userId: string,
    taskTitle: string,
    hoursLeft: number,
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.TASK_DEADLINE_SOON,
      title: 'Приближается дедлайн',
      message: `До дедлайна задачи "${taskTitle}" осталось ${hoursLeft}ч`,
      relatedTaskId: taskId,
    });
  }

  async notifyTaskOverdue(taskId: string, userId: string, taskTitle: string) {
    return this.createNotification({
      userId,
      type: NotificationType.TASK_OVERDUE,
      title: 'Задача просрочена',
      message: `Задача "${taskTitle}" просрочена`,
      relatedTaskId: taskId,
    });
  }

  async notifyTaskCompleted(
    taskId: string,
    creatorId: string,
    completedBy: string,
    taskTitle: string,
  ) {
    return this.createNotification({
      userId: creatorId,
      type: NotificationType.TASK_COMPLETED,
      title: 'Задача выполнена',
      message: `${completedBy} выполнил задачу: ${taskTitle}`,
      relatedTaskId: taskId,
    });
  }

  async notifyBoardInvitation(
    invitationId: string,
    userId: string,
    boardTitle: string,
    senderName: string,
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.BOARD_INVITATION,
      title: 'Приглашение на доску',
      message: `${senderName} пригласил вас на доску "${boardTitle}"`,
      relatedBoardId: invitationId,
    });
  }

  async notifyAchievementUnlocked(
    userId: string,
    achievementTitle: string,
    achievementDescription: string,
  ) {
    return this.createNotification({
      userId,
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      title: '🏆 Достижение разблокировано!',
      message: `${achievementTitle}: ${achievementDescription}`,
    });
  }
}
