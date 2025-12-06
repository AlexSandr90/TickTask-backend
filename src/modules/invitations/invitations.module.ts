import { Module } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { BoardInvitationsService } from './invitations.service';
import { JwtStrategy } from '../auth/strategy/jwt.strategy';
import { JwtAuthGuard } from '../../guards/auth.guard';
import { EmailService } from '../../email/email.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { BoardInvitationsController } from './invitations.controller';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { InvitationsRepository } from './invitations.repository';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule],
  controllers: [BoardInvitationsController],
  providers: [
    JwtAuthGuard,
    EmailService,
    BoardInvitationsService,
    InvitationsRepository,
  ],
  exports: [BoardInvitationsService],
})
export class BoardInvitationsModule {}
