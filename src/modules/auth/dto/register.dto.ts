import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @ApiProperty({ description: "Ім'я користувача", example: 'Stepan' })
    // @ts-ignore
  username: string;

  @IsEmail({}, { message: 'Email must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @ApiProperty({ description: "Email користувача", example: 'usser@example.com' })
    // @ts-ignore
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  @ApiProperty({ description: "Пароль користувача", example: 'veryHardPassword123' })
  // @ts-ignore
  password: string;
}
