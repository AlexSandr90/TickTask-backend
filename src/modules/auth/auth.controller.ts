import { Request } from 'express';
import { Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { generateJwtToken } from '../../common/utils/jwt.util';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService, // Ваш сервис аутентификации
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

  @Post('refresh')
  @ApiOperation({ summary: 'Оновлення токену' })
  @ApiResponse({ status: 200, description: 'Токен оновлено' })
  @ApiResponse({ status: 401, description: 'Недійсний токен' })
  async refreshToken(
    @Body('email') email: string,
    @Body('refresh_token') refreshToken: string,
    @Res() res: Response
  ): Promise<{ access_token: string }> {
    if (!email || !refreshToken) {
      throw new BadRequestException('Email або refresh token не передані');
    }

    return this.authService.refreshToken(email, refreshToken, res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Вихід користувача' })
  @ApiResponse({ status: 200, description: 'Користувач успішно вийшов' })
  async logout(@Res() res: Response): Promise<void> {
    res.clearCookie('access_token');
    res.status(200).send({ message: 'Вихід успішний' });
  }
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(@Req() req: Request, @Res() res: Response) {


    // Возвращаем данные пользователя в ответе
    return res.json({
      message: 'Google authentication successful',
      user: req.user,
    });
  }


  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user;

      if (!user) {
        return res.status(400).json({
          error: 'User ID not found in Google callback',
          code: 'USER_ID_NOT_FOUND',
        });
      }



      const processedUser = await this.authService.googleLogin(user);
      const { email, googleId } = processedUser;
      if (!googleId) {

        return res.status(400).json({
          error: 'User ID (sub) not found in processed user data',
          code: 'USER_ID_NOT_FOUND',
        });
      }




      const accessToken = generateJwtToken(email, googleId);



      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: false,
        maxAge: 10 * 24 * 60 * 60 * 1000,
      });


      return res.json({
        message: 'Authentication successful',
        user: processedUser,
        access_token: accessToken,
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
