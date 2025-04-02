import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UsersService } from '../modules/users/users.service';


@Injectable()
export class IsActiveGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.email) {
      throw new ForbiddenException('Доступ запрещен');
    }

    return this.usersService.findByEmail(user.email).then((foundUser) => {
      if (!foundUser || !foundUser.isActive) {
        throw new ForbiddenException('Аккаунт не активирован');
      }
      return true;
    });
  }
}
