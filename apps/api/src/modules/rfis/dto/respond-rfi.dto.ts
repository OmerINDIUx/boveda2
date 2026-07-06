import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RfiAttachmentInputDto } from './create-rfi.dto';

export class RespondRfiDto {
  @IsString()
  answer!: string;

  @IsOptional()
  @IsIn(['in_progress', 'answered'])
  status?: 'in_progress' | 'answered';

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RfiAttachmentInputDto)
  attachments?: RfiAttachmentInputDto[];
}
