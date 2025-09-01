import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { TaskSearchController } from './task-search.controller';
import { TasksPositionsController } from './tasks-positions.controller';
import { AnalyticsModule } from '../analytics/analystics.module';

@Module({
  imports: [PrismaModule, AnalyticsModule],
  controllers: [
    TasksPositionsController,
    TasksController,
    TaskSearchController,
  ],
  providers: [TasksService, TasksRepository],
  exports: [TasksService],
})
export class TasksModule {}
