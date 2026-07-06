import { IsOptional, IsString } from 'class-validator';

export class AskDocumentQueryDto {
  @IsString()
  question!: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  documentId?: string;
}
