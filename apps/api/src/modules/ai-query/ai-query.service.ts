import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
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

@Injectable()
export class AiQueryService {
  constructor(
    @InjectRepository(DocumentRecord) private readonly documents: Repository<DocumentRecord>,
    @InjectRepository(DocumentVersion) private readonly versions: Repository<DocumentVersion>,
    @InjectRepository(DocumentChunk) private readonly chunks: Repository<DocumentChunk>,
    @InjectRepository(DocumentPermission)
    private readonly permissions: Repository<DocumentPermission>,
    @InjectRepository(DocumentQueryHistory)
    private readonly history: Repository<DocumentQueryHistory>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(ProjectMember) private readonly members: Repository<ProjectMember>,
    @InjectRepository(ConversationSession)
    private readonly sessions: Repository<ConversationSession>,
    private readonly scope: AccessScopeService,
    private readonly indexing: DocumentIndexingService,
    private readonly ollama: OllamaChatService,
    private readonly audit: AuditService
  ) {}

  async createSession(userId: string, dto: CreateSessionDto) {
    const session = this.sessions.create({
      userId,
      name: dto.name,
      projectId: dto.projectId,
      documentId: dto.documentId,
    });
    return this.sessions.save(session);
  }

  async listSessions(userId: string) {
    return this.sessions.find({
      where: { userId, active: true },
      order: { updatedAt: 'DESC' },
      take: 50,
    });
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.sessions.findOne({ where: { id: sessionId, userId } });
    if (!session) {
      throw new NotFoundException('Sesion no encontrada');
    }
    return session;
  }

  async deleteSession(userId: string, sessionId: string) {
    const session = await this.getSession(userId, sessionId);
    session.active = false;
    await this.sessions.save(session);
    return { ok: true };
  }

  async ask(userId: string, dto: AskDocumentQueryDto) {
    const visibleDocuments = await this.getVisibleDocuments(userId, dto);
    const response = await this.buildGroundedResponse(visibleDocuments, dto.question);

    const session = dto.sessionId
      ? await this.sessions.findOne({ where: { id: dto.sessionId, userId } })
      : null;

    if (dto.sessionId && !session) {
      throw new NotFoundException('Sesion no encontrada');
    }

    const historyEntry = await this.history.save(
      this.history.create({
        userId,
        sessionId: dto.sessionId,
        projectId: dto.projectId,
        documentId: dto.documentId,
        question: dto.question,
        answer: response.answer,
        status: response.status,
        citationsJson: response.citations,
        responseJson: {
          scopedDocumentCount: visibleDocuments.length,
          insufficientInformation: response.status !== 'answered',
        },
      })
    );

    await this.audit.record({
      actorId: userId,
      action: 'ai_query.ask',
      entityType: 'document_query',
      entityId: historyEntry.id,
      metadata: {
        sessionId: dto.sessionId,
        projectId: dto.projectId,
        documentId: dto.documentId,
        question: dto.question,
        scopedDocumentCount: visibleDocuments.length,
        citationCount: response.citations.length,
        status: response.status,
      },
    });

    return {
      id: historyEntry.id,
      question: dto.question,
      answer: response.answer,
      status: response.status,
      scopedDocumentCount: visibleDocuments.length,
      citations: response.citations,
    };
  }

