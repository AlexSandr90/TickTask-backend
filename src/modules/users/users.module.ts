import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';

import { JwtModule } from '@nestjs/jwt';
import { APP_CONFIG } from '../../configurations/app.config';
import { JwtAuthGuard } from '../../guards/auth.guard';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: APP_CONFIG.secretJWT || 'veryHardSecret',
      signOptions: { expiresIn: APP_CONFIG.expireJwt || '10d' },
    }), //
  ],
  controllers: [UsersController],
  providers: [JwtStrategy, JwtAuthGuard, UsersService],
  exports: [UsersService], //
})
export class UsersModule {}
