import { IsOptional, IsString } from 'class-validator';

export class CreateContractAttachmentDto {
  @IsString()
  name!: string;

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
  notes?: string;
}
