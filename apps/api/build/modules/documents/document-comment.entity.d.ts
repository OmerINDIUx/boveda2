import { User } from '../users/user.entity';
import { DocumentRecord } from './document.entity';
export declare class DocumentComment {
    id: string;
    documentId: string;
    document: DocumentRecord;
    authorId: string;
    author: User;
    body: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
