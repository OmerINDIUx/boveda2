import { ArrayMaxSize, IsArray, IsOptional, IsString, Matches } from 'class-validator';

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class AskGotaQueryDto {
  @IsString()
  question!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @Matches(UUID_SHAPE, { each: true, message: 'each value in versionIds must be a valid id' })
  versionIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @Matches(UUID_SHAPE, { each: true, message: 'each value in documentIds must be a valid id' })
  documentIds?: string[];
}
