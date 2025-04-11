import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';
import { ColumnsRepository } from './columns.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ColumnsController],
  providers: [ColumnsService, ColumnsRepository],
  exports: [ColumnsService],
})
export class ColumnsModule {}
