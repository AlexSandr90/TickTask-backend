import { Request } from 'express';
import { Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res, UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserWithoutPassword } from '../users/interfaces/user.interface';
import { UserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { JwtService } from '@nestjs/jwt';
import { generateJwtToken } from '../../common/utils/jwt.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService, // Ваш сервис аутентификации
    private readonly jwtService: JwtService, // Внедряем JwtService
  ) {}
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
      throw new BadRequestException('Пароли не совпадают');
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
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      return await this.authService.login(loginDto.email, loginDto.password, res);
    } catch (error) {

      throw new UnauthorizedException('Неправильный email или пароль');
    }
  }

  @Post('refresh/:userId')
  @ApiOperation({ summary: 'Оновлення токену' })
  @ApiResponse({ status: 200, description: 'Токен оновлено' })
  @ApiResponse({ status: 401, description: 'Недійсний токен' })
  async refreshToken(
    @Param('userId') userId: string,
    @Body('refresh_token') refreshToken: string,
    @Res() res: Response, // Теперь ждёт именно refresh_token
  ): Promise<{ access_token: string }> {  if (!refreshToken) {
    throw new BadRequestException('Refresh token не передан');
  }
    return this.authService.refreshToken(userId, refreshToken, res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Вихід користувача' })
  @ApiResponse({ status: 200, description: 'Користувач успішно вийшов' })
  async logout(@Res() res: Response): Promise<void> {
    res.clearCookie('access_token'); // Удаляем access-токен из куков
    res.status(200).send({ message: 'Вихід успішний' });
  }
  @Get('google')
  @UseGuards(AuthGuard('google'))  // Используем guard для аутентификации через Google
  googleLogin(@Req() req: Request, @Res() res: Response) {
    // После успешной аутентификации, данные пользователя будут доступны в req.user
    console.log('Google User:', req.user);  // Логируем данные пользователя (можно заменить на свои)

    // Возвращаем данные пользователя в ответе
    return res.json({
      message: 'Google authentication successful',
      user: req.user,  // Данные пользователя
    });
  }


  @Get('google/callback')
  @UseGuards(AuthGuard('google')) // Защищаем через Google OAuth
  async googleLoginCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user;

      if (!user) {
        console.error('Google callback: User not found in request');
        return res.status(400).json({
          error: 'User ID not found in Google callback',
          code: 'USER_ID_NOT_FOUND',
        });
      }

      console.log('User data from Google callback:', user);

      const processedUser = await this.authService.googleLogin(user); // Обработка данных пользователя, если необходимо
      const { email, sub } = processedUser;

      // Проверяем, что ID пользователя (sub) присутствует
      if (!sub) {
        console.error('Processed user data missing sub ID:', processedUser);
        return res.status(400).json({
          error: 'User ID (sub) not found in processed user data',
          code: 'USER_ID_NOT_FOUND',
        });
      }

      console.log('Processed user:', processedUser);

      // Генерация JWT
      const accessToken = generateJwtToken(email, sub);
      console.log('Generated JWT:', accessToken);

      // Устанавливаем JWT в куки
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: false,  // В продакшн-среде это должно быть true
        maxAge: 10 * 24 * 60 * 60 * 1000,  // 10 дней
      });

      // Возвращаем успешный ответ
      return res.json({
        message: 'Authentication successful',
        user: processedUser,  // Вы можете вернуть информацию о пользователе, если нужно
        access_token: accessToken, // Также можно вернуть токен напрямую, если необходимо
      });
    } catch (error) {
      console.error('Google Callback Error:', error);
      return res.status(500).json({
        error: 'Server error',
        code: 'SERVER_ERROR',
      });
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
