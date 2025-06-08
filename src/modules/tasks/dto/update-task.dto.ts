import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Just do it',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Task description',
  })
  @IsOptional()
  @IsString()
  description?: string;
}