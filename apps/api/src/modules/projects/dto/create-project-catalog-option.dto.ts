import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import {
  PROJECT_CATALOG_CATEGORIES,
  type ProjectCatalogCategory,
} from '../project-catalog-option.entity';

export class CreateProjectCatalogOptionDto {
  @IsIn(PROJECT_CATALOG_CATEGORIES)
  category!: ProjectCatalogCategory;

  @IsString()
  @MaxLength(80)
  value!: string;

  @IsString()
  @MaxLength(120)
  label!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
