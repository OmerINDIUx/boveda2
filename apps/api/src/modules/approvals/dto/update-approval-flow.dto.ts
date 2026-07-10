import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateApprovalFlowDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  entityType?: 'document' | 'contract' | 'rfi';

  @IsOptional()
  @IsString()
  scopeType?: 'global' | 'document_specific';

  @IsOptional()
  @IsString()
  targetDocumentId?: string;

  @IsOptional()
  @IsBoolean()
  requireForPublication?: boolean;

  @IsOptional()
  @IsArray()
  steps?: Array<{
    id?: string;
    stepOrder: number;
    name: string;
    approverUserIds?: string[];
    approverRoleId?: string;
    required?: boolean;
    dueDays?: number;
  }>;
}
