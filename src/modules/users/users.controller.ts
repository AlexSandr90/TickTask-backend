import { Controller, Get, Patch, Delete, Param, Body, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';


@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async getUserById(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  async updateUser(@Param('id') id: string, @Body() userData: UpdateUserDto) {
    return this.usersService.update(id, userData);
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
  @Post('send-magic-link')
  async sendMagicLink(@Body('email') email: string) {
    return this.usersService.sendMagicLink(email);
  }

  // Эндпоинт для активации пользователя
  @Post('activate/:token')
  async activateUser(@Param('token') token: string) {
    return this.usersService.activateUserByToken(token);
  }
}

