import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Just do it',
  })
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Task description',
  })
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'Column ID',
    example: '663a3fa5f7cfc3d98dcbfdba',
  })
  @IsNotEmpty()
  columnId: string;

  @ApiProperty({
    description: 'Task priority',
    example: 1,
  })
  @IsNotEmpty()
  priority: number;

  @ApiProperty({
    description: 'Array of task TAGS',
    example: ['tag1', 'tag2', 'tag3'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
