import { Module } from '@nestjs/common';
import { AchievementService } from './achievement.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AchievementController } from './achievement.controller';
import { AchievementsStaticController } from './achievements-static.controller';

@Module({
  imports: [PrismaModule], // импортируем Prisma
  providers: [AchievementService],
  controllers: [AchievementController, AchievementsStaticController], // <- важно!
  exports: [AchievementService], // <- экспортируем, чтобы другие модули могли использовать
})
export class AchievementModule {}
