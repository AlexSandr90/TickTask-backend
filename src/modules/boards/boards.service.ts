import { Injectable } from '@nestjs/common';
import { BoardsRepository } from './boards.repository';

@Injectable()
export class BoardsService {
  constructor(private readonly boardsRepository: BoardsRepository) {}

  async getAllBoards(userId: string) {
    return this.boardsRepository.findAll(userId);
  }

  async findBoardById(id: string) {
    return this.boardsRepository.findOne(id);
  }

  async createBoard(title: string, description: string, userId: string) {
    return this.boardsRepository.create({ title, description, userId });
  }

  async updateBoard(id: string, title?: string, description?: string) {
    return this.boardsRepository.update(id, { title, description });
  }

  async deleteBoard(id: string) {
    return this.boardsRepository.delete(id);
  }
}
