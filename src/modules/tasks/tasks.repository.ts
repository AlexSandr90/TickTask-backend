import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { getNextPosition } from '../../common/utils/position.util';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(columnId: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.task.findMany({
      where: { columnId },
      include: { user: true },
      orderBy: { position },
    });
  }

  async findOne(id: string) {
    return this.prisma.task.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async create(taskData: CreateTaskDto & { position?: number }) {
    const nextPosition = await getNextPosition(this.prisma, 'task', {
      columnId: taskData.columnId,
    });

    return this.prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        position: nextPosition,
        priority: taskData.priority,
        tags: taskData.tags,
        userId: taskData.userId ?? null,
        columnId: taskData.columnId,
      },
      include: { user: true },
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
      deadline?: Date;
    },
  ) {
    return this.prisma.task.update({
      where: { id },
      data,
      include: { user: true },
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
}
