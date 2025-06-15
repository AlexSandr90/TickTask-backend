import { ColumnDto } from './column.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateColumnDto extends ColumnDto {
  @ApiPropertyOptional({
    description: 'Position index of the column (used for reordering)',
    example: 2.5,
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(0)
  position?: number;
}
