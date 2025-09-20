import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Request,
  Res,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseAvatarService } from './avatar/supabase-avatar.service';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  ApiResponseBadRequestDecorator,
  ApiResponseForbiddenDecorator,
  ApiResponseInternalServerErrorDecorator,
  ApiResponseNotFoundDecorator,
  ApiResponseUnauthorizedDecorator,
} from '../../common/decorators/swagger';
import { AuthProtectedDecorator } from '../../common/decorators/auth.decorator';
import { DEFAULT_AVATAR_PATH } from '../../common/constants';
import { UpdateUserTimezoneDto } from './dto/update-user-timezone.dto';
import { ChangeEmailDto } from './dto/change-email.dto';
import { EmailChangeGuard } from '../../guards/email-change-guard';

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    avatarPath?: string;
  };
}

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly supabaseAvatarService: SupabaseAvatarService, // Инжектируем сервис
  ) {}

  @Get('me')
  @AuthProtectedDecorator()
  @ApiOperation({ summary: 'Get User' })
  @ApiResponse({
    status: 200,
    description: 'The users list of all users',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async getProfile(@Request() req: RequestWithUser) {
    const email = req.user?.email;
    if (!email) {
      throw new BadRequestException('Email address not found in token');
    }

    const user = await this.usersService.getUserWithAvatarUrl(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return user;
  }

  @Get('timezones')
  @AuthProtectedDecorator()
  @ApiOperation({ summary: 'Get User Timezones' })
  @ApiResponse({
    status: 200,
    description: 'User get all timezones successfully',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  getAvailableTimezones() {
    return {
      timezones: this.usersService.getAvailableTimezones(),
    };
  }

  @Patch('me')
  @AuthProtectedDecorator()
  @ApiOperation({ summary: 'Update User' })
  @ApiResponse({
    status: 200,
    description: 'User has been updated successfully',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async updateUser(
    @Request() req: RequestWithUser,
    @Body() userData: UpdateUserDto,
  ) {
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
  @AuthProtectedDecorator()
  @ApiOperation({ summary: 'Delete User' })
  @ApiResponse({
    status: 200,
    description: 'User has been deleted successfully',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async deleteUser(@Request() req: RequestWithUser) {
    const email = req.user?.email;

    if (!email) {
      throw new BadRequestException(
        'Invalid request: user email address missing',
      );
    }

    const user = await this.usersService.findOne(email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (email !== user.email) {
      throw new BadRequestException(
        "You cannot delete someone else's account.",
      );
    }

    await this.usersService.remove(email);

    return {
      statusCode: HttpStatus.OK,
      message: 'Account successfully deleted',
    };
  }

  @Get('activate/:token')
  @ApiOperation({ summary: 'Activated User account' })
  @ApiResponse({
    status: 200,
    description: 'User account has been activated successfully',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async activateUser(
    @Param('token') token: string,
    @Res() res: Response, // <--- нужно получить объект Response
  ) {
    try {
      return await this.usersService.activateUserByTokenAndGenerateToken(
        token,
        res,
      );
    } catch (error) {
      throw new BadRequestException('Failed to activate user');
    }
  }

  // @AuthProtectedDecorator()

  @Delete('cancel-email-change')
  @UseGuards(JwtAuthGuard, EmailChangeGuard)
  @ApiOperation({ summary: 'Cancel Email change' })
  @ApiResponse({
    status: 200,
    description: 'Cancel Email change',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async cancelEmailChange(@Request() req) {
    const userId = req.user.id;
    return this.usersService.cancelEmailChange(userId);
  }

  @Post('change-email')
  @AuthProtectedDecorator()
  @ApiOperation({ summary: 'Request Email change' })
  @ApiResponse({
    status: 200,
    description: 'Email change confirmation sent',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  async requestEmailChange(
    @Request() req,
    @Body() changeEmailDto: ChangeEmailDto,
  ) {
    const userId = req.user.id;
    return this.usersService.requestEmailChange(
      userId,
      changeEmailDto.newEmail,
    );
  }

  @Get('confirm-email-change/:token')
  @ApiOperation({ summary: 'Confirm Email change' })
  @ApiResponse({
    status: 200,
    description: 'Email change confirmed successfully',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async confirmEmailChange(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    return await this.usersService.confirmEmailChange(token, res);
  }

  @Post('send-magic-link')
  @ApiOperation({ summary: 'Magic Link' })
  @ApiResponse({
    status: 200,
    description: 'Magik Link has been successfully sent',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async sendMagicLink(@Body('email') email: string) {
    return this.usersService.sendMagicLink(email);
  }

  @Post('avatar')
  @AuthProtectedDecorator()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Update User avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Avatar image upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'User avatar has been updated successfully',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async uploadAvatar(
    @UploadedFile() file: any,
    @Request() req: RequestWithUser, // assuming user data is in request
  ) {
    // Проверка наличия файла
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    console.log(req.user); // Логируем объект пользователя

    if (req.user.avatarPath && req.user.avatarPath !== DEFAULT_AVATAR_PATH) {
      await this.supabaseAvatarService.deleteAvatar(req.user.avatarPath);
    }

    // Получаем расширение файла
    const fileExt = file.originalname.split('.').pop();
    const filePath = `${req.user.id}.${fileExt}`;

    // Загружаем аватар в Supabase
    await this.supabaseAvatarService.uploadAvatar(
      file.buffer,
      filePath,
      file.mimetype,
    );

    // Обновляем путь к аватару в базе данных
    await this.usersService.updateAvatarPath(req.user.id, filePath);

    // Возвращаем URL аватара
    return {
      avatarUrl: this.supabaseAvatarService.getAvatarUrl(filePath),
    };
  }

  @Put('avatar')
  @AuthProtectedDecorator()
  @UseInterceptors(FileInterceptor('file'))
  async replaceAvatar(
    @UploadedFile() file: any,
    @Request() req: RequestWithUser,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.uploadAvatar(file, req);
  }

  @Delete('avatar')
  @AuthProtectedDecorator()
  async resetAvatar(@Request() req: any) {
    await this.usersService.resetToDefaultAvatar(req.user.id);

    return {
      avatarUrl: this.supabaseAvatarService.getAvatarUrl(DEFAULT_AVATAR_PATH),
    };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard) // Используем UseGuards и передаем JwtAuthGuard
  async changePassword(
    @Request() req: any, // Получаем данные пользователя из запроса
    @Body() changePasswordDto: ChangePasswordDto, // DTO с данными для обновления пароля
  ) {
    const { currentPassword, newPassword } = changePasswordDto;
    const userId = req.user.id; // ID пользователя из JWT токена

    // Вызываем сервис для изменения пароля
    return this.usersService.changePassword(
      userId,
      currentPassword,
      newPassword,
    );
  }

  @Put('timezone')
  @AuthProtectedDecorator()
  @ApiOperation({ summary: 'Update User Timezone' })
  @ApiResponse({
    status: 200,
    description: 'User updated timezone successfully',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async updateTimezone(
    @Request() req,
    @Body() updateUserTimezoneDto: UpdateUserTimezoneDto,
  ) {
    const userId = req.user.id;

    const updatedUser = await this.usersService.updateUserTimeZone(
      userId,
      updateUserTimezoneDto.timezone,
    );

    return {
      message: 'User updated successfully',
      timezone: updatedUser.timezone,
    };
  }

  @Get('current-time/:userId')
  @AuthProtectedDecorator()
  @ApiOperation({ summary: 'Update User Timezone' })
  @ApiResponse({
    status: 200,
    description: 'User updated timezone successfully',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async getCurrentTimeInUserTimezone(@Param('userId') userId: string) {
    const user = await this.usersService.findOneById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      currentTime: this.usersService.getCurrentTimeInUserTimezone(
        user.timezone,
      ),
      timezone: user.timezone,
    };
  }

  @Get(':id')
  @AuthProtectedDecorator()
  @ApiOperation({ summary: 'Get User By id' })
  @ApiResponse({
    status: 200,
    description: 'The user received by id',
  })
  @ApiResponseBadRequestDecorator()
  @ApiResponseUnauthorizedDecorator()
  @ApiResponseForbiddenDecorator()
  @ApiResponseNotFoundDecorator()
  @ApiResponseInternalServerErrorDecorator()
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findOneById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Get()
  @AuthProtectedDecorator() // если нужен доступ только для авторизованных
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }
}
