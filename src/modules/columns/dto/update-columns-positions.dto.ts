import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString,  Min, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnPositionUpdateDto {
  @ApiProperty({ example: 'columnId123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 2.5 }) // пример дробного значения
  @IsNumber()
  @Min(0)
  position: number;
}

export class UpdateColumnPositionsDto {
  @ApiProperty({ type: [ColumnPositionUpdateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColumnPositionUpdateDto)
  updates: ColumnPositionUpdateDto[];
}
