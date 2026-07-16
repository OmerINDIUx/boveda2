import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AiQueryScheduler } from './ai-query.scheduler';
import { AiQueryService } from './ai-query.service';
import { AskDocumentQueryDto } from './dto/ask-document-query.dto';
import { CreateSessionDto } from './dto/create-session.dto';
export declare class AiQueryController {
    private readonly aiQuery;
    private readonly scheduler;
    constructor(aiQuery: AiQueryService, scheduler: AiQueryScheduler);
    ask(user: RequestUser, dto: AskDocumentQueryDto): Promise<{
        id: string;
        question: string;
        answer: string;
        status: "insufficient_information" | "answered";
        scopedDocumentCount: number;
        citations: {
            chunkId: string;
            documentId: string;
            documentName: string;
            versionId?: string;
            versionLabel: string;
            pageNumber?: number;
            sectionLabel?: string;
            fragment: string;
            score: number;
        }[] | {
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
    history(user: RequestUser): Promise<import("./document-query-history.entity").DocumentQueryHistory[]>;
    listSessions(user: RequestUser): Promise<import("./conversation-session.entity").ConversationSession[]>;
    createSession(user: RequestUser, dto: CreateSessionDto): Promise<import("./conversation-session.entity").ConversationSession>;
    getSession(user: RequestUser, id: string): Promise<import("./conversation-session.entity").ConversationSession>;
    deleteSession(user: RequestUser, id: string): Promise<{
        ok: boolean;
    }>;
    sessionHistory(user: RequestUser, id: string): Promise<import("./document-query-history.entity").DocumentQueryHistory[]>;
    triggerIndexing(): Promise<{
        ok: boolean;
        skipped: boolean;
        reason: string;
        indexed?: undefined;
    } | {
        ok: boolean;
        indexed: number;
        skipped?: undefined;
        reason?: undefined;
    }>;
    indexingStatus(): Promise<{
        totalDocuments: number;
        indexedDocuments: number;
        pendingDocuments: number;
    }>;
}
