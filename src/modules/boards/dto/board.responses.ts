import { ApiProperty } from '@nestjs/swagger';

export class BoardResponseDTO {
  @ApiProperty({
    description: 'Unique board id',
    example: 'uuid-board-id',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Board title',
    example: 'My Project Board',
    type: 'string',
  })
  title: string;

  @ApiProperty({
    description: 'Board description',
    example: 'Board for tracking project tasks',
    type: 'string',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'User ID who owns the board',
    example: 'uuid-user-id',
    type: 'string',
  })
  userId: string;

  @ApiProperty({
    description: 'Board creation date',
    example: '2024-01-15T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  creationDate: string;

  @ApiProperty({
    description: 'Board last time update',
    example: '2024-01-15T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  updateDate: string;
}

export class BoardsListResponseDto {
  @ApiProperty({
    description: 'List of user boards',
    example: [BoardResponseDTO],
  })
  boards: BoardResponseDTO[];
}

export class BoardDeleteResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Board deleted successfully',
    type: 'string',
  })
  message: string;

  @ApiProperty({
    description: 'ID deleted board',
    example: 'uuid-board-id',
    type: 'string',
  })
  deletedId: string;
}
