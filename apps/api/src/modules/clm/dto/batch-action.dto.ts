import { ArrayNotEmpty, IsString } from 'class-validator';

export class BatchActionDto {
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids!: string[];

  @IsString()
  action!: string;

  payload?: Record<string, unknown>;
}
