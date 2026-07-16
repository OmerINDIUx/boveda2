import { IsOptional, IsString } from 'class-validator';

export class SignBitacoraEntryDto {
  @IsOptional()
  @IsString()
  observaciones?: string;
}
