import { forwardRef, Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { JwtModule } from '@nestjs/jwt';
import { AUTH_CONFIG } from '../../configurations/auth.config';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseAvatarService } from './avatar/supabase-avatar.service';
import { UsersRepository } from './users.repository';
import { AuthModule } from '../auth/auth.module';
import { UserBusinessValidator } from './utils/business.validator';
import { EmailService } from '../../email/email.service';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async () => ({
        secret: AUTH_CONFIG.secretJWT,
        signOptions: { expiresIn: AUTH_CONFIG.expireJwt },
      }),
    }),
  ],
  controllers: [UsersController],
  providers: [
    JwtStrategy,
    JwtAuthGuard,
    UsersService,
    EmailService,
    UsersRepository,
    SupabaseAvatarService,
    UserBusinessValidator,
  ],
  exports: [
    UsersService,
    UsersRepository,
    SupabaseAvatarService,
    UserBusinessValidator,
  ],
})
export class UsersModule {}
