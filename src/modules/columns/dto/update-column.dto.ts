import { ColumnDto } from './column.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateColumnDto extends ColumnDto {
  @ApiPropertyOptional({
    description: 'Position index of the column (used for reordering)',
    example: 2,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
