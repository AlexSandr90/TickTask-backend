import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';

export class ToggleCompleteDto {
  @ApiProperty({
    description:
      'ID задачи, которую нужно отметить как выполненную/невыполненную',
    example: '663a3fa5f7cfc3d98dcbfdba',
  })
  @IsString()
  taskId: string;

  @ApiProperty({
    description: 'Статус выполнения задачи',
    example: true,
  })
  @IsBoolean()
  isCompleted: boolean;
}
