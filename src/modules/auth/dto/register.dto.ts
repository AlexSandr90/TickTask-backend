import { IsNotEmpty, IsString, IsEmail, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({message: 'Username is required'})
    // @ts-ignore
  username: string;

  @IsEmail({}, {message: 'Email must be a valid email address'})
  @IsNotEmpty({message: 'Email is required'})
    // @ts-ignore
  email: string;

  @IsString()
  @MinLength(6, {message: 'Password must be at least 6 characters long'})
  @IsNotEmpty({message: 'Password is required'})
    // @ts-ignore
  passwordHash: string;
}
