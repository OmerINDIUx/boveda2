import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CONTRACT_RECORD_TYPES, ContractRecordType } from '../entities/contract-record.entity';

export class CreateContractRecordDto {
  @IsIn(CONTRACT_RECORD_TYPES)
  recordType!: ContractRecordType;

  @IsString()
  @MaxLength(60)
  recordNumber!: string;

  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() eventDate?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsNumberString() amount?: string;
  @IsOptional() @IsNumberString() approvedAmount?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @Type(() => Number) @IsInt() impactDays?: number;
  @IsOptional() @Type(() => Number) @IsInt() approvedImpactDays?: number;
  @IsOptional() @IsString() counterparty?: string;
  @IsOptional() @IsString() basisClause?: string;
  @IsOptional() @IsString() calculation?: string;
  @IsOptional() @IsNumberString() percentage?: string;
  @IsOptional() @IsString() issuer?: string;
  @IsOptional() @IsString() beneficiary?: string;
  @IsOptional() @IsString() validFrom?: string;
  @IsOptional() @IsString() validUntil?: string;
  @IsOptional() @IsString() responsibleUserId?: string;
  @IsOptional() @IsString() parentRecordId?: string;
  @IsOptional() @IsString() relatedAmendmentId?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class UpdateContractRecordDto {
  @IsOptional() @IsString() @MaxLength(60) recordNumber?: string;
  @IsOptional() @IsString() @MaxLength(200) title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsString() eventDate?: string;
  @IsOptional() @IsString() dueDate?: string;
  @IsOptional() @IsNumberString() amount?: string;
  @IsOptional() @IsNumberString() approvedAmount?: string;
  @IsOptional() @IsString() currency?: string;
  @IsOptional() @Type(() => Number) @IsInt() impactDays?: number;
  @IsOptional() @Type(() => Number) @IsInt() approvedImpactDays?: number;
  @IsOptional() @IsString() counterparty?: string;
  @IsOptional() @IsString() basisClause?: string;
  @IsOptional() @IsString() calculation?: string;
  @IsOptional() @IsNumberString() percentage?: string;
  @IsOptional() @IsString() issuer?: string;
  @IsOptional() @IsString() beneficiary?: string;
  @IsOptional() @IsString() validFrom?: string;
  @IsOptional() @IsString() validUntil?: string;
  @IsOptional() @IsString() responsibleUserId?: string;
  @IsOptional() @IsString() parentRecordId?: string;
  @IsOptional() @IsString() relatedAmendmentId?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}

export class ContractRecordActionDto {
  @IsOptional()
  @IsString()
  comment?: string;
}
