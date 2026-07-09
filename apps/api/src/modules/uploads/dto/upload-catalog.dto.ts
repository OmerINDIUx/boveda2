import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateUploadCatalogDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  category!: string;

  @IsString()
  catalogKey!: string;

  @IsString()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateUploadCatalogDto {
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  isActive?: boolean;
}

export class BulkUploadFileDto {
  @IsString()
  fileKey!: string;

  @IsString()
  originalName!: string;

  @IsString()
  mimeType!: string;

  @IsNumber()
  sizeBytes!: number;

  @IsOptional()
  metadata?: Record<string, unknown>;
}

export class BulkUploadStartDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
