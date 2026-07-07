import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  documentId?: string;
}
