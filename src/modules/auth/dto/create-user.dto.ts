import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Match } from '../../../validators/match.decorator';

export class UserDto {
  @ApiProperty({
    description: 'Email користувача',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Некоректний email' })
  @IsNotEmpty({ message: 'Email обов’язковий' })
  email: string;

  @ApiProperty({ description: "Ім'я користувача", example: 'Іван' })
  @IsString({ message: "Ім'я має бути рядком" })
  @IsNotEmpty({ message: "Ім'я обов’язкове" })
  username: string;

  @ApiProperty({
    description: 'Пароль користувача',
    example: 'VeryHardPassword123',
  })
  @IsString({ message: 'Пароль має бути рядком' })
  @MinLength(6, { message: 'Пароль має бути не менше 6 символів' })
  @IsNotEmpty({ message: 'Пароль обов’язковий' })
  password: string;

  @ApiProperty({
    description: 'Повторіть пароль',
    example: 'VeryHardPassword123',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password confirmation required' })
  @Match('password', { message: 'Passwords must match' }) // Тут применяем кастомный декоратор
  confirmPassword: string;

  @IsOptional()
  @IsBoolean({ message: 'The field must be of type Boolean' })
  isActive?: boolean; // Необязательное поле для статуса активации
}
