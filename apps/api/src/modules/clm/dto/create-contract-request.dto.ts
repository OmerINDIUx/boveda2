import { IsOptional, IsString } from 'class-validator';
export class CreateContractRequestDto {
  @IsString() contractType!: string;
  @IsOptional() @IsString() projectId?: string;
  @IsOptional() @IsString() counterpartyName?: string;
  @IsOptional() @IsString() counterpartyRfc?: string;
  @IsOptional() @IsString() counterpartyId?: string;
  @IsOptional() @IsString() estimatedAmount?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @IsString() startDate?: string;
  @IsOptional() @IsString() endDate?: string;
  @IsOptional() @IsString() requestingArea?: string;
  @IsOptional() @IsString() responsibleUserId?: string;
  @IsOptional() @IsString() urgencyLevel?: string;
  @IsOptional() @IsString() riskLevel?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() justification?: string;
}
