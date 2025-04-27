import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(columnId: string) {
    return this.prisma.task.findMany({ where: { columnId } });
  }

  async findOne(id: string) {
    return this.prisma.task.findUnique({ where: { id } });
  }

  async create(taskData: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        title: taskData.title,
        description: taskData.description,
        column: { connect: { id: taskData.columnId } },
      },
    });
  }

  async update(id: string, data: UpdateTaskDto) {
    return this.prisma.task.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.task.delete({ where: { id } });
  }
}
