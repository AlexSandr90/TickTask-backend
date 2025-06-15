import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsString,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnPositionUpdateDto {
  @ApiProperty({ example: 'columnId123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 2.5 }) // допускаем дробное значение позиции
  @IsNumber()
  @Min(0)
  position: number;
}

export class UpdateColumnPositionsDto {
  @ApiProperty({ example: 'boardId123' })
  @IsString()
  boardId: string;

  @ApiProperty({ type: [ColumnPositionUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnPositionUpdateDto)
  updates: ColumnPositionUpdateDto[];
}
