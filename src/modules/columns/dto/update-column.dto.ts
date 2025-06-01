import { ColumnDto } from './column.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class UpdateColumnDto extends ColumnDto {
  @ApiPropertyOptional({
    description: 'Sort order for tasks in column',
    enum: ['asc', 'desc'],
    example: 'asc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  position: 'asc' | 'desc';
}
