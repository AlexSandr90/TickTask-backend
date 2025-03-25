import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { configureCors } from './configurations/cors.config';
import { configureHelmet } from './configurations/helmet.config';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  const port = process.env.PORT || 3000;

  configureCors(app);
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
