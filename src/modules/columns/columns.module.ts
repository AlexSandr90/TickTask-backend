import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';
import { ColumnsRepository } from './columns.repository';
import { ColumnsSearchController } from './columns-search.controller';
import { AnalyticsModule } from '../analytics/analystics.module';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [PrismaModule, AnalyticsModule, AchievementModule],
  controllers: [ColumnsController, ColumnsSearchController],
  providers: [ColumnsService, ColumnsRepository],
  exports: [ColumnsService],
})
export class ColumnsModule {}
