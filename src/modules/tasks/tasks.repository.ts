import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.task.findMany();
  }

  async findOne(id: string) {
    return this.prisma.task.findUnique({ where: { id } });
  }

  async create(taskData: {
    title: string;
    description: string;
    columnId: string;
  }) {
    return this.prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        column: { connect: { id: taskData.columnId } },
      },
    });
  }

  async update(id: string, data: { title?: string; description?: string }) {
    return this.prisma.task.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
