import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';  // Импортируем JwtModule

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',  // Секрет для подписи
      signOptions: { expiresIn: '1h' },  // Время жизни токена
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UsersService],
})
export class AuthModule {}
