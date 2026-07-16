import { IsOptional, IsString } from 'class-validator';
export class CreateCounterpartyDto {
  @IsString() businessName!: string;
  @IsOptional() @IsString() commercialName?: string;
  @IsString() rfc!: string;
  @IsOptional() @IsString() taxAddress?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() counterpartyType?: string;
  @IsOptional() @IsString() riskLevel?: string;
  @IsOptional() @IsString() notes?: string;
}
