import {
  Controller,
  Get,
  Param,
  Patch,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { UserAnalyticsDto } from './dto/analystics.dto';
import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('tasks-per-day/:userId')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get user analytics' })
  async getTasksPerDay(@Param('userId') userId: string) {
    return this.analyticsService.getTasksPerDay(userId);
  }

  // Получение аналитики пользователя (создаст запись, если нет)
  @Get(':userId')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Get user analytics' })
  async getAnalytics(
    @Param('userId') userId: string,
    @CurrentUserDecorator() user: { id: string },
  ): Promise<UserAnalyticsDto> {
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot access another user analytics');
    }

    return this.analyticsService.updateAnalytics(userId, {});
  }

  // Увеличение счетчиков
  @Patch(':userId/increment-board')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Increment total boards count for user' })
  async incrementBoard(
    @Param('userId') userId: string,
    @CurrentUserDecorator() user: { id: string },
  ): Promise<UserAnalyticsDto> {
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot modify another user analytics');
    }

    return this.analyticsService.updateAnalytics(userId, {
      totalBoards: { increment: 1 },
    });
  }

  @Patch(':userId/increment-column')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Increment total columns count for user' })
  async incrementColumn(
    @Param('userId') userId: string,
    @CurrentUserDecorator() user: { id: string },
  ): Promise<UserAnalyticsDto> {
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot modify another user analytics');
    }

    return this.analyticsService.updateAnalytics(userId, {
      totalColumns: { increment: 1 },
    });
  }

  @Patch(':userId/increment-task')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Increment total tasks count for user' })
  async incrementTask(
    @Param('userId') userId: string,
    @CurrentUserDecorator() user: { id: string },
  ): Promise<UserAnalyticsDto> {
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot modify another user analytics');
    }

    return this.analyticsService.updateAnalytics(userId, {
      totalTasks: { increment: 1 },
    });
  }

  @Patch(':userId/refresh-tasks')
  @JwtAuthDecorator()
  @ApiOperation({ summary: 'Refresh task stats (completed/in-progress)' })
  async refreshTaskStats(
    @Param('userId') userId: string,
    @CurrentUserDecorator() user: { id: string },
  ): Promise<UserAnalyticsDto> {
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot modify another user analytics');
    }

    // Обновляем аналитическую запись (результат не нужен)
    await this.analyticsService.updateAnalytics(userId, {});

    // Считаем completed/in-progress задачи
    const tasks = await this.analyticsService['prisma'].task.findMany({
      where: { userId },
    });

    const completedTasks = tasks.filter((t) => t.isCompleted).length;
    const inProgressTasks = tasks.length - completedTasks;

    return this.analyticsService.updateAnalytics(userId, {
      completedTasks: { set: completedTasks },
      inProgressTasks: { set: inProgressTasks },
    });
  }
}
