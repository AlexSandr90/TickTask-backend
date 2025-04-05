import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { BoardsRepository } from './boards.repository';
import { PrismaModule } from '../../../prisma/prisma.module';


@Module({
  imports: [PrismaModule],
  controllers: [BoardsController],
  providers: [BoardsService, BoardsRepository],
  exports: [BoardsService],
})
export class BoardsModule {}