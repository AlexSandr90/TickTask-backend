import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  InternalServerErrorException,
  Param,
  Post,
} from '@nestjs/common';
import { IsInt, IsOptional, Min } from 'class-validator';
import { UserActivityService } from './user-activity.service';
import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';
import { UserActivityDto } from './dto/user-activiti.dto';

// DTO для body запроса
class HeartbeatBodyDto {
  @ApiProperty({
    example: 30,
    description: 'Количество секунд активности для добавления к общему времени',
    required: false,
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  secondsToAdd?: number;
}

@ApiTags('Activity')
@Controller('activity')
export class UserActivityController {
  constructor(private readonly activityService: UserActivityService) {}

  @Post(':userId/heartbeat')
  @JwtAuthDecorator() // защита JWT
  @ApiOperation({
    summary: 'Обновить активность пользователя (heartbeat)',
    description:
      'Обновляет статистику активности пользователя, включая общее время, streak и мотивационные данные. Возвращает обновленную статистику с мотивационным сообщением и разбивкой времени.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID пользователя',
    example: 'user123',
  })
  @ApiBody({
    type: HeartbeatBodyDto,
    description: 'Данные для обновления активности',
    examples: {
      withTime: {
        summary: 'Добавить время активности',
        description: 'Добавляет указанное количество секунд к общему времени',
        value: { secondsToAdd: 30 },
      },
      justUpdate: {
        summary: 'Обновить только streak',
        description: 'Обновляет только streak без добавления времени',
        value: {},
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Активность успешно обновлена',
    type: UserActivityDto,
    example: {
      totalTimeSpent: 7530,
      totalTimeSpentFormatted: '2 часа 5 минут 30 секунд',
      currentStreak: 5,
      longestStreak: 10,
      lastHeartbeat: '2024-01-15T10:30:00.000Z',
      motivationalMessage: {
        emoji: '🚀',
        text: 'Набираете обороты!',
      },
      timeBreakdown: {
        years: 0,
        months: 0,
        days: 0,
        hours: 2,
        minutes: 5,
      },
      totalHours: 2,
      totalMinutes: 125,
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Запрещено - попытка обновить активность другого пользователя',
    example: {
      statusCode: 403,
      message: 'Cannot update another user activity',
      error: 'Forbidden',
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Внутренняя ошибка сервера',
    example: {
      statusCode: 500,
      message: 'Failed to update activity: User not found',
      error: 'Internal Server Error',
    },
  })
  async heartbeat(
    @Param('userId') userId: string,
    @CurrentUserDecorator() user: { id: string },
    @Body() body: HeartbeatBodyDto,
  ): Promise<UserActivityDto> {
    // Проверяем, что пользователь может обновлять только свою активность
    if (user.id !== userId) {
      throw new ForbiddenException('Cannot update another user activity');
    }

    try {
      return await this.activityService.updateUserActivity(
        userId,
        body.secondsToAdd ?? 0, // передаем в сервис
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Failed to update activity: ${error.message}`,
        );
      }
      throw new InternalServerErrorException('Unknown error updating activity');
    }
  }

  @Get('status/:userId')
  @JwtAuthDecorator()
  @ApiOperation({
    summary: 'Получить текущую мотивацию и статус пользователя',
    description:
      'Возвращает текущую мотивацию (emoji + текст), текущий streak и общее время без изменения данных.',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID пользователя',
    example: '614e57b4-16f8-49a9-a225-631ffae01370',
  })
  @ApiResponse({
    status: 200,
    description: 'Статус пользователя успешно получен',
    type: UserActivityDto, // <-- используем готовый DTO
  })
  async getUserStatus(
    @CurrentUserDecorator() user: { id: string },
  ): Promise<UserActivityDto> {
    return await this.activityService.getUserActivityStatus(user.id); // activity уже соответствует структуре UserActivityDto
  }
}
