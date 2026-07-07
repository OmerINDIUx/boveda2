import { IsOptional, IsString } from 'class-validator';

export class UpdateAmendmentDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  amendmentDate?: string;

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
