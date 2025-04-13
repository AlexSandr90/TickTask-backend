import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto';

export const ApiResponseUnauthorizedDecorator = () =>
  ApiResponse({
    status: 401,
    description: 'Unauthorized – Invalid or missing token',
    type: ApiErrorResponseDto,
  });
