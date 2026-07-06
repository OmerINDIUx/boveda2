import { DocumentChunk } from './document-chunk.entity';
export declare class DocumentEmbedding {
    id: string;
    chunkId: string;
    chunk: DocumentChunk;
    provider: string;
    model: string;
    dimensions: number;
    embedding: number[];
    contentHash: string;
    createdAt: Date;
}
