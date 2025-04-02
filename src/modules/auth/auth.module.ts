import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategy/google.strategy';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Добавление для глобальной конфигурации

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // Подключение ConfigModule
      inject: [ConfigService], // Внедрение ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('secretJWT') || 'veryHardSecret',
        signOptions: { expiresIn: configService.get<string>('expireJwt') || '10d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    GoogleStrategy,
    PrismaService,
    {
      provide: 'GoogleStrategy',
      useFactory: (prismaService: PrismaService) => {
        const strategy = new GoogleStrategy(prismaService);
        return strategy.strategyConfig();
      },
      inject: [PrismaService],
    },
  ],
})
export class AuthModule {}
