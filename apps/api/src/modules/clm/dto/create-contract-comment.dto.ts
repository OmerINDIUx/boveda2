import { IsString } from 'class-validator';

export class CreateContractCommentDto {
  @IsString()
  body!: string;
}
