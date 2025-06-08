import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBoardDto {
  @ApiProperty({
    description: 'Board name',
    example: 'Updated Board title',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Board description',
    example: 'Updated Board description',
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
