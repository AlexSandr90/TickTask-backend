import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, IsDate } from 'class-validator';

export class UserActivityDto {
  @ApiProperty({ example: 360, description: 'Общее время на сайте в секундах' })
  @IsInt()
  @Min(0)
  totalTimeSpent: number;

  @ApiProperty({
    example: '6 минут',
    description: 'Общее время на сайте в удобочитаемом формате',
  })
  totalTimeSpentFormatted: string;

  @ApiProperty({ example: 5, description: 'Текущая серия дней онлайн' })
  @IsInt()
  @Min(0)
  currentStreak: number;

  @ApiProperty({ example: 10, description: 'Рекордная серия дней онлайн' })
  @IsInt()
  @Min(0)
  longestStreak: number;

  @ApiPropertyOptional({
    example: new Date(),
    description: 'Последний heartbeat пользователя',
  })
  @IsOptional()
  @IsDate()
  lastHeartbeat?: Date;
}
