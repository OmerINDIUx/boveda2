import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { RfiAttachmentInputDto } from './create-rfi.dto';

export class CreateRfiCommentDto {
  @IsString()
  body!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RfiAttachmentInputDto)
  attachments?: RfiAttachmentInputDto[];
}