  async historyForUser(userId: string, sessionId?: string) {
    const where: Record<string, unknown> = { userId };
    if (sessionId) {
      where.sessionId = sessionId;
    }
    return this.history.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async indexingStatus() {
    const docsWithVersions = await this.documents.find({
      where: { currentVersionId: Not(IsNull()) },
      select: { id: true, currentVersionId: true },
    });

    let indexedCount = 0;
    for (const doc of docsWithVersions) {
      if (!doc.currentVersionId) continue;
      const count = await this.chunks.count({
        where: { documentId: doc.id, versionId: doc.currentVersionId },
      });
      if (count > 0) indexedCount++;
    }

    return {
      totalDocuments: docsWithVersions.length,
      indexedDocuments: indexedCount,
      pendingDocuments: docsWithVersions.length - indexedCount,
    };
  }

  private async getVisibleDocuments(userId: string, dto: AskDocumentQueryDto) {
    if (dto.projectId && !(await this.scope.canAccessProject(userId, dto.projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }

    const user = await this.users.findOne({ where: { id: userId }, relations: ['roles'] });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const visibleProjectIds = dto.projectId
      ? [dto.projectId]
      : await this.scope.visibleProjectIdsForUser(userId);
    if (!visibleProjectIds.length) {
      return [];
    }

    const memberships = await this.members.find({
      where: { userId, projectId: In(visibleProjectIds) },
    });

    const roleIds = user.roles?.map((role) => role.id) ?? [];
    const projectUserIds = memberships.map((membership) => membership.id);
    const rawDocuments = await this.documents.find({
      where: {
        projectId: In(visibleProjectIds),
        ...(dto.documentId ? { id: dto.documentId } : {}),
      },
      order: { updatedAt: 'DESC' },
    });

    if (dto.documentId && !rawDocuments.length) {
      throw new NotFoundException('Documento no encontrado dentro del alcance del usuario');
    }

    const permissionRows = rawDocuments.length
      ? await this.permissions.find({
          where: {
            documentId: In(rawDocuments.map((document) => document.id)),
            deletedAt: IsNull(),
          },
        })
      : [];

    return rawDocuments.filter((document) => {
      const rows = permissionRows.filter((row) => row.documentId === document.id);
      if (!rows.length) {
        return true;
      }

      return rows.some((row) => {
        if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
          return false;
        }

        return (
          row.userId === userId ||
          (row.roleId ? roleIds.includes(row.roleId) : false) ||
          (row.projectUserId ? projectUserIds.includes(row.projectUserId) : false)
        );
      });
    });
  }

  private async buildGroundedResponse(visibleDocuments: DocumentRecord[], question: string) {
    if (!visibleDocuments.length) {
      return {
        status: 'insufficient_information' as const,
        answer:
          'No hay documentos autorizados dentro del alcance actual para responder esta consulta.',
        citations: [] as CitationPayload[],
      };
    }

    const currentVersionIds = visibleDocuments
      .map((document) => document.currentVersionId)
      .filter((value): value is string => Boolean(value));
    if (!currentVersionIds.length) {
      return {
        status: 'insufficient_information' as const,
        answer:
          'Los documentos autorizados aun no tienen una version indexable para responder esta consulta.',
        citations: [] as CitationPayload[],
      };
    }

    const currentVersions = await this.versions.find({
      where: { id: In(currentVersionIds) },
    });

    const versionsById = new Map(currentVersions.map((version) => [version.id, version]));
    const indexedDocuments: DocumentRecord[] = [];
    const skippedDocuments: Array<{ name: string; reason: string }> = [];

    for (const document of visibleDocuments) {
      if (!document.currentVersionId) continue;
      const version = versionsById.get(document.currentVersionId);
      if (!version) continue;

      if (version.contentExtractionStatus !== 'completed') {
        skippedDocuments.push({
          name: document.name,
          reason: 'En proceso de indexacion. Intenta de nuevo en unos minutos.',
        });
        continue;
      }

      const chunkCount = await this.chunks.count({
        where: { documentId: document.id, versionId: document.currentVersionId },
      });
      if (chunkCount === 0) {
        skippedDocuments.push({
          name: document.name,
          reason: 'El contenido del documento esta siendo procesado.',
        });
        continue;
      }

      indexedDocuments.push(document);
    }

    if (!indexedDocuments.length) {
      return {
        status: 'insufficient_information' as const,
        answer: this.composeSkippedDocumentsMessage(
          skippedDocuments,
          'Los documentos autorizados aun no estan disponibles para consulta. El proceso de indexacion puede tardar unos minutos.'
        ),
        citations: [] as CitationPayload[],
      };
    }

    const searchResults = await this.indexing.searchVisibleChunks(
      indexedDocuments.map((document) => document.id),
      question
    );

    if (!searchResults.length) {
      return {
        status: 'insufficient_information' as const,
        answer: this.composeSkippedDocumentsMessage(
          skippedDocuments,
          'No encontre informacion suficiente en los documentos autorizados para responder con seguridad. Intenta reformular la pregunta o acotarla a un documento especifico.'
        ),
        citations: [] as CitationPayload[],
      };
    }

    const citedChunks = await this.toCitations(searchResults, indexedDocuments, versionsById);

    const llmAnswer = await this.ollama.answer(question, citedChunks);
    if (!llmAnswer.answer) {
      return {
        status: 'insufficient_information' as const,
        answer: this.composeSkippedDocumentsMessage(
          skippedDocuments,
          llmAnswer.error ?? 'No pude generar una respuesta con el modelo local.'
        ),
        citations: citedChunks,
      };
    }

    return {
      status: 'answered' as const,
      answer: this.composeSkippedDocumentsMessage(skippedDocuments, llmAnswer.answer),
      citations: citedChunks,
    };
  }

  private async toCitations(
    searchResults: Array<{ chunk: DocumentChunk; score: number }>,
    documents: DocumentRecord[],
    versionsById: Map<string, DocumentVersion>
  ) {
    if (!searchResults.length) {
      return [];
    }

    const documentsById = new Map(documents.map((document) => [document.id, document]));
    const chunksWithVersions = await this.chunks.find({
      where: { id: In(searchResults.map((result) => result.chunk.id)) },
    });
    const chunkMap = new Map(chunksWithVersions.map((chunk) => [chunk.id, chunk]));

    return searchResults.map((result) => {
      const chunk = chunkMap.get(result.chunk.id) ?? result.chunk;
      const document = documentsById.get(chunk.documentId);
      const version = chunk.versionId ? versionsById.get(chunk.versionId) : undefined;

      return {
        chunkId: chunk.id,
        documentId: chunk.documentId,
        documentName: document?.name ?? 'Documento',
        versionId: version?.id,
        versionLabel: version?.revision ?? 'N/D',
        pageNumber: chunk.pageNumber,
        sectionLabel: chunk.sectionLabel,
        fragment: this.trimFragment(chunk.content),
        score: Number(result.score.toFixed(4)),
      };
    });
  }

  private trimFragment(content: string) {
    const compact = content.replace(/\s+/g, ' ').trim();
    return compact.length > 320 ? `${compact.slice(0, 317)}...` : compact;
  }

  private composeSkippedDocumentsMessage(
    skippedDocuments: Array<{ name: string; reason: string }>,
    baseMessage: string
  ) {
    if (!skippedDocuments.length) {
      return baseMessage;
    }

    const names = skippedDocuments.map((item) => item.name).join(', ');
    return `${baseMessage}\n\nSe omitieron temporalmente estos documentos por un problema de extraccion o indexacion: ${names}.`;
  }
}
