import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';
import { ColumnsRepository } from './columns.repository';
import { ColumnsSearchController } from './columns-search.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ColumnsController, ColumnsSearchController],
  providers: [ColumnsService, ColumnsRepository],
  exports: [ColumnsService],
})
export class ColumnsModule { }
