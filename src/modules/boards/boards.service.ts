import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { BoardsRepository } from './boards.repository';
import { CreateBoardDto } from './dto/create-board.dto';
import { getNextPosition } from '../../common/utils/position.util';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BoardsService {
  constructor(
    private readonly boardsRepository: BoardsRepository,
    private readonly prisma: PrismaService, // внедряем PrismaService
  ) { }
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

  async getAllBoardsWithColumns(userId: string, position: 'asc' | 'desc' = 'asc') {
    return this.boardsRepository.findAllWithColumns(userId, position);
  }

  async findBoardByIdWithColumns(id: string, userId: string, position: 'asc' | 'desc' = 'asc') {
    const board = await this.boardsRepository.findOneByUserAndIdWithColumns(id, userId, position);

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }

  async createBoard(boardData: CreateBoardDto, userId: string) {
    // Проверяем, есть ли доска с таким же названием у пользователя
    const existing = await this.prisma.board.findFirst({
      where: {
        title: boardData.title,
        userId: userId,
      },
    });

    if (existing) {
      throw new BadRequestException(`Board with title "${boardData.title}" already exists.`);
    }

    const nextPosition = await getNextPosition(this.prisma, 'board', { userId });

    return this.prisma.board.create({
      data: {
        title: boardData.title,
        description: boardData.description,
        userId,
        position: nextPosition,
      },
    });
  }

  async updateBoard(id: string, userId: string, title?: string, description?: string) {
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

  async searchBoards(query: string, position: 'asc' | 'desc' = 'asc') {
    return this.boardsRepository.searchBoards(query, position);
  }
}
