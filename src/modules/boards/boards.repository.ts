import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { getNextPosition } from '../../common/utils/position.util';
import { User } from '@prisma/client';

@Injectable()
export class BoardsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.board.findMany({
      where: {
        OR: [
          { userId },
          {
            members: {
              some: { userId },
            },
          },
        ],
      },
      orderBy: { position },
    });
  }

  async findAllBoardsMembers(userId: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.boardMember.findMany({
      where: { userId },
      orderBy: { position },
      include: {
        board: {
          select: {
            id: true,
            title: true,
            description: true,
          },
        },
      },
    });
  }

  async findByEmailWithRelations(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        boards: true,
        receivedInvitations: {
          include: {
            board: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
        sentInvitations: {
          include: {
            board: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
        boardsMembers: {
          include: {
            board: {
              select: {
                id: true,
                title: true,
                description: true,
              },
            },
          },
        },
        UserAchievement: {
          include: {
            // achievement: true,
          },
        },
        UserAnalytics: true,
      },
    });
  }

  async findByEmailWithBoardAccess(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        boards: {
          select: {
            id: true,
            title: true,
            description: true,
            createdAt: true,
          },
        },
        boardsMembers: {
          include: {
            board: {
              select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
              },
            },
          },
        },
        receivedInvitations: {
          where: {
            status: 'ACCEPTED', // Тільки прийняті запрошення
          },
          include: {
            board: {
              select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });
  }

  async findAllWithColumns(userId: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.board.findMany({
      where: { userId },
      orderBy: { position }, // сортировка самих досок
      include: {
        columns: {
          orderBy: {
            position: 'asc', // сортировка колонок внутри доски
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.board.findUnique({ where: { id } });
  }

  async findOneWithColumns(id: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position },
          include: {
            tasks: { orderBy: { position } },
          },
        },
      },
    });
  }

  async findOneByUserAndId(id: string, userId: string) {
    return this.prisma.board.findFirst({
      where: {
        id,
        OR: [
          { userId },
          {
            members: {
              some: { userId },
            },
          },
        ],
      },
    });
  }

  async findOneByUserAndIdWithColumns(
    id: string,
    userId: string,
    position: 'asc' | 'desc',
  ) {
    return this.prisma.board.findFirst({
      where: {
        id,
        OR: [
          { userId },
          {
            members: {
              some: { userId },
            },
          },
        ],
      },
      include: {
        columns: {
          orderBy: { position },
          include: {
            tasks: { orderBy: { position } },
          },
        },
      },
    });
  }

  async create(boardData: CreateBoardDto, userId: string) {
    const nextPosition = await getNextPosition(this.prisma, 'board', {
      userId,
    });

    return this.prisma.board.create({
      data: {
        title: boardData.title,
        description: boardData.description,
        userId, // передаём отдельно, а не из boardData
        position: nextPosition,
      },
    });
  }

  async update(id: string, data: UpdateBoardDto) {
    return this.prisma.board.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.board.delete({ where: { id } });
  }

  async searchBoards(query: string, position: 'asc' | 'desc' = 'asc') {
    return await this.prisma.board.findMany({
      where: {
        title: { contains: query, mode: 'insensitive' },
      },
      include: { columns: true },
      orderBy: { position },
    });
  }

  async findLastBoardByUser(userId: string) {
    return this.prisma.board.findFirst({
      where: { userId },
      orderBy: { position: 'desc' },
    });
  }
}
