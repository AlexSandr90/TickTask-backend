import { Injectable } from '@nestjs/common';
import { supabase } from './supabase.client'; // Импортируем клиент Supabase

@Injectable()
export class SupabaseAvatarService {
  async uploadAvatar(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    const contentType = mimeType || 'image/png'; // если mimeType не указан, ставим дефолтный

    const { error } = await supabase.storage
      .from('avatars')  // имя вашего бакета в Supabase
      .upload(fileName, buffer, {
        contentType: contentType,  // динамическое определение contentType
        upsert: true,  // позволяет перезаписывать файл, если такой уже существует
      });

    if (error) {
      throw new Error(`Ошибка загрузки аватара: ${error.message}`);
    }

    return fileName;  // Возвращаем имя файла, можно вернуть URL или другое значение
  }

  getAvatarUrl(path: string): string {
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    return data.publicUrl;
  }
}
