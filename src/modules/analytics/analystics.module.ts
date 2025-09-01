import { Module } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsController } from './analystics.controller';

@Module({
  controllers: [AnalyticsController], // сюда контроллеры
  providers: [AnalyticsService, PrismaService], // сюда сервисы
  exports: [AnalyticsService], // если нужно использовать в других модулях
})
export class AnalyticsModule {}
