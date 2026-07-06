import { Rfi } from './rfi.entity';
import { User } from '../users/user.entity';
import { RfiAttachment } from './rfi-attachment.entity';
export declare class RfiComment {
    id: string;
    rfiId: string;
    rfi: Rfi;
    userId: string;
    author: User;
    body: string;
    type: 'comment' | 'response' | 'system';
    attachments: RfiAttachment[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
