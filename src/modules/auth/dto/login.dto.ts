import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @ApiProperty({ description: "Ім'я користувача", example: 'Stepan' })
    // @ts-ignore
  username: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  @ApiProperty({ description: "Пароль користувача", example: 'veryHardPassword123' })
    // @ts-ignore
  password: string;
}