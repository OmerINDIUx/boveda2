import { IsOptional, IsString } from 'class-validator';
export class UpdateCounterpartyDto {
  @IsOptional() @IsString() businessName?: string;
  @IsOptional() @IsString() commercialName?: string;
  @IsOptional() @IsString() rfc?: string;
  @IsOptional() @IsString() taxAddress?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() counterpartyType?: string;
  @IsOptional() @IsString() riskLevel?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() isValidated?: boolean;
}
