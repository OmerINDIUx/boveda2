import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVersionDto {
  @IsString()
  documentId!: string;

  @IsString()
  revision!: string;

  @IsString()
  fileKey!: string;

  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsOptional()
  @IsNumber()
  sizeBytes!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
