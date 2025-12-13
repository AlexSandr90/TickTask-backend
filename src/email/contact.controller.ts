// contact.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { EmailService } from './email.service';
import { ContactFormDto } from './dto/dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async sendContactForm(@Body() body: ContactFormDto) {
    // Валидация вручную через class-validator
    const dto = plainToInstance(ContactFormDto, body);
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException(
        errors.map((e) => Object.values(e.constraints || {})).flat(),
      );
    }

    // Отправка письма
    await this.emailService.sendContactFormEmail(dto);

    return { success: true, message: 'Сообщение успешно отправлено!' };
  }
}
