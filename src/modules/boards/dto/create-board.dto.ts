import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({
    description: 'Board name',
    example: 'New Board',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Board description',
    example: 'New Board description',
  })
  @IsString()
  description: string;
}
