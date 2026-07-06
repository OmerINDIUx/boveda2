import { IsOptional, IsString } from 'class-validator';

export class CloseContractDto {
  @IsOptional()
  @IsString()
  closeReason?: string;
}
