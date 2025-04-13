import { ApiResponse } from '@nestjs/swagger';
import { ApiErrorResponseDto } from '../../dto/api-error-response.dto';

export const ApiResponseInternalServerErrorDecorator = () =>
  ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ApiErrorResponseDto,
  });
