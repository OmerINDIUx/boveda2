import { RequestUser } from '../../common/interfaces/request-user.interface';
import { AiQueryService } from './ai-query.service';
import { AskDocumentQueryDto } from './dto/ask-document-query.dto';
export declare class AiQueryController {
  private readonly aiQuery;
  constructor(aiQuery: AiQueryService);
  ask(
    user: RequestUser,
    dto: AskDocumentQueryDto
  ): Promise<{
    id: string;
    question: string;
    answer: string;
    status: 'answered' | 'insufficient_information';
    scopedDocumentCount: number;
    citations:
      | {
          chunkId: string;
          documentId: string;
          documentName: string;
          versionId?: string;
          versionLabel: string;
          pageNumber?: number;
          sectionLabel?: string;
          fragment: string;
          score: number;
        }[]
      | {
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
  history(
    user: RequestUser
  ): Promise<import('./document-query-history.entity').DocumentQueryHistory[]>;
}
