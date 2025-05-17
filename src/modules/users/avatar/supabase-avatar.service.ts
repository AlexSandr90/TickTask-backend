import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { supabase } from './supabase.client';
import { DEFAULT_AVATAR_PATH } from '../../../common/constants'; // Импортируем клиент Supabase

@Injectable()
export class SupabaseAvatarService {
  async uploadAvatar(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    const contentType = mimeType || 'image/png'; // если mimeType не указан, ставим дефолтный

    const { error } = await supabase.storage
      .from('avatars') // имя вашего бакета в Supabase
      .upload(fileName, buffer, {
        contentType: contentType, // динамическое определение contentType
        upsert: true, // позволяет перезаписывать файл, если такой уже существует
      });

    if (error) {
      throw new Error(`Ошибка загрузки аватара: ${error.message}`);
    }

    return fileName; // Возвращаем имя файла, можно вернуть URL или другое значение
  }

  async deleteAvatar(filePath: string) {
    if (filePath === DEFAULT_AVATAR_PATH) return;

    const { error } = await supabase.storage.from('avatars').remove([filePath]);

    if (error) {
      throw new InternalServerErrorException(
        `Error deleting avatar: ${error.message}`,
      );
    }
  }

  getAvatarUrl(path: string): string {
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  }

  getDefaultAvatar(): string {
    return this.getAvatarUrl(DEFAULT_AVATAR_PATH);
  }
}
