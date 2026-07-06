import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDocumentVersionDto {
  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsString()
  base64Content!: string;

  @IsString()
  revision!: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  sizeBytes?: number;
}
