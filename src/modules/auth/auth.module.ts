import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategy/google.strategy';
import { PrismaService } from '../../../prisma/prisma.service';
import { AUTH_CONFIG } from '../../configurations/auth.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { EmailService } from '../../email/email.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => UsersModule),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async () => ({
        secret: AUTH_CONFIG.secretJWT,
        signOptions: { expiresIn: AUTH_CONFIG.expireJwt },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    EmailService,
    PrismaService,
    GoogleStrategy,
    {
      provide: 'GoogleStrategy',
      useFactory: (prismaService: PrismaService) => {
        const strategy = new GoogleStrategy(prismaService);
        return strategy.strategyConfig();
      },
      inject: [PrismaService],
    },
  ],
  exports: [AuthService], // <--- ВАЖНО!
})
export class AuthModule {}
