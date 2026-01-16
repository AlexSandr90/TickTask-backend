import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationSettingsService } from './notification-settings.service';
import { FcmService } from './fcm.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeadlineCheckerService } from './deadline-checker.service';
@Module({
  imports: [ScheduleModule.forRoot()], // ✅
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationSettingsService,
    FcmService,
    DeadlineCheckerService, // ✅
    PrismaService,
  ],
  exports: [NotificationsService, FcmService],
})
export class NotificationsModule {}
