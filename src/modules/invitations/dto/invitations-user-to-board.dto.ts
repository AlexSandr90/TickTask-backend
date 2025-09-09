import { BoardRole } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class InviteUserToBoardDto {
  @ApiProperty({
    description: 'Email of the user to invite',
    example: 'user@example.com',
  })
  @IsString()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Role of the user in the board',
    enum: BoardRole,
    default: BoardRole.USER,
    required: false,
  })
  @IsEnum(BoardRole)
  @IsOptional()
  role: BoardRole = BoardRole.USER;
}

export class RespondToInvitationDto {
  @ApiProperty({
    description: 'Accept or reject the invitation',
    example: true,
  })
  @IsBoolean()
  accept: boolean;
}
