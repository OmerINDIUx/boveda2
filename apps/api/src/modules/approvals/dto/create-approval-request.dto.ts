import { IsOptional, IsString } from 'class-validator';

export class CreateApprovalRequestDto {
  @IsString()
  documentId!: string;

  @IsOptional()
  @IsString()
  workflowId?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
