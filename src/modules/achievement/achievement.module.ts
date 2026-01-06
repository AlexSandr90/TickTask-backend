import { Module } from '@nestjs/common';

import { PrismaModule } from '../../../prisma/prisma.module';
import { AchievementController } from './achievement.controller';
import { AchievementsService } from './achievement.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule], // импортируем Prisma
  providers: [AchievementsService],
  controllers: [AchievementController], // <- важно!
  exports: [AchievementsService], // <- экспортируем, чтобы другие модули могли использовать
})
export class AchievementModule {}
