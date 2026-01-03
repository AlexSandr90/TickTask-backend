import { IsString, IsIn } from 'class-validator';

export class UpdateLanguageDto {
  @IsString()
  @IsIn(['en', 'ru', 'ua'])
  language: string;
}
