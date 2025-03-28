import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { AuthGuard } from '../../guards/auth.guard';

@Module({
  imports: [PrismaModule],
  controllers: [UsersController],
  providers: [JwtStrategy, AuthGuard, UsersService],
})
export class UsersModule {}