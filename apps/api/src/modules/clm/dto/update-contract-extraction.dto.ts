import { IsArray } from 'class-validator';
import type { ContractExtractionFact } from '../entities/contract-extraction-run.entity';

export class UpdateContractExtractionDto {
  @IsArray()
  facts!: ContractExtractionFact[];
}
