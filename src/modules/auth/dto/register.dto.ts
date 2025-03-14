import { IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  username: string | undefined;

  @IsString()
  email: string | undefined;

  @IsString()
  passwordHash: string | undefined;
}
