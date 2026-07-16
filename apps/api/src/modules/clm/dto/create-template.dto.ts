import { IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  contractType?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  clauseIds?: string[];

  @IsOptional()
  @IsString()
  parentTemplateId?: string;
}
