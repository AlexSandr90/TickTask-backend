import { Injectable, NotFoundException } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskForCalendarDto } from './dto/calendar-task.dto';
import { Task } from '@prisma/client';
import { AnalyticsService } from '../analytics/analytics.service';

type AnalyticsUpdate = {
  totalBoards?: { increment?: number; decrement?: number; set?: number };
  totalColumns?: { increment?: number; decrement?: number; set?: number };
  totalTasks?: { increment?: number; decrement?: number; set?: number };
  completedTasks?: { increment?: number; decrement?: number; set?: number };
  completedTasksTotal?: {
    increment?: number;
    decrement?: number;
    set?: number;
  };
  inProgressTasks?: { increment?: number; decrement?: number; set?: number };
  currentStreak?: { increment?: number; decrement?: number; set?: number };
  longestStreak?: { increment?: number; decrement?: number; set?: number };
  totalTimeSpent?: { increment?: number; decrement?: number; set?: number };
};

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async getAllTasks(columnId: string, position: 'asc' | 'desc' = 'asc') {
    return this.tasksRepository.findAll(columnId, position);
  }

  async findTaskById(id: string) {
    return this.tasksRepository.findOne(id);
  }

  async createTask(
    title: string,
    description: string,
    columnId: string,
    userId: string,
    priority: number = 1,
    tags: string[] = [],
  ) {
    const task = await this.tasksRepository.create({
      title,
      description,
      columnId,
      priority,
      tags,
      userId,
    });

    await this.analyticsService.updateAnalytics(userId, {
      totalTasks: { increment: 1 },
      inProgressTasks: { increment: 1 },
    });

    return task;
  }

  async updateTaskStatus(
    taskId: string,
    isCompleted: boolean,
    userId: string,
  ): Promise<Task> {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');
    if (task.isCompleted === isCompleted) return task;

    await this.tasksRepository.update(taskId, { isCompleted });

    const analyticsUpdate: AnalyticsUpdate = {};
    if (isCompleted) {
      analyticsUpdate.inProgressTasks = { decrement: 1 };
      analyticsUpdate.completedTasks = { increment: 1 };
      analyticsUpdate.completedTasksTotal = { increment: 1 }; // ✅ Добавьте это
    } else {
      analyticsUpdate.inProgressTasks = { increment: 1 };
      analyticsUpdate.completedTasks = { decrement: 1 };
    }

    await this.analyticsService.updateAnalytics(userId, analyticsUpdate);

    return task;
  }

  async updateTask(
    id: string,
    title?: string,
    description?: string,
    position?: number,
    columnId?: string,
    userId?: string,
    priority?: number,
    tags?: string[],
    deadline?: Date | null,
  ) {
    const task = await this.tasksRepository.findOne(id);
    if (!task) throw new Error('Task not found');

    const updates: Partial<UpdateTaskDto> & { deadline?: Date | null } = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (userId !== undefined) updates.userId = userId;
    if (priority !== undefined) updates.priority = priority;
    if (tags !== undefined) updates.tags = tags;
    if (deadline !== undefined) updates.deadline = deadline;

    const oldColumnId = task.columnId;
    const newColumnId = columnId ?? oldColumnId;

    if (columnId && columnId !== oldColumnId) {
      const oldTasks = await this.tasksRepository.findAll(oldColumnId, 'asc');
      const updatedOld = oldTasks
        .filter((t) => t.id !== id)
        .map((t, i) => ({ id: t.id, position: i, columnId: oldColumnId }));

      const newTasks = await this.tasksRepository.findAll(newColumnId, 'asc');
      const newPosition = position ?? newTasks.length;

      updates.position = newPosition;
      updates.columnId = columnId;

      await this.tasksRepository.updateManyPositions(updatedOld);

      const updatedNew = [
        ...newTasks.slice(0, newPosition),
        { id, position: newPosition, columnId: newColumnId },
        ...newTasks.slice(newPosition),
      ].map((t, i) => ({ id: t.id, position: i, columnId: t.columnId }));

      await this.tasksRepository.updateManyPositions(updatedNew);
    } else if (position !== undefined) {
      const tasks = await this.tasksRepository.findAll(oldColumnId, 'asc');
      const reordered = tasks
        .filter((t) => t.id !== id)
        .map((t) => ({ id: t.id, position: 0, columnId: oldColumnId }));

      reordered.splice(position, 0, { id, position, columnId: oldColumnId });

      const final = reordered.map((t, i) => ({
        id: t.id,
        position: i,
        columnId: oldColumnId,
      }));
      await this.tasksRepository.updateManyPositions(final);
    }

    return this.tasksRepository.update(id, updates);
  }

  // ✅ Публичный метод для обновления позиций нескольких задач
  async updateTaskPositions(
    tasks: { id: string; columnId: string; position: number }[],
  ) {
    const groupedByColumn: Record<string, typeof tasks> = {};

    for (const task of tasks) {
      if (!groupedByColumn[task.columnId]) groupedByColumn[task.columnId] = [];
      groupedByColumn[task.columnId].push(task);
    }

    for (const columnId in groupedByColumn) {
      const tasksInColumn = groupedByColumn[columnId]
        .sort((a, b) => a.position - b.position)
        .map((t, i) => ({ ...t, position: i }));

      await this.tasksRepository.updateManyPositions(tasksInColumn);
    }

    return { success: true };
  }

  async searchTasks(
    columnId: string,
    query: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    return this.tasksRepository.searchTasks(columnId, query, position);
  }

  async searchTasksInBoard(
    boardId: string,
    query: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    return this.tasksRepository.searchTasksInBoard(boardId, query, position);
  }

  async searchTasksInUser(query: string, position: 'asc' | 'desc' = 'asc') {
    return this.tasksRepository.searchTasksInUser(query, position);
  }

  async deleteTask(taskId: string, userId: string) {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    const analyticsUpdate: AnalyticsUpdate = {};
    if (!task.isCompleted) {
      analyticsUpdate.inProgressTasks = { decrement: 1 };
    } else {
      analyticsUpdate.completedTasks = { decrement: 1 };
    }

    await this.analyticsService.updateAnalytics(userId, analyticsUpdate);

    return this.tasksRepository.delete(taskId);
  }

  async getAllTasksForCalendar(userId: string): Promise<TaskForCalendarDto[]> {
    return await this.tasksRepository.findAllForCalendar(userId);
  }

  // ✅ Исправленный toggleComplete с userId
  async toggleComplete(
    taskId: string,
    isCompleted: boolean,
    userId: string,
  ): Promise<Task> {
    const task = await this.tasksRepository.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    // ✅ КЛЮЧЕВАЯ ПРОВЕРКА: предотвращаем двойное засчитывание
    const wasAlreadyCompleted = task.isCompleted;

    await this.tasksRepository.toggleComplete(taskId, isCompleted);

    const analyticsUpdate: AnalyticsUpdate = {};

    if (isCompleted && !wasAlreadyCompleted) {
      // Задача завершается ВПЕРВЫЕ
      analyticsUpdate.inProgressTasks = { decrement: 1 };
      analyticsUpdate.completedTasks = { increment: 1 };
      analyticsUpdate.completedTasksTotal = { increment: 1 }; // ✅ Засчитываем только при первом завершении
    } else if (!isCompleted && wasAlreadyCompleted) {
      // Отменяем завершение
      analyticsUpdate.inProgressTasks = { increment: 1 };
      analyticsUpdate.completedTasks = { decrement: 1 };
      // completedTasksTotal НЕ уменьшается - это общий счетчик всех когда-либо завершенных задач
    }
    // Если задача уже была завершена и мы снова ставим true - ничего не делаем

    if (Object.keys(analyticsUpdate).length > 0) {
      await this.analyticsService.updateAnalytics(userId, analyticsUpdate);
    }

    const updatedTask = await this.tasksRepository.findById(taskId);
    if (!updatedTask) throw new NotFoundException('Task not found');

    return updatedTask;
  }

  async refreshTaskStats(userId: string) {
    const tasks = await this.tasksRepository.findAllByUser(userId);

    const inProgress = tasks.filter((t) => !t.isCompleted).length;
    const completed = tasks.filter((t) => t.isCompleted).length;

    await this.analyticsService.updateAnalytics(userId, {
      inProgressTasks: { set: inProgress },
      completedTasks: { set: completed },
    });
  }
}
