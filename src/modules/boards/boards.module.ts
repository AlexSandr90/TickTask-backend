import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardsRepository } from './boards.repository';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AnalyticsModule } from '../analytics/analystics.module';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
  imports: [PrismaModule, UsersModule, AnalyticsModule, AchievementModule],
  controllers: [BoardsController],
  providers: [BoardsService, BoardsRepository],
  exports: [BoardsService],
})
export class BoardsModule {}
