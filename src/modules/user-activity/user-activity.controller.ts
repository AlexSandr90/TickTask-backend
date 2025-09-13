import {
  Controller,
  Post,
  Param,
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
  ): Promise<UserActivityDto> {
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot update another user activity');
    }

    try {
      const updatedActivity =
        await this.activityService.updateUserActivity(userId);
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
