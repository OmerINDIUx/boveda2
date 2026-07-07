import { IsOptional, IsString } from 'class-validator';

export class CreateClauseDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  category?: string;
}
