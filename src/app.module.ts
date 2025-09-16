import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { join } from 'path';
import { Response, Request } from 'express';

// Создаем интерфейс для правильной типизации
interface ResponseWithReq extends Response {
  req: Request;
}

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
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      ignoreEnvFile: false,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/static',
      serveStaticOptions: {
        setHeaders: (res: ResponseWithReq) => {
          // Более безопасный CORS только для изображений
          const allowedOrigins = [
            'https://taskcraft.click',
            'https://www.taskcraft.click',
            'http://localhost:3000',
            'https://localhost:3000',
            'http://localhost:4200',
            'https://dea2442ec9a0.ngrok-free.app',
          ];

          const origin = res.req.headers.origin;
          if (origin && allowedOrigins.includes(origin)) {
            res.set('Access-Control-Allow-Origin', origin);
          }

          res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.set('Cache-Control', 'public, max-age=86400');
          res.set(
            'Content-Security-Policy',
            "default-src 'none'; img-src 'self'",
          );
        },
      },
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
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntInterceptor,
    },
  ],
})
export class AppModule {}
