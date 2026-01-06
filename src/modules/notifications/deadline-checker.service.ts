import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class DeadlineCheckerService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // ✅ Теперь этот метод реально запускает проверку для тестов
  async testNotificationsNow() {
    console.log('--- 🧪 Ручной запуск проверки дедлайнов ---');
    await this.checkUpcomingDeadlines();
    await this.checkOverdueTasks();
    console.log('--- ✅ Ручная проверка завершена ---');
  }

  // Проверка задач, срок которых скоро истечет (раз в час)
  @Cron(CronExpression.EVERY_HOUR)
  async checkUpcomingDeadlines() {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const twentyHoursAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        deadline: { gte: now, lte: in24Hours },
        isCompleted: false,
      },
    });

    console.log(
      `[Deadline] Найдено задач с близким дедлайном: ${tasks.length}`,
    );

    for (const task of tasks) {
      const recipientId = task.assigneeId || task.userId;
      if (!recipientId) continue;

      // Защита от спама (не чаще чем раз в 20 часов)
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          userId: recipientId,
          relatedTaskId: task.id,
          type: NotificationType.TASK_DEADLINE_SOON,
          createdAt: { gte: twentyHoursAgo },
        },
      });

      if (alreadyNotified) {
        console.log(
          `[Deadline] Уведомление для "${task.title}" уже отправлялось недавно. Пропуск.`,
        );
        continue;
      }

      const hoursLeft = Math.round(
        (task.deadline!.getTime() - now.getTime()) / (1000 * 60 * 60),
      );

      await this.notificationsService.notifyTaskDeadlineSoon(
        task.id,
        recipientId,
        task.title,
        hoursLeft,
      );
      console.log(
        `[Deadline] Уведомление для "${task.title}" отправлено пользователю ${recipientId}`,
      );
    }
  }

  // Проверка просроченных задач (каждый день в 9 утра)
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkOverdueTasks() {
    const now = new Date();

    const tasks = await this.prisma.task.findMany({
      where: {
        deadline: { lt: now },
        isCompleted: false,
      },
    });

    console.log(`[Overdue] Найдено просроченных задач: ${tasks.length}`);

    for (const task of tasks) {
      const recipientId = task.assigneeId || task.userId;
      if (!recipientId) continue;

      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          userId: recipientId,
          relatedTaskId: task.id,
          type: NotificationType.TASK_OVERDUE,
        },
      });

      if (alreadyNotified) continue;

      await this.notificationsService.notifyTaskOverdue(
        task.id,
        recipientId,
        task.title,
      );
      console.log(
        `[Overdue] Уведомление о просрочке "${task.title}" отправлено.`,
      );
    }
  }
}
