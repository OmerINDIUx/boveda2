import { IsString } from 'class-validator';
export class ReviewContractRequestDto {
  @IsString() status!: 'approved' | 'rejected';
  @IsString() reviewComments!: string;
}
