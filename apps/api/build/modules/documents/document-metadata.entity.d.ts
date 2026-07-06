import { DocumentRecord } from './document.entity';
export declare class DocumentMetadata {
    id: string;
    documentId: string;
    document: DocumentRecord;
    metaKey: string;
    metaValue?: string;
    valueType: 'string' | 'number' | 'date' | 'boolean' | 'json';
    createdAt: Date;
    updatedAt: Date;
}
