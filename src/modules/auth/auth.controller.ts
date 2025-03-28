import { Response } from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post, Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserWithoutPassword } from '../users/interfaces/user.interface';
import { UserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';


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
  async login(@Body() loginDto: LoginDto,  @Res() res: Response) {
    return await this.authService.login(loginDto.email, loginDto.password, res); // возвращает access_token и refresh_token

  }

  @Post('refresh/:userId')
  @ApiOperation({ summary: 'Оновлення токену' })
  @ApiResponse({ status: 200, description: 'Токен оновлено' })
  @ApiResponse({ status: 401, description: 'Недійсний токен' })
  async refreshToken(
    @Param('userId') userId: string,
    @Body('refresh_token') refreshToken: string, @Res() res: Response // Теперь ждёт именно refresh_token
  ): Promise<{ access_token: string }> {
    return this.authService.refreshToken(userId, refreshToken,  res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Вихід користувача' })
  @ApiResponse({ status: 200, description: 'Користувач успішно вийшов' })
  async logout(@Res() res: Response): Promise<void> {
    res.clearCookie('access_token'); // Удаляем access-токен из куков
    res.status(200).send({ message: 'Вихід успішний' });
  }
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(@Req() req, @Res() res) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req, @Res() res) {
    try {
      const user = req.user as UserWithoutPassword;

      if (!user) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      const processedUser = await this.authService.googleLogin(user);
      const token = await this.authService.generateJwt(processedUser);

      // Отправляем токен в ответе вместо редиректа
      return res.json({
        message: 'Authentication successful',
        token: token, // Возвращаем токен
        user: processedUser, // Опционально: можно вернуть пользователя
      });
    } catch (error) {
      console.error('Google Callback Error:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  }
  @Post('request-password-reset')
  async requestPasswordReset(@Body('email') email: string): Promise<void> {
    await this.authService.requestPasswordReset(email);
  }

  // Сброс пароля
  @Post('reset-password')
  async resetPassword(
    @Query('token') token: string,
    @Body('newPassword') newPassword: string,
  ): Promise<void> {
    await this.authService.resetPassword(token, newPassword);
  }

}
