import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { AuditService } from '../audit/audit.service';
import { DocumentChunk } from '../documents/document-chunk.entity';
import { DocumentPermission } from '../documents/document-permission.entity';
import { DocumentRecord } from '../documents/document.entity';
import { ProjectMember } from '../projects/project-member.entity';
import { User } from '../users/user.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { AskDocumentQueryDto } from './dto/ask-document-query.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { DocumentIndexingService } from './document-indexing.service';
import { DocumentQueryHistory } from './document-query-history.entity';
import { OllamaChatService } from './ollama-chat.service';
import { ConversationSession } from './conversation-session.entity';
type CitationPayload = {
    chunkId: string;
    documentId: string;
    documentName: string;
    versionId?: string;
    versionLabel: string;
    pageNumber?: number;
    sectionLabel?: string;
    fragment: string;
    score: number;
};
export declare class AiQueryService {
    private readonly documents;
    private readonly versions;
    private readonly chunks;
    private readonly permissions;
    private readonly history;
    private readonly users;
    private readonly members;
    private readonly sessions;
    private readonly scope;
    private readonly indexing;
    private readonly ollama;
    private readonly audit;
    constructor(documents: Repository<DocumentRecord>, versions: Repository<DocumentVersion>, chunks: Repository<DocumentChunk>, permissions: Repository<DocumentPermission>, history: Repository<DocumentQueryHistory>, users: Repository<User>, members: Repository<ProjectMember>, sessions: Repository<ConversationSession>, scope: AccessScopeService, indexing: DocumentIndexingService, ollama: OllamaChatService, audit: AuditService);
    createSession(userId: string, dto: CreateSessionDto): Promise<ConversationSession>;
    listSessions(userId: string): Promise<ConversationSession[]>;
    getSession(userId: string, sessionId: string): Promise<ConversationSession>;
    deleteSession(userId: string, sessionId: string): Promise<{
        ok: boolean;
    }>;
    ask(userId: string, dto: AskDocumentQueryDto): Promise<{
        id: string;
        question: string;
        answer: string;
        status: "insufficient_information" | "answered";
        scopedDocumentCount: number;
        citations: CitationPayload[] | {
            chunkId: string;
            documentId: string;
            documentName: string;
            versionId: string | undefined;
            versionLabel: string;
            pageNumber: number | undefined;
            sectionLabel: string | undefined;
            fragment: string;
            score: number;
        }[];
    }>;
    historyForUser(userId: string, sessionId?: string): Promise<DocumentQueryHistory[]>;
    indexingStatus(): Promise<{
        totalDocuments: number;
        indexedDocuments: number;
        pendingDocuments: number;
    }>;
    private getVisibleDocuments;
    private buildGroundedResponse;
    private toCitations;
    private trimFragment;
    private composeSkippedDocumentsMessage;
}
export {};
