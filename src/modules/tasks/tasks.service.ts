import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async getAllTasks(columnId: string, position: 'asc' | 'desc' = 'asc') {
    return this.tasksRepository.findAll(columnId, position);
  }

  async findTaskById(id: string) {
    return this.tasksRepository.findOne(id);
  }

  async createTask(title: string, description: string, columnId: string) {
    return this.tasksRepository.create({ title, description, columnId });
  }

  async updateTask(id: string, title?: string, description?: string, position?: number) {
    const data: any = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (position !== undefined) data.position = position;

    return this.tasksRepository.update(id, data);
  }


  async deleteTask(id: string) {
    return this.tasksRepository.delete(id);
  }
}
