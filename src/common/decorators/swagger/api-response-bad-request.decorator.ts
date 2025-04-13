import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto';

export const ApiResponseBadRequestDecorator = (message?: string) =>
  ApiResponse({
    status: 400,
    description: message || 'Bad Request',
    type: ApiErrorResponseDto,
  });
