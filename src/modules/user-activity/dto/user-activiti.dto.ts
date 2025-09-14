import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, IsDate, IsString, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Вспомогательные классы для валидации вложенных объектов
class MotivationalMessageDto {
  @ApiProperty({ example: '🚀', description: 'Эмодзи для мотивационного сообщения' })
  @IsString()
  emoji: string;

  @ApiProperty({ example: 'Набираете обороты!', description: 'Текст мотивационного сообщения' })
  @IsString()
  text: string;
}

class TimeBreakdownDto {
  @ApiProperty({ example: 0, description: 'Количество лет' })
  @IsInt()
  @Min(0)
  years: number;

  @ApiProperty({ example: 2, description: 'Количество месяцев' })
  @IsInt()
  @Min(0)
  months: number;

  @ApiProperty({ example: 15, description: 'Количество дней' })
  @IsInt()
  @Min(0)
  days: number;

  @ApiProperty({ example: 8, description: 'Количество часов' })
  @IsInt()
  @Min(0)
  hours: number;

  @ApiProperty({ example: 30, description: 'Количество минут' })
  @IsInt()
  @Min(0)
  minutes: number;
}

export class UserActivityDto {
  @ApiProperty({
    example: 360,
    description: 'Общее время на сайте в секундах',
    type: 'string' // Указываем string для Swagger, так как BigInt сериализуется в строку
  })
  @Transform(({ value }) => typeof value === 'bigint' ? Number(value) : value)
  totalTimeSpent: number; // В JavaScript будет number, но в базе BigInt

  @ApiProperty({
    example: '6 минут',
    description: 'Общее время на сайте в удобочитаемом формате',
  })
  @IsString()
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

  // ===== Новые поля для мотивации и разбивки времени =====

  @ApiProperty({
    description: 'Мотивационное сообщение на основе времени активности',
    type: MotivationalMessageDto,
    example: {
      emoji: '🚀',
      text: 'Набираете обороты!'
    }
  })
  @ValidateNested()
  @Type(() => MotivationalMessageDto)
  motivationalMessage: MotivationalMessageDto;

  @ApiProperty({
    description: 'Разбивка общего времени на годы, месяцы, дни, часы, минуты',
    type: TimeBreakdownDto,
    example: {
      years: 0,
      months: 2,
      days: 15,
      hours: 8,
      minutes: 30
    }
  })
  @ValidateNested()
  @Type(() => TimeBreakdownDto)
  timeBreakdown: TimeBreakdownDto;

  @ApiProperty({
    example: 125,
    description: 'Общее количество часов активности (для удобства фронтенда)'
  })
  @IsInt()
  @Min(0)
  totalHours: number;

  @ApiProperty({
    example: 7530,
    description: 'Общее количество минут активности (для удобства фронтенда)'
  })
  @IsInt()
  @Min(0)
  totalMinutes: number;
}