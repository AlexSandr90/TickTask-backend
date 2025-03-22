import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, UsersService],
})
export class AuthModule {}
