import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  workType?: string;

  @IsOptional()
  @IsString()
  currentStage?: string;

  @IsOptional()
  @IsString()
  priority?: 'baja' | 'media' | 'alta' | 'critica';

  @IsOptional()
  @IsString()
  responsibleUserId?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignedUserIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disciplineIds?: string[];
}
