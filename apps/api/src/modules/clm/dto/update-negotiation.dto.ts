import { IsOptional, IsString } from 'class-validator';

export class UpdateNegotiationDto {
  @IsOptional()
  @IsString()
  partyName?: string;

  @IsOptional()
  @IsString()
  proposedText?: string;

  @IsOptional()
  @IsString()
  originalText?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
