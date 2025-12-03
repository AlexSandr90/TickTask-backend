// ============================================
// common/utils/position.util.ts - МАКСИМАЛЬНО СТРОГАЯ ТИПИЗАЦИЯ
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

// Реализация
export async function getNextPosition(
  prisma: PrismaService,
  model: 'board' | 'column' | 'task',
  whereCondition:
    | Prisma.BoardWhereInput
    | Prisma.ColumnWhereInput
    | Prisma.TaskWhereInput,
): Promise<number> {
  const startTime = Date.now();

  let lastItem: { position: number } | null = null;

  if (model === 'column') {
    lastItem = await prisma.column.findFirst({
      where: whereCondition as Prisma.ColumnWhereInput,
      orderBy: { position: 'desc' },
      select: { position: true },
    });
  } else if (model === 'task') {
    lastItem = await prisma.task.findFirst({
      where: whereCondition as Prisma.TaskWhereInput,
      orderBy: { position: 'desc' },
      select: { position: true },
    });
  } else if (model === 'board') {
    lastItem = await prisma.board.findFirst({
      where: whereCondition as Prisma.BoardWhereInput,
      orderBy: { position: 'desc' },
      select: { position: true },
    });
  }

  const nextPosition = (lastItem?.position ?? -1) + 1000;

  console.log(
    `🔍 getNextPosition(${model}) took ${Date.now() - startTime}ms, next: ${nextPosition}`,
  );

  return nextPosition;
}
