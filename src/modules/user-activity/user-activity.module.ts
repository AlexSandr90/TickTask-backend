import { Module } from '@nestjs/common';
import { UserActivityService } from './user-activity.service';
import { UserActivityController } from './user-activity.controller';
import { PrismaService } from '../../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AchievementsService } from '../achievement/achievement.service';

@Module({
  controllers: [UserActivityController],
  providers: [
    UserActivityService,
    PrismaService,
    AnalyticsService,
    AchievementsService,
  ],
  exports: [UserActivityService],
})
export class UserActivityModule {}
