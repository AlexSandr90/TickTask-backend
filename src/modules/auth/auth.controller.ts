import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserWithoutPassword } from '../users/interfaces/user.interface';
import { UserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Реєстрація нового користувача' })
  @ApiResponse({
    status: 201,
    description: 'Користувач успішно зареєстрований',
  })
  @ApiResponse({
    status: 400,
    description: 'Користувач з таким email вже існує або паролі не співпадають',
  })
  async register(@Body() userDto: UserDto): Promise<UserWithoutPassword> {
    const { username, email, password, confirmPassword } = userDto;

    if (password !== confirmPassword) {
      console.warn('⚠️ Пароли не совпадают');
    }

    return this.authService.register(
      username,
      email,
      password,
      confirmPassword,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Авторизація користувача' })
  @ApiResponse({ status: 200, description: 'Успішний вхід' })
  @ApiResponse({ status: 401, description: 'Неправильний email або пароль' })
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto.email, loginDto.password); // возвращает access_token и refresh_token
  }

  @Post('refresh/:userId')
  @ApiOperation({ summary: 'Оновлення токену' })
  @ApiResponse({ status: 200, description: 'Токен оновлено' })
  @ApiResponse({ status: 401, description: 'Недійсний токен' })
  async refreshToken(
    @Param('userId') userId: string,
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ access_token: string }> {
    return this.authService.refreshToken(userId, refreshToken);
  }

  @Post('logout/:userId')
  @ApiOperation({ summary: 'Вихід користувача' })
  @ApiResponse({ status: 200, description: 'Користувач успішно вийшов' })
  async logout(@Param('userId') userId: string): Promise<void> {
    return this.authService.logout(userId);
  }
}

