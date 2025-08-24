import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class EmailChangeGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context);
    if (!result) return false;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Дозволяємо доступ якщо є запит на зміну email
    if (!user) return false;

    return user.isActive || (user.pendingEmail && user.pendingEmail.length > 0);
  }
}
