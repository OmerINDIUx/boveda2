import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDisciplineDto {
  @IsString()
  @MaxLength(80)
  code!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}
