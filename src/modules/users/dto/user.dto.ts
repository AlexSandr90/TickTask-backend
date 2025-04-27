import { IsOptional, IsString, IsBoolean, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'User name',
    example: 'Nikolas',
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({
    description: 'User Email',
    example: 'nikolas.kage@gmail.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'User theme',
    example: 'light',
  })
  @IsOptional()
  @IsString()
  theme?: string;

  @ApiPropertyOptional({
    description: 'User notification',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  notifications?: boolean;

  @ApiPropertyOptional({
    description: 'Is user activated his account',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
