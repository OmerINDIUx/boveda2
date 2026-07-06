import { IsIn, IsOptional, IsString } from 'class-validator';

export class RfiListQueryDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  @IsIn(['open', 'in_progress', 'answered', 'closed', 'overdue'])
  status?: 'open' | 'in_progress' | 'answered' | 'closed' | 'overdue';

  @IsOptional()
  @IsIn(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent';

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
