import {
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PhotoInputDto {
  @IsString()
  fileName!: string;

  @IsString()
  mimeType!: string;

  @IsString()
  base64Content!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  tipo?: string;
}

export class CreateBitacoraEntryDto {
  @IsString()
  projectId!: string;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsString()
  turno?: string;

  @IsOptional()
  clima?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  descripcionGeneral?: string;

  @IsOptional()
  actividades?: Record<string, unknown>;

  @IsOptional()
  personal?: Record<string, unknown>;

  @IsOptional()
  equipos?: Record<string, unknown>;

  @IsOptional()
  materialesRecibidos?: Record<string, unknown>;

  @IsOptional()
  incidentes?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  seguridad?: string;

  @IsOptional()
  @IsString()
  calidad?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsNumber()
  avanceEstimado?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoInputDto)
  fotos?: PhotoInputDto[];
}

export { PhotoInputDto };
