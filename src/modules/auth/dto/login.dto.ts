import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'Email користувача' })
  @IsEmail({}, { message: 'Некоректний email' })
  @IsNotEmpty({ message: 'Email обов’язковий' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Пароль користувача' })
  @IsString({ message: 'Пароль має бути рядком' })
  @MinLength(6, { message: 'Пароль має бути не менше 6 символів' })
  @IsNotEmpty({ message: 'Пароль обов’язковий' })
  password: string;




}
