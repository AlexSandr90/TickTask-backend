import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { createReadStream } from 'fs';

@Controller('achievements/static')
export class AchievementsStaticController {
  @Get(':filename')
  serveAchievementImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    try {
      // Проверяем безопасность имени файла
      if (
        filename.includes('..') ||
        filename.includes('/') ||
        filename.includes('\\')
      ) {
        throw new NotFoundException('Invalid filename');
      }

      // Определяем путь к файлу
      const filePath = join(
        __dirname,
        '..',
        '..',
        '..',
        'public/achievements',
        filename,
      );
      console.log('Serving file:', filePath);
      // Проверяем существование файла
      if (!existsSync(filePath)) {
        throw new NotFoundException('Achievement image not found');
      }

      // Определяем MIME тип
      let contentType = 'image/png';
      if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (filename.endsWith('.svg')) {
        contentType = 'image/svg+xml';
      } else if (filename.endsWith('.gif')) {
        contentType = 'image/gif';
      }

      // Устанавливаем заголовки с CORS
      res.set({
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=86400',
      });

      // Отправляем файл
      const fileStream = createReadStream(filePath);
      fileStream.pipe(res);
    } catch {
      throw new NotFoundException('Achievement image not found');
    }
  }
}
