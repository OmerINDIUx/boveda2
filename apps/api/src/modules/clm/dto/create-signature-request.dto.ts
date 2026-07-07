import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateSignatureRequestDto {
  @IsOptional()
  @IsString()
  versionId?: string;

  @IsArray()
  signers!: Array<{ name: string; email: string }>;

  @IsOptional()
  @IsString()
  expiresAt?: string;
}
