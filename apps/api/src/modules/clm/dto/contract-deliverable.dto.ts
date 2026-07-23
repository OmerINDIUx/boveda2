import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { PartialType } from '@nestjs/swagger';

const DELIVERABLE_STATUSES = [
  'pending',
  'in_progress',
  'delivered',
  'accepted',
  'rejected',
  'overdue',
] as const;

export class CreateContractDeliverableDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsString() acceptanceCriteria?: string;
  @IsOptional() @IsString() responsibleUserId?: string;
  @IsOptional() @IsIn(DELIVERABLE_STATUSES) status?: (typeof DELIVERABLE_STATUSES)[number];
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class UpdateContractDeliverableDto extends PartialType(CreateContractDeliverableDto) {}
