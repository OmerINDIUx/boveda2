import { IsArray, IsString, MinLength } from 'class-validator';
import type { ContractExtractionFact } from '../entities/contract-extraction-run.entity';

export class ApproveContractExtractionDto {
  @IsString()
  @MinLength(1)
  password!: string;

  @IsArray()
  facts!: ContractExtractionFact[];
}
