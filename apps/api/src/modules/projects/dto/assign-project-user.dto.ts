import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AssignProjectUserDto {
  @IsString()
  userId!: string;

  @IsString()
  role!: 'owner' | 'manager' | 'contributor' | 'viewer';

  @IsOptional()
  @IsBoolean()
  canManageDocuments?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageContracts?: boolean;
}
