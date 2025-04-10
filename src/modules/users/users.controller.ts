import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Post,
  BadRequestException,
  UseGuards,
  Request,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { IsActiveGuard } from '../../guards/isActive.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, IsActiveGuard)
  async getProfile(@Request() req) {
    const email = req.user?.email; // Берем email из user объекта

    if (!email) {
      throw new BadRequestException('Email address not found in token');
    }

    const user = await this.usersService.findOne(email); // Ищем по email
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { refreshToken, ...userData } = user;
    return userData;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, IsActiveGuard)
  async updateUser(@Request() req, @Body() userData: UpdateUserDto) {
    const email = req.user?.email; // Получаем email из токена

    if (!email) {
      throw new UnauthorizedException('Failed to get user email from token');
    }

    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.usersService.update(email, userData);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard, IsActiveGuard)
  async deleteUser(@Request() req) {
    const email = req.user?.email; // Получаем email из токена

    if (!email) {
      throw new BadRequestException(
        'Invalid request: user email address missing',
      );
    }

    // Проверяем, существует ли пользователь в базе данных
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Убедимся, что текущий пользователь может удалить только себя
    if (email !== user.email) {
      throw new BadRequestException('You cannot delete someone elses account.');
    }

    // Удаляем пользователя
    await this.usersService.remove(email);

    return {
      statusCode: HttpStatus.OK,
      message: 'Account successfully deleted',
    };
  }

  @Get('activate/:token')
  async activateUser(@Param('token') token: string) {
    try {
      return await this.usersService.activateUserByToken(token);
    } catch (error) {
      throw new BadRequestException('Failed to activate user');
    }
  }

  @Post('send-magic-link')
  async sendMagicLink(@Body('email') email: string) {
    return this.usersService.sendMagicLink(email);
  }
}
