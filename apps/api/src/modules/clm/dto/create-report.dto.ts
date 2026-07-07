import { IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @IsString()
  type!: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string;

  @IsOptional()
  @IsString()
  dateTo?: string;
}
