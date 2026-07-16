import { IsDateString, IsIn, IsOptional, IsString } from 'class-validator';

export class BitacoraListQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsIn(['borrador', 'firmado', 'cerrado'])
  estado?: string;

  @IsOptional()
  @IsString()
  turno?: string;
}
