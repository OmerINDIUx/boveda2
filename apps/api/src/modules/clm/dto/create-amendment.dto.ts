import { IsOptional, IsString } from 'class-validator';

export class CreateAmendmentDto {
  @IsString()
  amendmentNumber!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  amendmentDate!: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  fileKey?: string;

  @IsOptional()
  @IsString()
  fileName?: string;
}
