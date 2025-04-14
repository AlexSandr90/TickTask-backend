import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto {
  @ApiProperty({
    description: 'Task title',
    example: 'Just do it',
  })
  title?: string;

  @ApiProperty({
    description: 'Task description',
    example: 'Task description',
  })
  description?: string;
}
