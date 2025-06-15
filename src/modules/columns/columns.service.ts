import { Injectable, NotFoundException } from '@nestjs/common';
import { ColumnsRepository } from './columns.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ColumnsService {
  constructor(
    private readonly columnRepository: ColumnsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getAllColumns(boardId: string) {
    return this.columnRepository.findAll(boardId);
  }

  async findColumnById(id: string) {
    return this.columnRepository.findOne(id);
  }

  async createColumn(title: string, boardId: string) {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
    });

    if (!board) {
      throw new NotFoundException(`Board with id ${boardId} not found!`);
    }

    return this.columnRepository.create({ title, boardId });
  }

  async updateColumn(id: string, title?: string, position?: number) {
    const updatedColumn = await this.columnRepository.update(id, { title, position });
    return updatedColumn;
  }

  async updateColumnPositions(
    boardId: string,
    updates: { id: string; prevId?: string; nextId?: string }[],
  ) {
    return this.prisma.$transaction(async (prisma) => {
      for (const { id, prevId, nextId } of updates) {
        let newPosition: number;

        if (!prevId && !nextId) {
          newPosition = 1000;
        } else if (!prevId && nextId) {
          const next = await prisma.column.findUnique({ where: { id: nextId } });
          if (!next) throw new NotFoundException(`Next column ${nextId} not found`);
          newPosition = next.position - 100;
        } else if (prevId && !nextId) {
          const prev = await prisma.column.findUnique({ where: { id: prevId } });
          if (!prev) throw new NotFoundException(`Previous column ${prevId} not found`);
          newPosition = prev.position + 100;
        } else {
          const [prev, next] = await Promise.all([
            prisma.column.findUnique({ where: { id: prevId } }),
            prisma.column.findUnique({ where: { id: nextId } }),
          ]);

          if (!prev || !next) {
            throw new NotFoundException(`Previous or Next column not found`);
          }

          const distance = next.position - prev.position;
          if (distance < 0.000001) {
            await this.normalizeColumnPositions(prisma, boardId);
            const [newPrev, newNext] = await Promise.all([
              prisma.column.findUnique({ where: { id: prevId } }),
              prisma.column.findUnique({ where: { id: nextId } }),
            ]);

            if (!newPrev || !newNext) {
              throw new NotFoundException(`Previous or Next column not found after normalization`);
            }

            newPosition = (newPrev.position + newNext.position) / 2;
          } else {
            newPosition = (prev.position + next.position) / 2;
          }
        }

        await prisma.column.update({
          where: { id },
          data: { position: newPosition },
        });
      }

      return true;
    });
  }

  async deleteColumn(id: string) {
    return this.columnRepository.delete(id);
  }

  private async normalizeColumnPositions(prisma: Prisma.TransactionClient, boardId: string) {
    const columns = await prisma.column.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
      select: { id: true },
    });

    let position = 1000;

    for (const col of columns) {
      await prisma.column.update({
        where: { id: col.id },
        data: { position },
      });
      position += 100;
    }
  }
}
