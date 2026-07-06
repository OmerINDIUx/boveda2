import { DocumentEmbedding } from './document-embedding.entity';
export declare class DocumentChunk {
    id: string;
    documentId: string;
    versionId?: string;
    chunkIndex: number;
    content: string;
    tokenCount?: number;
    pageNumber?: number;
    sectionLabel?: string;
    embeddings: DocumentEmbedding[];
    createdAt: Date;
}
