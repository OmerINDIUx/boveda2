import { PartialType } from '@nestjs/swagger';
import { CreateContractMilestoneDto } from './create-contract-milestone.dto';

export class UpdateContractMilestoneDto extends PartialType(CreateContractMilestoneDto) {}
