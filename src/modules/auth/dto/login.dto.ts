import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty({ message: 'An email address is required.' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'The password must be at least 6 characters long.' })
  @IsNotEmpty({ message: 'A password is required' })
  password: string;
}
