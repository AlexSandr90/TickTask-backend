// contact.module.ts
import { Module } from '@nestjs/common';
import { ContactController } from './contact.controller';
import { EmailService } from './email.service';


@Module({
  controllers: [ContactController],
  providers: [EmailService],
})
export class ContactModule {}
