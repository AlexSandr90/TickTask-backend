import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ContactFormDto {
  @IsNotEmpty({ message: 'Имя обязательно' })
  @MaxLength(50, { message: 'Имя слишком длинное' })
  name: string;

  @IsEmail({}, { message: 'Неверный email' })
  email: string;

  @IsNotEmpty({ message: 'Сообщение обязательно' })
  @MaxLength(1000, { message: 'Сообщение слишком длинное' })
  message: string;
}
