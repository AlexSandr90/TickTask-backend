import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ColumnDto {
  @ApiProperty({ description: 'Column name', example: 'TODO' })
  @IsNotEmpty({ message: 'Column name is required' })
  title?: string;
}