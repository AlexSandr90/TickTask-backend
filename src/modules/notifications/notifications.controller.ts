import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsService } from './notification-settings.service';
import { FcmService } from './fcm.service';
import { JwtAuthDecorator } from '../../common/decorators/jwt.auth.decorator';
import { CurrentUserDecorator } from '../../common/decorators/current-user.decorator';

import { RegisterDeviceDto } from './dto/register-device.dto';
import { UpdateSettingsDto } from './dto/ update-settings.dto';

@ApiTags('Notifications')
@Controller('notifications')
@JwtAuthDecorator()
export class NotificationsController {
  constructor(
    private notificationsService: NotificationsService,
    private settingsService: NotificationSettingsService,
    private fcmService: FcmService,
  ) {}

  // ========== УВЕДОМЛЕНИЯ ==========

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Returns list of notifications' })
  async getNotifications(
    @CurrentUserDecorator() user: { id: string },
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notificationsService.getUserNotifications(
      user.id,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Returns unread count' })
  async getUnreadCount(@CurrentUserDecorator() user: { id: string }) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @HttpCode(HttpStatus.OK)
  async markAsRead(
    @Param('id') notificationId: string,
    @CurrentUserDecorator() user: { id: string },
  ) {
    return this.notificationsService.markAsRead(notificationId, user.id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@CurrentUserDecorator() user: { id: string }) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNotification(
    @Param('id') notificationId: string,
    @CurrentUserDecorator() user: { id: string },
  ) {
    await this.notificationsService.deleteNotification(notificationId, user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all notifications' })
  @ApiResponse({ status: 204, description: 'All notifications deleted' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAllNotifications(@CurrentUserDecorator() user: { id: string }) {
    await this.notificationsService.deleteAllNotifications(user.id);
  }

  // ========== НАСТРОЙКИ ==========

  @Get('settings')
  @ApiOperation({ summary: 'Get notification settings' })
  @ApiResponse({ status: 200, description: 'Returns notification settings' })
  async getSettings(@CurrentUserDecorator() user: { id: string }) {
    return this.settingsService.getSettings(user.id);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Settings updated' })
  async updateSettings(
    @CurrentUserDecorator() user: { id: string },
    @Body() dto: UpdateSettingsDto,
  ) {
    return this.settingsService.updateSettings(user.id, dto);
  }

  // ========== УСТРОЙСТВА ==========

  @Post('devices')
  @ApiOperation({ summary: 'Register device for push notifications' })
  @ApiResponse({ status: 201, description: 'Device registered' })
  @HttpCode(HttpStatus.CREATED)
  async registerDevice(
    @CurrentUserDecorator() user: { id: string },
    @Body() dto: RegisterDeviceDto,
  ) {
    return this.fcmService.registerDevice(
      user.id,
      dto.token,
      dto.platform,
      dto.deviceId,
    );
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Unregister device' })
  @ApiResponse({ status: 204, description: 'Device unregistered' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async unregisterDevice(@Param('token') token: string) {
    await this.fcmService.unregisterDevice(token);
  }

  // ========== ТЕСТИРОВАНИЕ (удалить в продакшене) ==========

  @Post('test')
  @ApiOperation({ summary: 'Send test notification' })
  @HttpCode(HttpStatus.OK)
  async sendTestNotification(@CurrentUserDecorator() user: { id: string }) {
    return this.notificationsService.createNotification({
      userId: user.id,
      type: 'ACHIEVEMENT_UNLOCKED' as any,
      title: 'Тестовое уведомление',
      message: 'Это тестовое уведомление для проверки работы системы',
    });
  }
}
