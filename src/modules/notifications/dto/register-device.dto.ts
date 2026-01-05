import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceDto {
  @ApiProperty({ description: 'FCM device token' })
  @IsString()
  token: string;

  @ApiProperty({ enum: ['WEB', 'IOS', 'ANDROID'] })
  @IsEnum(['WEB', 'IOS', 'ANDROID'])
  platform: 'WEB' | 'IOS' | 'ANDROID';

  @ApiProperty({ required: false, description: 'Unique device identifier' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}