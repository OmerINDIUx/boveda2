import { IsOptional, IsString } from 'class-validator';

export class CreateCustomFieldDto {
  @IsString()
  contractType!: string;

  @IsString()
  fieldKey!: string;

  @IsString()
  fieldLabel!: string;

  @IsOptional()
  @IsString()
  fieldType?: string;

  @IsOptional()
  required?: boolean;

  @IsOptional()
  optionsJson?: Record<string, unknown>;

  @IsOptional()
  sortOrder?: number;
}
