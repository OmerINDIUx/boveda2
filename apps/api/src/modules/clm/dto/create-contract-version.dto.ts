import { IsOptional, IsString } from 'class-validator';

export class CreateContractVersionDto {
  @IsString()
  versionLabel!: string;

  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsString()
  base64Content!: string;

  @IsOptional()
  @IsString()
  sizeBytes?: string | number;

  @IsOptional()
  @IsString()
  changeSummary?: string;
}
