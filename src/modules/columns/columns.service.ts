import { Injectable } from '@nestjs/common';
import { ColumnsRepository } from './columns.repository';

@Injectable()
export class ColumnsService {
  constructor(private readonly columnRepository: ColumnsRepository) {}

  async getAllColumns() {
    return this.columnRepository.findAll();
  }

  async findColumnById(id: string) {
    return this.columnRepository.findOne(id);
  }

  async createColumn(title: string,  boardId: string) {
    return this.columnRepository.create({ title, boardId });
  }

  async updateColumn(id: string, title?: string,) {
    return this.columnRepository.update(id, { title });
  }

  async deleteColumn(id: string) {
    return this.columnRepository.delete(id);
  }
}
