import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserTimezoneDto {
  @ApiProperty({
    description: 'User timezone',
    example: 'Europe/Kyiv',
  })
  @IsString()
  @IsNotEmpty()
  timezone: string;
}
