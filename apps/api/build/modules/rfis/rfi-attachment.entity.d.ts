import { User } from '../users/user.entity';
import { RfiComment } from './rfi-comment.entity';
import { Rfi } from './rfi.entity';
export declare class RfiAttachment {
  id: string;
  rfiId: string;
  rfi: Rfi;
  commentId?: string;
  comment?: RfiComment;
  fileKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  uploadedBy: User;
  createdAt: Date;
  deletedAt?: Date;
}
