import { ApiOperation, ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  message: string;

  @ApiProperty({ example: 'BadRequestException' })
  error: string;
}
