import { IsOptional, IsString } from 'class-validator';

export class CreateContractObligationDto {
  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @IsOptional()
  @IsString()
  commitmentDate?: string;

  @IsOptional()
  @IsString()
  status?: 'pending' | 'in_progress' | 'completed' | 'waived' | 'overdue';

  @IsOptional()
  @IsString()
  evidenceDocumentId?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  alertDaysBefore?: number;
}
