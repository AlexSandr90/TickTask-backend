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
      throw new BadRequestException('Email не найден в токене');
    }

    const user = await this.usersService.findOne(email); // Ищем по email
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    const { refreshToken, ...userData } = user;
    return userData;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, IsActiveGuard)
  async updateUser(@Request() req, @Body() userData: UpdateUserDto) {
    const email = req.user?.email; // Получаем email из токена

    if (!email) {
      throw new UnauthorizedException('Не удалось получить email пользователя из токена');
    }

    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return this.usersService.update(email, userData);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard, IsActiveGuard)
  async deleteUser(@Request() req) {
    const email = req.user?.email; // Получаем email из токена

    if (!email) {
      throw new BadRequestException('Неверный запрос: отсутствует email пользователя');
    }

    // Проверяем, существует ли пользователь в базе данных
    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new BadRequestException('Пользователь не найден');
    }

    // Убедимся, что текущий пользователь может удалить только себя
    if (email !== user.email) {
      throw new BadRequestException('Вы не можете удалить чужой аккаунт');
    }

    // Удаляем пользователя
    await this.usersService.remove(email);

    // Отправляем успешный ответ
    return {
      statusCode: HttpStatus.OK,
      message: 'Аккаунт успешно удален',
    };
  }


  @Get('activate/:token')
  async activateUser(@Param('token') token: string) {
    try {
      return await this.usersService.activateUserByToken(token);
    } catch (error) {
      throw new BadRequestException('Не удалось активировать пользователя');
    }
  }

  @Post('send-magic-link')
  async sendMagicLink(@Body('email') email: string) {
    return this.usersService.sendMagicLink(email);
  }
}
