import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import {
  PROJECT_CATALOG_CATEGORIES,
  type ProjectCatalogCategory,
} from '../project-catalog-option.entity';

export class SearchCatalogSynonymsDto {
  @IsIn(PROJECT_CATALOG_CATEGORIES)
  category!: ProjectCatalogCategory;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  query!: string;
}
