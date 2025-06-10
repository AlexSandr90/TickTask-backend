import { IsArray, IsInt, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class TaskPositionDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  columnId: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position: number;
}

export class UpdateTaskPositionsDto {
  @ApiProperty({ type: [TaskPositionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskPositionDto)
  tasks: TaskPositionDto[];
}