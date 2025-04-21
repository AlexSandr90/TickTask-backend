import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto';

export const ApiResponseUnauthorizedDecorator = (message?: string) =>
  ApiResponse({
    status: 401,
    description: message || 'Unauthorized – Invalid or missing token',
    type: ApiErrorResponseDto,
  });
