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
  ApiResponseBadRequestDecorator,
  ApiResponseUnauthorizedDecorator,
  ApiResponseInternalServerErrorDecorator,
} from '../../common/decorators/swagger';
import { APP_CONFIG } from '../../configurations/app.config';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { AUTH_CONFIG } from '../../configurations/auth.config';
import { SetGooglePasswordDto } from './dto/set-password.dto';
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
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
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
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<{ access_token: string }> {
    const refreshToken = req.cookies['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found in cookies');
    }

    return this.authService.refreshToken(refreshToken, res);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'User exit' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const user = req.user as { email: string };
      const email = user?.email;

      if (!email) {
        throw new UnauthorizedException('User not authenticated');
      }

      await this.authService.logout(email);

      const isProduction = process.env.NODE_ENV === 'production';

      res.clearCookie('access_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? 'taskcraft.click' : undefined,
        path: '/',
      });

      res.clearCookie('refresh_token', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? 'taskcraft.click' : undefined,
        path: '/',
      });

      res.status(200).send({ message: 'Exit is successful' });
    } catch (error) {
      console.error('Logout Error:', error);
      res.status(500).send({ message: 'Server error during logout' });
    }
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const user = req.user; // Получаем пользователя из запроса (после успешной аутентификации через Google)
      const processedUser = await this.authService.googleLogin(user);
      const { email, googleId } = processedUser;

      if (!googleId) {
        return res.status(400).json({
          error: 'User ID (sub) not found in processed user data',
        });
      }


      const { accessToken, refreshToken } = await this.authService.generateTokens(processedUser);

      const isProduction = process.env.NODE_ENV === 'production';

      res.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,                     // HTTPS только в проде
        sameSite: isProduction ? 'none' : 'lax',  // в проде нужно none
        domain: isProduction ? 'taskcraft.click' : undefined, // домен только в проде
        maxAge: Number(AUTH_CONFIG.expireJwt),
        path: '/',
      });

      res.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: isProduction ? 'taskcraft.click' : undefined,
        maxAge: Number(AUTH_CONFIG.expireJwtRefresh),
        path: '/',
      });

      // Перенаправление на домашнюю страницу
      return res.redirect(`${APP_CONFIG.baseUrl}/home`);
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

  @UseGuards(JwtAuthGuard)
  @Post('set-password')
  async setGooglePassword(
    @Req() req,
    @Body() dto: SetGooglePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.setPasswordForGoogleUser(req.user.id, dto.newPassword);
  }
}
