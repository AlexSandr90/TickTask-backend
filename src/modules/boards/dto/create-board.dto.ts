import { ApiProperty } from '@nestjs/swagger';

export class CreateBoardDto {
  @ApiProperty({
    description: 'Board name',
    example: 'New Board',
  })
  title: string;

  @ApiProperty({
    description: 'Board description',
    example: 'New Board description',
  })
  description: string;

  @ApiProperty({
    description: 'User ID',
    example: '663a3fa5f7cfc3d98dcbfdba',
  })
  userId: string;
}
