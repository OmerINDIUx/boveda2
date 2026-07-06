import { IsString } from 'class-validator';

export class CreateDocumentCommentDto {
  @IsString()
  body!: string;
}
