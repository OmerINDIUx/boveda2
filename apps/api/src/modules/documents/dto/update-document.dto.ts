import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  folderId?: string;

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
  status?: 'draft' | 'pending_approval' | 'in_review' | 'approved' | 'published' | 'expired' | 'archived';
}
