// src/controllers/achievement.controller.ts
import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';

import {
  CreateAchievementDefinitionDto,
  InitializeAchievementsResponseDto,
  UserAchievementResponseDto,
} from './achievement.dto';
import { AchievementsService } from './achievement.service';

@ApiTags('Achievements')
@Controller('achievements')
export class AchievementController {
  constructor(private readonly achievementService: AchievementsService) {}

  @Get('definitions')
  @ApiOperation({ summary: 'Get all available achievement definitions' })
  async getAllDefinitions() {
    return this.achievementService.getAllAchievementDefinitions();
  }

  @Get('my')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get my achievements' })
  async getMyAchievements(
    @CurrentUserDecorator() user: { id: string },
  ): Promise<UserAchievementResponseDto[]> {
    return this.achievementService.getUserAchievements(user.id);
  }

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

  @Post('definition')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Create a new achievement definition' })
  async createDefinition(@Body() dto: CreateAchievementDefinitionDto) {
    return this.achievementService.createAchievementDefinition(dto);
  }

  @Post('initialize')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Initialize basic achievements' })
  async initializeBasics(): Promise<InitializeAchievementsResponseDto> {
    return this.achievementService.initializeBasicAchievements();
  }
}
