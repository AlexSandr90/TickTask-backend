import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsNotEmpty,
  IsArray,
} from 'class-validator';

export class UpdateTaskDto {
  @ApiPropertyOptional({
    description: 'Task title',
    example: 'Just do it',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Task description',
    example: 'Task description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Task position index (used for ordering)',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiPropertyOptional({
    description: 'Column ID',
    example: '663a3fa5f7cfc3d98dcbfdba',
  })
  @IsOptional()
  @IsString()
  columnId?: string;

  @ApiPropertyOptional({
    description: 'Task priority',
    example: 1,
  })
  @IsNotEmpty()
  priority: number;

  @ApiPropertyOptional({
    description: 'Array of task TAGS',
    example: ['tag1', 'tag2', 'tag3'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ApiPropertyOptional({
    description: 'User ID assigned to the task',
    example: '663a1234abcde9876fgh1234',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
