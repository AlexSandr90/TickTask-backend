import { IsBoolean, IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  pushEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  // Уведомления о задачах
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  taskAssigned?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  taskDeadlineSoon?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  taskOverdue?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  taskCompleted?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  taskCommented?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  taskPriorityChanged?: boolean;

  // Уведомления о досках
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  boardInvitation?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  boardRemoved?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  boardRoleChanged?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  boardDeleted?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  newBoardMember?: boolean;

  // Системные уведомления
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  achievementUnlocked?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  streakMilestone?: boolean;

  // Тихий режим
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  quietHoursEnabled?: boolean;

  @ApiProperty({ required: false, example: '22:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'quietHoursStart must be in HH:MM format',
  })
  quietHoursStart?: string;

  @ApiProperty({ required: false, example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'quietHoursEnd must be in HH:MM format',
  })
  quietHoursEnd?: string;
}