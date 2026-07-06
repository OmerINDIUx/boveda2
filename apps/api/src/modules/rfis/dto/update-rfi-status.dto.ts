import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateRfiStatusDto {
  @IsIn(['open', 'in_progress', 'answered', 'closed'])
  status!: 'open' | 'in_progress' | 'answered' | 'closed';

  @IsOptional()
  @IsString()
  note?: string;
}
