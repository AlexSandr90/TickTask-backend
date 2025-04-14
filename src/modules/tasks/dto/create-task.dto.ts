import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

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
}
