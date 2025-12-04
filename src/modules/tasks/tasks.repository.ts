import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { getNextPosition } from '../../common/utils/position.util';
import { TaskForCalendarDto } from './dto/calendar-task.dto';
import { Task } from '@prisma/client';
import { AchievementsService } from '../achievement/achievement.service';

@Injectable()
export class TasksRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async findAll(columnId: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.task.findMany({
      where: { columnId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarPath: true,
          },
        },
      },
      orderBy: { position },
    });
  }

  async findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async getTaskById(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarPath: true,
          },
        },
        assignee: {
          select: {
            id: true,
            username: true,
            avatarPath: true,
          },
        },
      },
    });
  }

  async create(taskData: CreateTaskDto & { position?: number }) {
    const nextPosition = await getNextPosition(this.prisma, 'task', {
      columnId: taskData.columnId,
    });

    const task = await this.prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        position: nextPosition,
        priority: taskData.priority,
        tags: taskData.tags,
        userId: taskData.userId ?? null,
        columnId: taskData.columnId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarPath: true,
          },
        },
      },
    });

    // ✅ Проверяем достижение после создания
    if (task.userId) {
      await this.achievementsService.checkFirstTaskAchievement(task.userId);
    }

    return task;
  }

  async assignTask(taskId: string, assigneeId: string) {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { assigneeId },
    });
  }

  async update(
    id: string,
    data: {
      position?: number;
      columnId?: string;
      priority?: number;
      tags?: string[];
      userId?: string;
      title?: string;
      description?: string;
      deadline?: Date | null;
      isCompleted?: boolean; // <-- добавляем
    },
  ) {
    return this.prisma.task.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarPath: true,
          },
        },
      },
    });
  }

  async updateManyPositions(
    updates: { id: string; position: number; columnId: string }[],
  ) {
    const updatePromises = updates.map(({ id, position, columnId }) =>
      this.update(id, { position, columnId }),
    );
    return Promise.all(updatePromises);
  }

  async delete(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }

  async searchTasks(
    columnId: string,
    query: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    return this.prisma.task.findMany({
      where: {
        columnId,
        title: { contains: query, mode: 'insensitive' },
      },
      include: { user: true },
      orderBy: { position },
    });
  }

  async searchTasksInBoard(
    boardId: string,
    query: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    return this.prisma.task.findMany({
      where: {
        column: { boardId },
        title: { contains: query, mode: 'insensitive' },
      },
      include: { column: true, user: true },
      orderBy: { position },
    });
  }

  async searchTasksInUser(query: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.task.findMany({
      where: {
        title: { contains: query, mode: 'insensitive' },
      },
      include: { column: true, user: true },
      orderBy: { position },
    });
  }

  // tasks.repository.ts
  async findAllForCalendar(userId: string): Promise<TaskForCalendarDto[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId }, // фильтр по текущему пользователю
      include: {
        column: { select: { boardId: true } },
        user: true,
      },
    });

    tasks.sort((a, b) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline.getTime() - b.deadline.getTime();
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description ?? undefined,
      deadline: task.deadline ?? undefined,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      priority: task.priority,
      tags: task.tags,
      boardId: task.column.boardId,
      columnId: task.columnId,
      userId: task.userId ?? undefined,
    }));
  }

  async toggleComplete(taskId: string, isCompleted: boolean): Promise<Task> {
    return this.prisma.task.update({
      where: { id: taskId },
      data: { isCompleted },
    });
  }

  async findById(taskId: string): Promise<Task | null> {
    return this.prisma.task.findUnique({ where: { id: taskId } });
  }

  async findAllByUser(userId: string): Promise<Task[]> {
    return this.prisma.task.findMany({
      where: { userId },
    });
  }
}
