import { Controller, Get, Patch, Delete, Param, Body, Post, BadRequestException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { AuthGuard } from '../../guards/auth.guard';



@Controller('users')

export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @UseGuards(AuthGuard)
  async getUserById(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateUser(@Param('id') id: string, @Body() userData: UpdateUserDto) {
    return this.usersService.update(id, userData);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
  @Post('send-magic-link')
  async sendMagicLink(@Body('email') email: string) {
    return this.usersService.sendMagicLink(email);
  }

  // Эндпоинт для активации пользователя
  @Get('activate/:token')
  async activateUser(@Param('token') token: string) {
    // Логируем, что токен поступил в контроллер
    console.log('🔑 Токен получен в контроллере:', token);

    try {
      // Вызываем сервис для активации пользователя
      return await this.usersService.activateUserByToken(token);
    } catch (error) {
      // Логируем ошибку и пробрасываем её дальше
      console.error('⛔ Ошибка при активации пользователя:', error.message);
      throw new BadRequestException('Не удалось активировать пользователя');
    }
  }
}
