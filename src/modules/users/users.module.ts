import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';

import { JwtModule } from '@nestjs/jwt';
import { APP_CONFIG } from '../../configurations/app.config';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseAvatarService } from './avatar/supabase-avatar.service';

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
    }),
  ],
  controllers: [UsersController],
  providers: [JwtStrategy, JwtAuthGuard, UsersService,  SupabaseAvatarService],
  exports: [UsersService],
})
export class UsersModule {}
