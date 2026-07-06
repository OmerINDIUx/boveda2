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
    stepOrder: number;
    name: string;
    approverUserId?: string;
    approverRoleId?: string;
    required?: boolean;
  }>;
}
