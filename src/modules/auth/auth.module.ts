import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './strategy/google.strategy';
import * as passport from 'passport';
import { PrismaService } from '../../../prisma/prisma.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
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
      inject: [GoogleStrategy],
    },
  ],
})
export class AuthModule {}
