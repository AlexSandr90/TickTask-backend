import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

@Injectable()
export class DeadlineCheckerService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Проверяем каждый час
  @Cron(CronExpression.EVERY_HOUR)
  async checkUpcomingDeadlines() {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        deadline: {
          gte: now,
          lte: in24Hours,
        },
        isCompleted: false,
        assigneeId: { not: null },
      },
      include: {
        assignee: true,
      },
    });

    for (const task of tasks) {
      if (!task.assigneeId) continue;

      const hoursLeft = Math.round(
        (task.deadline!.getTime() - now.getTime()) / (1000 * 60 * 60),
      );

      await this.notificationsService.notifyTaskDeadlineSoon(
        task.id,
        task.assigneeId,
        task.title,
        hoursLeft,
      );
    }
  }

  // Проверяем просроченные задачи каждый день в 9:00
  @Cron('0 9 * * *')
  async checkOverdueTasks() {
    const now = new Date();

    const tasks = await this.prisma.task.findMany({
      where: {
        deadline: { lt: now },
        isCompleted: false,
        assigneeId: { not: null },
      },
    });

    for (const task of tasks) {
      if (!task.assigneeId) continue;

      await this.notificationsService.notifyTaskOverdue(
        task.id,
        task.assigneeId,
        task.title,
      );
    }
  }
  async testNotificationsNow() {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Берём задачи на ближайшие 24 часа
    const tasks = await this.prisma.task.findMany({
      where: {
        deadline: {
          gte: now,
          lte: in24Hours,
        },
        isCompleted: false,
        assigneeId: { not: null },
      },
      include: { assignee: true },
    });

    console.log(`Найдено задач: ${tasks.length}`);

    for (const task of tasks) {
      if (!task.assigneeId) continue;

      const hoursLeft = Math.round(
        (task.deadline!.getTime() - now.getTime()) / (1000 * 60 * 60),
      );

      const notification =
        await this.notificationsService.notifyTaskDeadlineSoon(
          task.id,
          task.assigneeId,
          task.title,
          hoursLeft,
        );

      if (notification) {
        console.log(
          'Уведомление создано для задачи:',
          task.title,
          notification.id,
        );
      } else {
        console.log(
          'Уведомление не отправлено для задачи:',
          task.title,
          '(отключено пользователем)',
        );
      }
    }
  }
}
