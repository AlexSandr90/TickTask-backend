import { IsString, MinLength } from 'class-validator';

export class SetGooglePasswordDto {
  @IsString()
  @MinLength(6)
  newPassword: string;
}
