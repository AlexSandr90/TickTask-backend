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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { IsActiveGuard } from '../../guards/isActive.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseAvatarService } from './avatar/supabase-avatar.service';


interface RequestWithUser extends Request {
  user: {
    id: string; // или другой тип, если id не строка
    email: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly supabaseAvatarService: SupabaseAvatarService, // Инжектируем сервис
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard, IsActiveGuard)
  async getProfile(@Request() req: RequestWithUser) {
    const email = req.user?.email;

    if (!email) {
      throw new BadRequestException('Email address not found in token');
    }

    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { refreshToken, ...userData } = user;
    return userData;
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard, IsActiveGuard)
  async updateUser(@Request() req: RequestWithUser, @Body() userData: UpdateUserDto) {
    const email = req.user?.email;

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
  async deleteUser(@Request() req: RequestWithUser) {
    const email = req.user?.email;

    if (!email) {
      throw new BadRequestException('Invalid request: user email address missing');
    }

    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (email !== user.email) {
      throw new BadRequestException('You cannot delete someone else\'s account.');
    }

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


  @Post('avatar')
  @UseGuards(JwtAuthGuard, IsActiveGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser, // assuming user data is in request
  ) {
    // Проверка наличия файла
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    console.log(req.user);  // Логируем объект пользователя
    // Получаем расширение файла
    const fileExt = file.originalname.split('.').pop();
    const filePath = `${req.user.id}.${fileExt}`;

    // Загружаем аватар в Supabase
    await this.supabaseAvatarService.uploadAvatar(file.buffer, filePath, file.mimetype);

    // Обновляем путь к аватару в базе данных
    await this.usersService.updateAvatarPath(req.user.id, filePath);

    // Возвращаем URL аватара
    return {
      avatarUrl: this.supabaseAvatarService.getAvatarUrl(filePath),
    };
  }
}