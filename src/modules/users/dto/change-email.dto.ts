import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({
    example: 'new-email@email.email',
    description: 'User email',
  })
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;
}
