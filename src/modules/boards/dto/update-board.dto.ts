import { ApiProperty } from '@nestjs/swagger';

export class UpdateBoardDto {
  @ApiProperty({
    description: 'Board name',
    example: 'New Board',
  })
  title?: string;

  @ApiProperty({
    description: 'Board description',
    example: 'New Board description',
  })
  description?: string;
}
