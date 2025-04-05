import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardsRepository } from './boards.repository';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  controllers: [BoardsController],
  providers: [BoardsService, PrismaService, BoardsRepository],
  exports: [BoardsService],
})
export class BoardsModule {}
