import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto';

export const ApiResponseForbiddenDecorator = (message?: string) =>
  ApiResponse({
    status: 403,
    description: message || 'Forbidden – User has no access to this board',
    type: ApiErrorResponseDto,
  });
