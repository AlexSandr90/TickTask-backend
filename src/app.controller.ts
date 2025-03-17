import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('/app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/bye')
  getBye(): string {
    return this.appService.getBye();
  }

  @Post('/registration')
  async createUser(
    @Body() userData: { username: string; email: string; password: string },
  ): Promise<any> {
    return this.appService.createUser(
      userData.username,
      userData.email,
      userData.password,
    );
  }
}
