import { IsOptional, IsString } from 'class-validator';

export class SetCustomValueDto {
  @IsString()
  fieldId!: string;

  @IsOptional()
  @IsString()
  value?: string;
}
