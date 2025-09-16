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

  // ✅ Публичный эндпоинт: получить все достижения, доступные в системе
  @Get('definitions')
  @ApiOperation({ summary: 'Get all available achievement definitions' })
  async getAllDefinitions() {
    return this.achievementService.getAllAchievementDefinitions();
  }

  // ✅ НОВЫЙ: Получить достижения текущего пользователя
  @Get('my')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get my achievements' })
  async getMyAchievements(
    @CurrentUserDecorator() user: { id: string },
  ): Promise<UserAchievementResponseDto[]> {
    return this.achievementService.getUserAchievements(user.id);
  }

  // ✅ НОВЫЙ: Разблокировать достижение для текущего пользователя
  @Post('unlock/:achievementType')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Unlock my achievement' })
  async unlockMyAchievement(
    @Param('achievementType') achievementType: string,
    @CurrentUserDecorator() user: { id: string },
  ) {
    const unlocked = await this.achievementService.unlockAchievement(
      user.id,
      achievementType,
    );

    return {
      userId: user.id,
      achievementType,
      unlocked,
    };
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

  // ⚠️ СТАРЫЙ: Получить достижения по userId (оставлен для совместимости)
  @Get(':userId')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get user achievements by ID' })
  async getUserAchievements(
    @Param('userId') userId: string,
    @CurrentUserDecorator() user: { id: string },
  ): Promise<UserAchievementResponseDto[]> {
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot access another user achievements');
    }
    return this.achievementService.getUserAchievements(userId);
  }

  // ⚠️ СТАРЫЙ: Разблокировать достижение по userId (оставлен для совместимости)
  @Post('unlock/:userId/:achievementType')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Unlock achievement for specific user' })
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