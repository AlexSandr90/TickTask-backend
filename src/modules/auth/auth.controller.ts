import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from '../../models/auth/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/registration')
  async createUser(
    @Body() userData: { username: string; email: string; password: string },
  ): Promise<any> {
    return this.authService.register(
      userData.username,
      userData.email,
      userData.password,
    );
  }

  @Post('/login')
  async login(
    @Body() userData: { username: string; email: string; password: string },
  ): Promise<any> {
    return this.authService.login(userData.username, userData.password);
  }
}
