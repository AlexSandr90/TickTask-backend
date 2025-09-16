import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { join } from 'path';
import { existsSync, createReadStream, readdirSync } from 'fs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Achievement Images')
@Controller('achievements/static')
export class AchievementsStaticController {
  @Get(':filename')
  @ApiOperation({ summary: 'Serve achievement image files' })
  serveAchievementImage(
    @Param('filename') filename: string,
    @Res({ passthrough: true }) res: Response,
  ): StreamableFile {
    try {
      // Проверяем безопасность имени файла
      if (
        filename.includes('..') ||
        filename.includes('/') ||
        filename.includes('\\') ||
        !filename.match(/^[a-zA-Z0-9_-]+\.(png|jpg|jpeg|gif|svg)$/)
      ) {
        throw new NotFoundException('Invalid filename');
      }

      // Определяем путь к файлу
      const filePath = join(
        process.cwd(), // Используем process.cwd() вместо __dirname
        'public',
        'achievements',
        filename,
      );

      console.log('Serving achievement image:', filePath);

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

      // Устанавливаем заголовки
      res.set({
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'public, max-age=86400', // кешируем на сутки
        Expires: new Date(Date.now() + 86400000).toUTCString(),
      });

      // Создаем поток для чтения файла
      const fileStream = createReadStream(filePath);
      return new StreamableFile(fileStream);
    } catch (error) {
      console.error('Error serving achievement image:', error);
      throw new NotFoundException('Achievement image not found');
    }
  }

  // Опционально: эндпоинт для получения списка доступных изображений
  @Get()
  @ApiOperation({ summary: 'Get list of available achievement images' })
  getAvailableImages(): { images: string[] } {
    try {
      const imagesPath = join(process.cwd(), 'public', 'achievements');

      if (!existsSync(imagesPath)) {
        return { images: [] };
      }

      const files: string[] = readdirSync(imagesPath).filter((file: string) =>
        file.match(/\.(png|jpg|jpeg|gif|svg)$/i),
      );

      return { images: files };
    } catch (error) {
      console.error('Error reading achievement images directory:', error);
      return { images: [] };
    }
  }
}
