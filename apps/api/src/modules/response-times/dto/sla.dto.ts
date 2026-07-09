import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateSlaDto {
  @IsString()
  projectId!: string;

  @IsString()
  name!: string;

  @IsString()
  scope!: string;

  @IsNumber()
  @Min(0)
  targetHours!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  warningHours?: number;

  @IsOptional()
  @IsString()
  escalationUserId?: string;
}

export class UpdateSlaDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetHours?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  warningHours?: number;

  @IsOptional()
  @IsString()
  escalationUserId?: string;

  @IsOptional()
  isActive?: boolean;
}

export class CreateWorkflowActionDto {
  @IsString()
  projectId!: string;

  @IsString()
  name!: string;

  @IsString()
  triggerEvent!: string;

  @IsString()
  actionType!: string;

  config!: Record<string, unknown>;
}
