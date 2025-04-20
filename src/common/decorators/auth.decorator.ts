import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { IsActiveGuard } from '../../guards/isActive.guard';

export function AuthProtectedDecorator() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(JwtAuthGuard, IsActiveGuard),
  );
}
