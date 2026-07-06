import { RfiAttachmentInputDto } from './create-rfi.dto';
export declare class RespondRfiDto {
  answer: string;
  status?: 'in_progress' | 'answered';
  attachments?: RfiAttachmentInputDto[];
}
