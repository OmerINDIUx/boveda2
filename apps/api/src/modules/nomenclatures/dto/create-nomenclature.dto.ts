import { IsArray, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NomenclatureSegment } from '@holocron/shared';

class SegmentDto implements NomenclatureSegment {
  @IsString()
  type!: 'project_code' | 'discipline' | 'sequential' | 'year' | 'month' | 'text';

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  padding?: number;
}

export class CreateNomenclatureDto {
  @IsString()
  projectId!: string;

  @IsString()
  name!: string;

  @IsString()
  pattern!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentDto)
  segments!: SegmentDto[];
}

export class UpdateNomenclatureDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SegmentDto)
  segments?: SegmentDto[];
}
