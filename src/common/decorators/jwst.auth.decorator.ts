import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth.guard';

export function JwtAuthDecorator() {
  return applyDecorators(ApiBearerAuth(), UseGuards(JwtAuthGuard));
}
