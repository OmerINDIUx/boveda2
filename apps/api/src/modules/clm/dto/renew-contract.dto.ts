import { IsOptional, IsString } from 'class-validator';

export class RenewContractDto {
  @IsOptional()
  @IsString()
  renewalDate?: string;

  @IsOptional()
  @IsString()
  expirationDate?: string;

  @IsOptional()
  @IsString()
  versionLabel?: string;

  @IsOptional()
  @IsString()
  changeSummary?: string;
}
