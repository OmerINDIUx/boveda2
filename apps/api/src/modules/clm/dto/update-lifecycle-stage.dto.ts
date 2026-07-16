import { IsOptional, IsString } from 'class-validator';
export class UpdateLifecycleStageDto {
  @IsString() stage!: string;
  @IsOptional() @IsString() comments?: string;
  @IsOptional() @IsString() decision?: string;
  @IsOptional() @IsString() relatedDocumentId?: string;
  @IsOptional() @IsString() relatedVersionId?: string;
}
