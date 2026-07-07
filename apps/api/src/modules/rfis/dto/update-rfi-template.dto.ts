import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateRfiTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  titleTemplate?: string;

  @IsOptional()
  @IsString()
  descriptionTemplate?: string;

  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  defaultPriority?: 'low' | 'normal' | 'high' | 'urgent';

  @IsOptional()
  @IsInt()
  @Min(0)
  defaultDueDays?: number;

  @IsOptional()
  autoAssignRule?: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
