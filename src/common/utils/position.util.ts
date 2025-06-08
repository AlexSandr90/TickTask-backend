import { PrismaService } from '../../../prisma/prisma.service';

export async function getNextPosition(
  prisma: PrismaService,
  model: 'board' | 'column' | 'task',
  whereCondition: any,
): Promise<number> {
  const aggregateMethod = prisma[model] as any;
  const maxPositionResult = await aggregateMethod.aggregate({
    where: whereCondition,
    _max: { position: true },
  });

  return (maxPositionResult._max.position ?? -1) + 1;
}
