import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BoardsRepository } from './boards.repository';
import { CreateBoardDto } from './dto/create-board.dto';
import { getNextPosition } from '../../common/utils/position.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AchievementsService } from '../achievement/achievement.service';

@Injectable()
export class BoardsService {
  constructor(
    private readonly boardsRepository: BoardsRepository,
    private readonly analyticsService: AnalyticsService,
    private readonly prisma: PrismaService,
    private readonly achievementService: AchievementsService,
  ) {}

  async getAllBoards(userId: string) {
    return this.boardsRepository.findAll(userId, 'asc');
  }

  async getBoardsInBoardsMembers(
    userId: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    return this.boardsRepository.findAllBoardsMembers(userId, position);
  }

  async getBoardsByEmailWithRelations(email: string) {
    const user = await this.boardsRepository.findByEmailWithRelations(email);

    if (!user) throw new NotFoundException('User not found');

    const { boards, receivedInvitations, sentInvitations, boardsMembers } =
      user;

    return {
      boards,
      receivedInvitations,
      sentInvitations,
      boardsMembers,
    };
  }

  async findBoardById(id: string, userId: string) {
    const board = await this.boardsRepository.findOneByUserAndId(id, userId);

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    const { user, members, ...boardDetails } = board;

    const users = [
      { ...user, role: 'OWNER' },
      ...members.map((member) => ({ ...member.user, role: member.role })),
    ];

    return { ...boardDetails, users };
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

  async createBoard(boardData: CreateBoardDto, userId: string) {
    // Проверяем, есть ли доска с таким же названием у пользователя
    const existing = await this.prisma.board.findFirst({
      where: {
        title: boardData.title,
        userId: userId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Board with title "${boardData.title}" already exists.`,
      );
    }

    const nextPosition = await getNextPosition(this.prisma, 'board', {
      userId,
    });

    // Создаем доску
    const board = await this.prisma.board.create({
      data: {
        title: boardData.title,
        description: boardData.description,
        userId,
        position: nextPosition,
      },
    });

    // Обновляем аналитику пользователя
    await this.analyticsService.updateAnalytics(userId, {
      totalBoards: { increment: 1 },
    });
    if (this.achievementService) {
      await this.achievementService.checkFirstBoardAchievement(userId);
    }

    return board;
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

  async searchBoards(query: string, position: 'asc' | 'desc' = 'asc') {
    return this.boardsRepository.searchBoards(query, position);
  }
  async getBoardFull(boardId: string, userId: string) {
    const board = await this.prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { userId: userId },
          {
            members: {
              some: { userId: userId },
            },
          },
        ],
      },
      include: {
        columns: {
          include: {
            tasks: {
              orderBy: { position: 'asc' },
            },
          },
          orderBy: { position: 'asc' },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException(
        `Board with id ${boardId} not found or access denied`,
      );
    }

    return board;
  }
}
