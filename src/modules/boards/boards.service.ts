import { Injectable, NotFoundException } from '@nestjs/common';
import { BoardsRepository } from './boards.repository';

@Injectable()
export class BoardsService {
  constructor(private readonly boardsRepository: BoardsRepository) {}

  async getAllBoards(userId: string) {
    return this.boardsRepository.findAll(userId, 'asc'); // сортировка по position
  }

  async findBoardById(id: string, userId: string) {
    const board = await this.boardsRepository.findOneByUserAndId(id, userId);

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async getAllBoardsWithColumns(
    userId: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    return this.boardsRepository.findAllWithColumns(userId, position);
  }

  async findBoardByIdWithColumns(
    id: string,
    userId: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    const board = await this.boardsRepository.findOneByUserAndIdWithColumns(
      id,
      userId,
      position,
    );

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async createBoard(title: string, description: string, userId: string) {
    const lastBoard = await this.boardsRepository.findLastBoardByUser(userId);
    const position = lastBoard ? lastBoard.position + 1 : 0;

    return this.boardsRepository.create({
      title,
      description,
      userId,
      position,
    });
  }

  async updateBoard(
    id: string,
    userId: string,
    title?: string,
    description?: string,
  ) {
    const board = await this.boardsRepository.findOneByUserAndId(id, userId);

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.boardsRepository.update(id, { title, description });
  }

  async deleteBoard(id: string, userId: string) {
    const board = await this.boardsRepository.findOneByUserAndId(id, userId);

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return this.boardsRepository.delete(id);
  }
}
