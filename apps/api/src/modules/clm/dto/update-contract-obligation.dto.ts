import { PartialType } from '@nestjs/swagger';
import { CreateContractObligationDto } from './create-contract-obligation.dto';

export class UpdateContractObligationDto extends PartialType(CreateContractObligationDto) {}
