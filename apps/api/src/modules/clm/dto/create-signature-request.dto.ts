import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateSignatureRequestDto {
  @IsOptional()
  @IsString()
  versionId?: string;

  @IsArray()
  signers!: Array<{ name: string; email: string; order?: number }>;

  @IsOptional()
  @IsString()
  emailSubject?: string;

  @IsOptional()
  @IsString()
  emailBody?: string;

  @IsOptional()
  @IsBoolean()
  enableReminders?: boolean;

  @IsOptional()
  @IsNumber()
  reminderDelay?: number;

  @IsOptional()
  @IsNumber()
  reminderFrequency?: number;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
