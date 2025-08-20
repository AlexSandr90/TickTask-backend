import {
  Max,
  Min,
  IsIn,
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query',
    example: 'Task title',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'Search in specific entities',
    example: ['tasks', 'columns', 'boards'],
    enum: ['tasks', 'columns', 'boards'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsIn(['tasks', 'columns', 'boards', null], { each: true })
  searchIn?: ('tasks' | 'columns' | 'boards' | null)[];

  @ApiPropertyOptional({
    description: 'Search period in days',
    example: 7,
    enum: [7, 30, 90, null],
    required: false,
  })
  @IsOptional()
  @IsIn([7, 30, 90, null])
  period?: 7 | 30 | 90 | null;

  @ApiPropertyOptional({
    description: 'Sort in specific fields',
    example: ['title', 'description', 'tags'],
    enum: ['title', 'description', 'tags'],
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsIn(['title', 'description', 'tags'], { each: true })
  searchInFields?: ('title' | 'description' | 'tags')[];

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({})
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
