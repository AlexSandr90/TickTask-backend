import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateColumnDto {
  @ApiProperty({
    description: 'Column name',
    example: 'To Do',
  })
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Board ID this column belongs to',
    example: '663a3fa5f7cfc3d98dcbfdba',
  })
  @IsNotEmpty()
  boardId: string;
}
