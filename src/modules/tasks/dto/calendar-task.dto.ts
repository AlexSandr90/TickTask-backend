import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TaskForCalendarDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false })
  deadline?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  priority: number;

  @ApiProperty()
  tags: string[];

  @ApiProperty({ required: false })
  boardId?: string;

  @ApiProperty()
  columnId: string;

  @IsOptional()
  @IsString()
  userId?: string;
}
