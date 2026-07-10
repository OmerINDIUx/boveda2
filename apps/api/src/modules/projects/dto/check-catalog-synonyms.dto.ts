import { IsIn, IsString, MaxLength } from 'class-validator';
import {
  PROJECT_CATALOG_CATEGORIES,
  type ProjectCatalogCategory,
} from '../project-catalog-option.entity';

export class CheckCatalogSynonymsDto {
  @IsIn(PROJECT_CATALOG_CATEGORIES)
  category!: ProjectCatalogCategory;

  @IsString()
  @MaxLength(120)
  label!: string;
}
