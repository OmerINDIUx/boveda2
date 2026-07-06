import { DocumentRecord } from './document.entity';
export declare class DocumentAuditLog {
    id: string;
    documentId: string;
    document: DocumentRecord;
    actorId?: string;
    action: string;
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
}
