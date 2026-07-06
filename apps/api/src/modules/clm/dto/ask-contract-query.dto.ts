import { IsString } from 'class-validator';

export class AskContractQueryDto {
  @IsString()
  question!: string;
}
