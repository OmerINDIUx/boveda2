import { IsOptional, IsString } from 'class-validator';

export class DocumentListQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
