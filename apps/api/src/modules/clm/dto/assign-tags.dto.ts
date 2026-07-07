import { IsArray, IsOptional, IsString } from 'class-validator';

export class AssignTagsDto {
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tagIds?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tagNames?: string[];
}
