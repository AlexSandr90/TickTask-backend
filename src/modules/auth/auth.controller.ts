import { Request } from 'express';
import { Response } from 'express';
import {
  Get,
  Req,
  Res,
  Body,
  Post,
  Query,
  HttpCode,
  UseGuards,
  HttpStatus,
  Controller,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UserWithoutPassword } from '../users/interfaces/user.interface';
import { UserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { generateJwtToken } from '../../common/utils/jwt.util';
import {
  ApiResponseNotFoundDecorator,
  ApiResponseForbiddenDecorator,
  ApiResponseBadRequestDecorator,
  ApiResponseUnauthorizedDecorator,
  ApiResponseInternalServerErrorDecorator,
} from '../../common/decorators/swagger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService, // Ваш сервис аутентификации
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Registration new User' })
  @ApiResponse({
    status: 201,
    description: 'The user is successfully registered',
  })
  @ApiResponse({
    status: 400,
    description:
      'A user with this email address already exists or the passwords do not match.',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async register(@Body() userDto: UserDto): Promise<UserWithoutPassword> {
    const { username, email, password, confirmPassword } = userDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
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
  @ApiOperation({ summary: 'User authorization' })
  @ApiResponse({ status: 200, description: 'Successful login' })
  @ApiResponse({
    status: 401,
    description: 'Incorrect email address or password',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseNotFoundDecorator('User not found')
  @ApiResponseInternalServerErrorDecorator()
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      return await this.authService.login(
        loginDto.email,
        loginDto.password,
        res,
      );
    } catch (error) {
      throw new UnauthorizedException('Incorrect email address or password');
    }
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Token update' })
  @ApiResponse({ status: 200, description: 'Token updated' })
  @ApiResponseUnauthorizedDecorator('Invalid token')
  @ApiResponseBadRequestDecorator(
    'Bad Request – Invalid task ID or missing param',
  )
  @ApiResponseInternalServerErrorDecorator()
  async refreshToken(
    @Body('email') email: string,
    @Body('refresh_token') refreshToken: string,
    @Res() res: Response,
  ): Promise<{ access_token: string }> {
    if (!email || !refreshToken) {
      throw new BadRequestException('Email or refresh token not sent');
    }

    return this.authService.refreshToken(email, refreshToken, res);
  }

  @Post('logout')
  @ApiOperation({ summary: 'User exit' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@Res() res: Response): Promise<void> {
    try {
      res.clearCookie('access_token', {
        httpOnly: true,
        secure: true, // Убедитесь, что это будет работать только с HTTPS
        sameSite: 'none', // Обеспечивает работу с куки при кросс-доменных запросах
      });

      // Отправляем успешный ответ на логаут
      res.status(200).send({ message: 'Exit is successful' });
    } catch (error) {
      console.error('Logout Error:', error);
      res.status(500).send({ message: 'Server error during logout' });
    }
  }
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {
    
  }
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user;  // Получаем пользователя из запроса (после успешной аутентификации через Google)
      const processedUser = await this.authService.googleLogin(user);
      const { email, googleId } = processedUser;

      if (!googleId) {
        return res.status(400).json({
          error: 'User ID (sub) not found in processed user data',
        });
      }

      const accessToken = generateJwtToken(email, googleId);

      // Записываем токен в куки
      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: true,  // Убедитесь, что ваше приложение работает по HTTPS
        sameSite: 'none',
        maxAge: 10 * 24 * 60 * 60 * 1000,  // Токен будет действителен 10 дней
      });

      // Перенаправление на домашнюю страницу
      return res.redirect(`https://taskcraft.click/home`);
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

  @Post('reset-password')
  async resetPassword(
    @Query('token') token: string,
    @Body('newPassword') newPassword: string,
  ): Promise<void> {
    await this.authService.resetPassword(token, newPassword);
  }

}
