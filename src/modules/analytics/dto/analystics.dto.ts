import { ApiProperty } from '@nestjs/swagger';

export class UserAnalyticsDto {
  @ApiProperty({ example: 5, description: 'Всего досок у пользователя' })
  totalBoards: number;

  @ApiProperty({ example: 12, description: 'Всего колонок у пользователя' })
  totalColumns: number;

  @ApiProperty({ example: 40, description: 'Всего задач у пользователя' })
  totalTasks: number;

  @ApiProperty({ example: 25, description: 'Количество выполненных задач' })
  completedTasks: number;

  @ApiProperty({ example: 15, description: 'Количество задач в процессе' })
  inProgressTasks: number;

  @ApiProperty({
    example: new Date(),
    description: 'Дата последнего обновления аналитики',
  })
  updatedAt: Date;
}
