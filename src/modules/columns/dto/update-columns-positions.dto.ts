import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ColumnPositionUpdateDto {
  @ApiProperty({ example: 'columnId123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 2 })
  @IsInt()
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
