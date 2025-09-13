import {
  Controller,
  Post,
  Param,
  Body,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserActivityService } from './user-activity.service';
import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { UserActivityDto } from './dto/user-activiti.dto';

@ApiTags('Activity')
@Controller('activity')
export class UserActivityController {
  constructor(private readonly activityService: UserActivityService) {}

  @Post(':userId/heartbeat')
  @JwtAuthDecorator() // защита JWT
  @ApiOperation({ summary: 'Update user activity (heartbeat)' })
  async heartbeat(
    @Param('userId') userId: string,
    @CurrentUserDecorator() user: { id: string },
    @Body() body: { secondsToAdd?: number }, // принимаем количество секунд
  ): Promise<UserActivityDto> {
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot update another user activity');
    }

    try {
      const updatedActivity = await this.activityService.updateUserActivity(
        userId,
        body.secondsToAdd ?? 0, // передаем в сервис
      );
      return updatedActivity;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Failed to update activity: ${error.message}`,
        );
      }
      throw new InternalServerErrorException('Unknown error updating activity');
    }
  }
}
