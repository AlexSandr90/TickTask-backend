import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BoardsModule } from './modules/boards/boards.module';
import { ColumnsModule } from './modules/columns/columns.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SearchModule } from './modules/search/search.module';
import { UserActivityModule } from './modules/user-activity/user-activity.module';
import { BoardInvitationsModule } from './modules/invitations/invitations.module';
import { AchievementModule } from './modules/achievement/achievement.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: false,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BoardsModule,
    ColumnsModule,
    TasksModule,
    SearchModule,
    UserActivityModule,
    BoardInvitationsModule,
    AchievementModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
