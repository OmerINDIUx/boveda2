import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateProjectCatalogOptionDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  value?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
