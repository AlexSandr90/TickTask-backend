import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategy/google.strategy';
import { PrismaService } from '../../../prisma/prisma.service';
import { APP_CONFIG } from '../../configurations/app.config';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async () => ({
        secret: APP_CONFIG.secretJWT,
        signOptions: { expiresIn: APP_CONFIG.expireJwt },
      }),
    })
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
