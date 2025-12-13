// ============================================
// common/utils/position.util.ts - ОПТИМИЗИРОВАННАЯ ВЕРСИЯ
// ============================================
import { PrismaService } from '../../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// ✅ Перегруженные сигнатуры для строгой типизации
export async function getNextPosition(
  prisma: PrismaService,
  model: 'board',
  whereCondition: Prisma.BoardWhereInput,
): Promise<number>;

export async function getNextPosition(
  prisma: PrismaService,
  model: 'column',
  whereCondition: Prisma.ColumnWhereInput,
): Promise<number>;

export async function getNextPosition(
  prisma: PrismaService,
  model: 'task',
  whereCondition: Prisma.TaskWhereInput,
): Promise<number>;

// ✅ ОПТИМИЗИРОВАННАЯ РЕАЛИЗАЦИЯ - aggregate вместо findFirst
export async function getNextPosition(
  prisma: PrismaService,
  model: 'board' | 'column' | 'task',
  whereCondition:
    | Prisma.BoardWhereInput
    | Prisma.ColumnWhereInput
    | Prisma.TaskWhereInput,
): Promise<number> {
  const startTime = Date.now();

  let maxPosition: number | null = null;

  // ✅ Используем aggregate._max - В РАЗЫ БЫСТРЕЕ чем findFirst + orderBy
  if (model === 'column') {
    const result = await prisma.column.aggregate({
      where: whereCondition as Prisma.ColumnWhereInput,
      _max: { position: true },
    });
    maxPosition = result._max.position;
  } else if (model === 'task') {
    const result = await prisma.task.aggregate({
      where: whereCondition as Prisma.TaskWhereInput,
      _max: { position: true },
    });
    maxPosition = result._max.position;
  } else if (model === 'board') {
    const result = await prisma.board.aggregate({
      where: whereCondition as Prisma.BoardWhereInput,
      _max: { position: true },
    });
    maxPosition = result._max.position;
  }

  const nextPosition = (maxPosition ?? -1) + 1000;

  console.log(
    `🔍 getNextPosition(${model}) took ${Date.now() - startTime}ms, next: ${nextPosition}`,
  );

  return nextPosition;
}
