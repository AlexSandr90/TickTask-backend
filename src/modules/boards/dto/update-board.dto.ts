import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBoardDto {
  @ApiProperty({
    description: 'Board name',
    example: 'New Board',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Board description',
    example: 'New Board description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Board position',
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  position?: number; // <-- добавь
}
