import { IsOptional, IsString } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  projectId!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  disciplineId?: string;
}
