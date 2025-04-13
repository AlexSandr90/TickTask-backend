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
  Res,
  UnauthorizedException,
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
  @ApiOperation({ summary: 'New user registration' })
  @ApiResponse({
    status: 201,
    description: 'The user is successfully registered',
  })
  @ApiResponse({
    status: 400,
    description:
      'A user with this email address already exists or the passwords do not match.',
  })
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
  @ApiResponse({ status: 401, description: 'Invalid token' })
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
    res.clearCookie('access_token');
    res.status(200).send({ message: 'Exit is successful' });
  }
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleLogin(@Req() req: Request, @Res() res: Response) {
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

  @Post('reset-password')
  async resetPassword(
    @Query('token') token: string,
    @Body('newPassword') newPassword: string,
  ): Promise<void> {
    await this.authService.resetPassword(token, newPassword);
  }
}
