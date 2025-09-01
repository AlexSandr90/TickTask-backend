import { Controller, Post, Param, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserActivityService } from './user-activity.service';
import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { UserAnalyticsDto } from '../analytics/dto/analystics.dto';

@ApiTags('Activity')
@Controller('activity')
export class UserActivityController {
  constructor(private readonly activityService: UserActivityService) {}

  @Post(':userId/heartbeat')
  @JwtAuthDecorator() // защита JWT
  @ApiOperation({ summary: 'Update user activity (heartbeat)' })
  async heartbeat(
    @Param('userId') userId: string,
    @CurrentUserDecorator() user: { id: string }, // текущий пользователь из JWT
  ): Promise<UserAnalyticsDto> {
    // Проверяем, что пользователь обновляет только свои данные
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot update another user activity');
    }

    return this.activityService.updateUserActivity(userId);
  }
}
