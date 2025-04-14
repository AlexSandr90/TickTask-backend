import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto';

export const ApiResponseNotFoundDecorator = (message?: string) =>
  ApiResponse({
    status: 404,
    description: message || 'Not Found',
    type: ApiErrorResponseDto,
  });
