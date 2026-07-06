import { IsOptional, IsString } from 'class-validator';

export class CreateContractDto {
  @IsString()
  projectId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  responsibleArea?: string;

  @IsOptional()
  @IsString()
  contractType?: string;

  @IsOptional()
  @IsString()
  status?:
    | 'draft'
    | 'in_review'
    | 'approved'
    | 'active'
    | 'expiring_soon'
    | 'expired'
    | 'renewed'
    | 'closed';

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  renewalDate?: string;

  @IsOptional()
  @IsString()
  amount?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @IsOptional()
  @IsString()
  mainDocumentId?: string;

  @IsOptional()
  @IsString()
  renewalNoticeDays?: string | number;

  @IsOptional()
  @IsString()
  closeReason?: string;
}
