import dotenv from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configureHelmet } from './configurations/helmet.config';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleStrategy } from './modules/auth/strategy/google.strategy';
import passport from 'passport';
import cookieParser from 'cookie-parser';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://taskcraft.click',
      'https://localhost:3000',
      'http://localhost:3000',
      'http://localhost:4200',
    ],
    methods: 'GET,POST,PUT,DELETE,OPTIONS, PATCH', // Разрешаем только GET, POST, PUT, DELETE методы
    allowedHeaders: 'Content-Type, Authorization', // Разрешаем только заголовки Content-Type и Authorization
    credentials: true, // Разрешаем отправку cookies
  });
  configureHelmet(app);
  app.use(cookieParser());
  const prismaService = app.get(PrismaService);
  const port = process.env.PORT || 3000;

  const googleStrategy = new GoogleStrategy(prismaService);
  passport.use('google', googleStrategy.strategyConfig());

  const config = new DocumentBuilder()
    .setTitle('TickTask API Documentation')
    .setDescription('Documentation to API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false, // по умолчанию false — и это ок
    }),
  );

  await app.listen(port);
  console.log(`[bootstrap] server is running on a port: ${port}`);
}

bootstrap();