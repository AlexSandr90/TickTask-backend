import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TasksRepository } from './tasks.repository';
import { TaskSearchController } from './task-search.controller';
import { TasksPositionsController } from './tasks-positions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    TasksController,
    TaskSearchController,
    TasksPositionsController,
  ],
  providers: [TasksService, TasksRepository],
  exports: [TasksService],
})
export class TasksModule { }
