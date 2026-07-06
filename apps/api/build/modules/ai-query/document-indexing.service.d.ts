import { Repository } from 'typeorm';
import { StorageService } from '../../storage/storage.service';
import { DocumentChunk } from '../documents/document-chunk.entity';
import { DocumentEmbedding } from '../documents/document-embedding.entity';
import { DocumentRecord } from '../documents/document.entity';
import { DocumentVersion } from '../versions/document-version.entity';
type IndexedChunk = {
    chunk: DocumentChunk;
    embedding: number[];
    score: number;
};
export declare class DocumentIndexingService {
    private readonly versions;
    private readonly chunks;
    private readonly embeddings;
    private readonly storage;
    constructor(versions: Repository<DocumentVersion>, chunks: Repository<DocumentChunk>, embeddings: Repository<DocumentEmbedding>, storage: StorageService);
    ensureVersionIndexed(document: DocumentRecord, version: DocumentVersion): Promise<void>;
    searchVisibleChunks(documentIds: string[], question: string, limit?: number): Promise<IndexedChunk[]>;
    private extractText;
    private runPython;
    private buildChunks;
    private splitLongText;
    private createEmbedding;
    private cosineSimilarity;
    private keywordBoost;
    private tokenize;
    private normalizeWhitespace;
    private estimateTokenCount;
}
export {};
