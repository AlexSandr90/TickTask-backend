import { Body, Controller, Post } from '@nestjs/common';
import { ApiResponse, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/registration')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'Successfully registered' })
  @ApiResponse({ status: 400, description: 'Невірні дані' })
  async createUser(@Body() userData: RegisterDto): Promise<any> {
    return this.authService.register(
      userData.username,
      userData.email,
      userData.password,
    );
  }

  @Post('/login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 400, description: 'Something went wrong' })
  async login(
    @Body() userData: LoginDto,
  ): Promise<any> {
    return this.authService.login(userData.username, userData.password);
  }
}
