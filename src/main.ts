import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { configureCors } from './configurations/cors.config';
import { configureHelmet } from './configurations/helmet.config';
import { PrismaService } from '../prisma/prisma.service';
import { GoogleStrategy } from './modules/auth/strategy/google.strategy';
import * as passport from 'passport';
import * as cookieParser from 'cookie-parser';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureCors(app);
  app.use(cookieParser());
  const prismaService = app.get(PrismaService);
  const port = process.env.PORT || 3000;

  const googleStrategy = new GoogleStrategy(prismaService);
  passport.use('google', googleStrategy.strategyConfig());


  configureHelmet(app);
  const config = new DocumentBuilder()
    .setTitle('TickTask API Documentation')
    .setDescription('Документація до API')
    .setVersion('1.0')
    .addTag('auth')
    .addTag('users')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(port);
  console.log(`[bootstrap] server is running on a port: ${port}`);
}

bootstrap();
