import { IsOptional, IsString } from 'class-validator';

export class CreateNegotiationDto {
  @IsString()
  partyName!: string;

  @IsOptional()
  @IsString()
  versionId?: string;

  @IsOptional()
  @IsString()
  proposedText?: string;

  @IsOptional()
  @IsString()
  originalText?: string;
}
