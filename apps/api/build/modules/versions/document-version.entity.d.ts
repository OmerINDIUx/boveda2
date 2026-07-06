import { DocumentRecord } from '../documents/document.entity';
import { User } from '../users/user.entity';
export declare class DocumentVersion {
    id: string;
    documentId: string;
    document: DocumentRecord;
    revision: string;
    fileKey: string;
    fileName: string;
    fileExtension?: string;
    mimeType: string;
    sizeBytes: number;
    uploadedById: string;
    uploadedBy: User;
    checksum?: string;
    notes?: string;
    contentHash?: string;
    contentExtractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
    contentExtractionError?: string;
    contentExtractedAt?: Date;
    createdAt: Date;
    deletedAt?: Date;
}
