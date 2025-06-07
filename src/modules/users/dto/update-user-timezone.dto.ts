
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserTimezoneDto {
  @ApiPropertyOptional({
    example: 'Europe/Kyiv',
    description: 'User timezone',
    default: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone: string;
}
