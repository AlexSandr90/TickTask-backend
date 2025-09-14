// src/controllers/achievement.controller.ts
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { AchievementService } from './achievement.service';
import {
  CreateAchievementDefinitionDto,
  InitializeAchievementsResponseDto,
  UserAchievementResponseDto,
} from './achievement.dto';

@ApiTags('Achievements')
@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementService) {}

  // Получить все достижения пользователя
  @Get(':userId')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get all user achievements' })
  async getUserAchievements(
    @Param('userId') userId: string,
    @CurrentUserDecorator() user: { id: string },
  ): Promise<UserAchievementResponseDto[]> {
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot access another user achievements');
    }
    return this.achievementService.getUserAchievements(userId);
  }

  // Создать новое определение достижения
  @Post('definition')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Create a new achievement definition' })
  async createDefinition(@Body() dto: CreateAchievementDefinitionDto) {
    return this.achievementService.createAchievementDefinition(dto);
  }

  // Инициализация базовых достижений
  @Post('initialize')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Initialize basic achievements' })
  async initializeBasics(): Promise<InitializeAchievementsResponseDto> {
    return this.achievementService.initializeBasicAchievements();
  }

  // Разблокировка достижения для пользователя
  @Post('unlock/:userId/:achievementType')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Unlock an achievement for a user' })
  async unlockAchievement(
    @Param('userId') userId: string,
    @Param('achievementType') achievementType: string,
    @CurrentUserDecorator() user: { id: string },
  ) {
    if (user.id !== userId) {
      throw new ForbiddenException(
        'Cannot unlock achievement for another user',
      );
    }

    const unlocked = await this.achievementService.unlockAchievement(
      userId,
      achievementType,
    );

    return {
      userId,
      achievementType,
      unlocked,
    };
  }
}
