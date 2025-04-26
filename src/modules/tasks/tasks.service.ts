import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async getAllTasks(columnId: string) {
    return this.tasksRepository.findAll(columnId);
  }

  async findTaskById(id: string) {
    return this.tasksRepository.findOne(id);
  }

  async createTask(title: string, description: string, columnId: string) {
    return this.tasksRepository.create({ title, description, columnId });
  }

  async updateTask(id: string, title?: string, description?: string) {
    return this.tasksRepository.update(id, { title, description });
  }

  async deleteTask(id: string) {
    return this.tasksRepository.delete(id);
  }
}
