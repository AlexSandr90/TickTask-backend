import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../../models/auth/auth.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UsersService } from '../../models/users/users.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, UsersService],
})
export class AuthModule {}
