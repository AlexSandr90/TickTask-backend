import { Injectable } from '@nestjs/common';
import { TasksRepository } from './tasks.repository';

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  async getAllColumns() {
    return this.tasksRepository.findAll();
  }

  async findColumnById(id: string) {
    return this.tasksRepository.findOne(id);
  }

  async createColumn(title: string, description: string, columnId: string) {
    return this.tasksRepository.create({ title, description, columnId });
  }

  async updateColumn(id: string, title?: string, description?: string) {
    return this.tasksRepository.update(id, { title, description });
  }

  async deleteColumn(id: string) {
    return this.tasksRepository.delete(id);
  }
}
