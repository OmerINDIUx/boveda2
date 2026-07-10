import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDocumentVersionDto {
  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsString()
  fileKey!: string;

  @IsString()
  revision!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  sizeBytes?: number;
}
