import { IsOptional, IsString } from 'class-validator';

export class CreateContractMilestoneDto {
  @IsString()
  name!: string;

  @IsString()
  milestoneDate!: string;

  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @IsOptional()
  @IsString()
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';

  @IsOptional()
  @IsString()
  evidenceDocumentId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  alertDaysBefore?: number;
}
