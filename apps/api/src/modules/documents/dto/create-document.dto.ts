import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  projectId!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  documentNumber!: string;

  @IsString()
  folderId!: string;

  @IsOptional()
  @IsString()
  disciplineId?: string;

  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @IsOptional()
  @IsString()
  confidentialityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';

  @IsOptional()
  @IsBoolean()
  renewable?: boolean;

  @IsOptional()
  @IsString()
  renewalFrequency?: 'day' | 'week' | 'month' | 'year';

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'pending_approval' | 'in_review' | 'approved' | 'published' | 'expired';

  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsString()
  base64Content!: string;

  @IsOptional()
  @IsString()
  revision?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  sizeBytes?: number;

  @IsOptional()
  @IsArray()
  metadata?: Array<{ key: string; value: string; type?: 'string' | 'number' | 'date' | 'boolean' | 'json' }>;
}
