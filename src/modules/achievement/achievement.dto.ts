// src/dto/achievement.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class AchievementDto {
  @ApiProperty({ example: 'first-board' })
  id: string;

  @ApiProperty({ example: 'Первая доска' })
  name: string;

  @ApiProperty({ example: 'Создайте свою первую доску' })
  description: string;

  @ApiProperty({ example: '/icons/first-board.svg' })
  iconUrl: string;

  @ApiProperty({ example: true })
  unlocked: boolean;

  @ApiProperty({
    example: 100,
    description: 'Прогресс в процентах',
    required: false,
  })
  progress?: number;
}

export class AchievementDefinitionDto {
  @ApiProperty({ example: 'abc123-def456-ghi789' })
  id: string;

  @ApiProperty({
    example: 'first-board',
    description: 'Уникальный тип достижения',
  })
  type: string;

  @ApiProperty({ example: 'Первая доска' })
  title: string;

  @ApiProperty({ example: 'Создайте свою первую доску' })
  description: string;

  @ApiProperty({
    example: '/icons/first-board.svg',
    required: false,
    description: 'URL иконки достижения',
  })
  icon?: string;

  @ApiProperty({ example: '2025-09-14T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-09-14T10:30:00.000Z' })
  updatedAt: Date;
}

export class UserAchievementDto {
  @ApiProperty({ example: 'abc123-def456-ghi789' })
  id: string;

  @ApiProperty({ example: 'user123-abc456-def789' })
  userId: string;

  @ApiProperty({ example: 'achievement123-abc456-def789' })
  achievementId: string;

  @ApiProperty({
    example: '2025-09-14T10:30:00.000Z',
    required: false,
    description: 'Дата разблокировки достижения',
  })
  unlockedAt?: Date;

  @ApiProperty({ example: '2025-09-14T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2025-09-14T10:30:00.000Z' })
  updatedAt: Date;

  @ApiProperty({
    type: AchievementDefinitionDto,
    required: false,
    description: 'Информация о достижении',
  })
  achievement?: AchievementDefinitionDto;
}

export class CreateAchievementDefinitionDto {
  @ApiProperty({
    example: 'first-board',
    description: 'Уникальный тип достижения',
  })
  type: string;

  @ApiProperty({ example: 'Первая доска' })
  title: string;

  @ApiProperty({ example: 'Создайте свою первую доску' })
  description: string;

  @ApiProperty({
    example: '/icons/first-board.svg',
    required: false,
    description: 'URL иконки достижения',
    nullable: true,
  })
  icon?: string | null;
}

export class UserAchievementResponseDto {
  @ApiProperty({ example: 'first-board' })
  id: string;

  @ApiProperty({ example: 'first-board' })
  type: string;

  @ApiProperty({ example: 'Первая доска' })
  name: string;

  @ApiProperty({ example: 'Создайте свою первую доску' })
  description: string;

  @ApiProperty({
    example: '/icons/first-board.svg',
    description: 'URL иконки достижения',
  })
  iconUrl: string;

  @ApiProperty({
    example: '2025-09-14T10:30:00.000Z',
    required: false,
    description: 'Дата разблокировки достижения',
    nullable: true,
  })
  unlockedAt?: Date | null;

  @ApiProperty({
    example: true,
    description: 'Статус разблокировки достижения',
  })
  unlocked: boolean;

  @ApiProperty({
    example: 100,
    description: 'Прогресс в процентах (0-100)',
    required: false,
  })
  progress?: number;
}

export class UnlockAchievementResponseDto {
  @ApiProperty({
    example: 'Достижение успешно разблокировано',
    description: 'Сообщение о результате операции',
  })
  message: string;

  @ApiProperty({
    example: true,
    description: 'Было ли достижение успешно разблокировано',
  })
  unlocked: boolean;

  @ApiProperty({
    type: AchievementDto,
    required: false,
    description: 'Данные разблокированного достижения',
  })
  achievement?: AchievementDto;
}

export class InitializeAchievementsResponseDto {
  @ApiProperty({ example: 'Базовые достижения успешно инициализированы' })
  message: string;

  @ApiProperty({
    example: 7,
    description: 'Количество инициализированных достижений',
  })
  count: number;
}
