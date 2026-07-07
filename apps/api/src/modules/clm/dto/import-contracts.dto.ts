import { IsOptional, IsString } from 'class-validator';

export class ImportContractsDto {
  @IsString()
  projectId!: string;

  @IsString()
  fileName!: string;

  @IsString()
  base64Content!: string;

  @IsOptional()
  @IsString()
  mimeType?: string;
}
