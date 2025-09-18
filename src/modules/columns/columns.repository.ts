import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { getNextPosition } from '../../common/utils/position.util';
import { UpdateColumnDto } from './dto/update-column.dto';
import { AchievementsService } from '../achievement/achievement.service';

@Injectable()
export class ColumnsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async findAll(boardId: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position },
    });
  }

  async findAllWithTasks(boardId: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.column.findMany({
      where: { boardId },
      orderBy: { position },
      include: {
        tasks: { orderBy: { position } },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.column.findUnique({ where: { id } });
  }

  async findOneWithTasks(id: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.column.findUnique({
      where: { id },
      include: {
        tasks: { orderBy: { position } },
      },
    });
  }

  async findOneByBoardAndId(columnId: string, userId: string) {
    return this.prisma.column.findFirst({
      where: { id: columnId, board: { userId } },
    });
  }

  async findByBoardId(boardId: string, position: 'asc' | 'desc' = 'asc') {
    return this.prisma.column.findMany({
      where: { boardId },
      include: {
        tasks: { orderBy: { position } },
      },
    });
  }

  async findOneByUserAndWithTasks(
    columnId: string,
    userId: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    return this.prisma.column.findFirst({
      where: { id: columnId, board: { userId } },
      include: { tasks: { orderBy: { position } } },
    });
  }

  async create(columnData: CreateColumnDto, userId: string) {
    const nextPosition = await getNextPosition(this.prisma, 'column', {
      boardId: columnData.boardId,
    });

    const column = await this.prisma.column.create({
      data: {
        title: columnData.title,
        position: nextPosition,
        board: { connect: { id: columnData.boardId } },
      },
    });
    if (userId) {
      await this.achievementsService.checkFirstColumnAchievement(userId);
    }

    // Возвращаем созданную колонку
    return column;
  }

  async update(id: string, data: UpdateColumnDto) {
    return this.prisma.column.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.column.delete({ where: { id } });
  }

  async searchColumnsInBoard(
    boardId: string,
    query: string,
    position: 'asc' | 'desc' = 'asc',
  ) {
    return await this.prisma.column.findMany({
      where: {
        boardId,
        title: { contains: query, mode: 'insensitive' },
      },
      include: { board: true },
      orderBy: { position },
    });
  }

  async searchColumnsInUser(query: string, position: 'asc' | 'desc' = 'asc') {
    return await this.prisma.column.findMany({
      where: {
        title: { contains: query, mode: 'insensitive' },
      },
      include: { board: true },
      orderBy: { position },
    });
  }
}
