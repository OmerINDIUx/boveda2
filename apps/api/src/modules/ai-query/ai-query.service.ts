import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { AuditService } from '../audit/audit.service';
import { DocumentChunk } from '../documents/document-chunk.entity';
import { DocumentPermission } from '../documents/document-permission.entity';
import { DocumentRecord } from '../documents/document.entity';
import { ProjectMember } from '../projects/project-member.entity';
import { User } from '../users/user.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { AskDocumentQueryDto } from './dto/ask-document-query.dto';
import { DocumentIndexingService } from './document-indexing.service';
import { DocumentQueryHistory } from './document-query-history.entity';
import { OllamaChatService } from './ollama-chat.service';

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
    @InjectRepository(DocumentPermission) private readonly permissions: Repository<DocumentPermission>,
    @InjectRepository(DocumentQueryHistory) private readonly history: Repository<DocumentQueryHistory>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(ProjectMember) private readonly members: Repository<ProjectMember>,
    private readonly scope: AccessScopeService,
    private readonly indexing: DocumentIndexingService,
    private readonly ollama: OllamaChatService,
    private readonly audit: AuditService
  ) {}

  async ask(userId: string, dto: AskDocumentQueryDto) {
    const visibleDocuments = await this.getVisibleDocuments(userId, dto);
    const response = await this.buildGroundedResponse(visibleDocuments, dto.question);

    const historyEntry = await this.history.save(
      this.history.create({
        userId,
        projectId: dto.projectId,
        documentId: dto.documentId,
        question: dto.question,
        answer: response.answer,
        status: response.status,
        citationsJson: response.citations,
        responseJson: {
          scopedDocumentCount: visibleDocuments.length,
          insufficientInformation: response.status !== 'answered'
        }
      })
    );

    await this.audit.record({
      actorId: userId,
      action: 'ai_query.ask',
      entityType: 'document_query',
      entityId: historyEntry.id,
      metadata: {
        projectId: dto.projectId,
        documentId: dto.documentId,
        question: dto.question,
        scopedDocumentCount: visibleDocuments.length,
        citationCount: response.citations.length,
        status: response.status
      }
    });

    return {
      id: historyEntry.id,
      question: dto.question,
      answer: response.answer,
      status: response.status,
      scopedDocumentCount: visibleDocuments.length,
      citations: response.citations
    };
  }

  async historyForUser(userId: string) {
    return this.history.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 30
    });
  }

  private async getVisibleDocuments(userId: string, dto: AskDocumentQueryDto) {
    if (dto.projectId && !(await this.scope.canAccessProject(userId, dto.projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }

    const user = await this.users.findOne({ where: { id: userId }, relations: ['roles'] });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const visibleProjectIds = dto.projectId ? [dto.projectId] : await this.scope.visibleProjectIdsForUser(userId);
    if (!visibleProjectIds.length) {
      return [];
    }

    const memberships = await this.members.find({
      where: { userId, projectId: In(visibleProjectIds) }
    });

    const roleIds = user.roles?.map((role) => role.id) ?? [];
    const projectUserIds = memberships.map((membership) => membership.id);
    const rawDocuments = await this.documents.find({
      where: {
        projectId: In(visibleProjectIds),
        ...(dto.documentId ? { id: dto.documentId } : {})
      },
      order: { updatedAt: 'DESC' }
    });

    if (dto.documentId && !rawDocuments.length) {
      throw new NotFoundException('Documento no encontrado dentro del alcance del usuario');
    }

    const permissionRows = rawDocuments.length
      ? await this.permissions.find({
          where: { documentId: In(rawDocuments.map((document) => document.id)), deletedAt: IsNull() }
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
        answer: 'No hay documentos autorizados dentro del alcance actual para responder esta consulta.',
        citations: [] as CitationPayload[]
      };
    }

    const currentVersionIds = visibleDocuments
      .map((document) => document.currentVersionId)
      .filter((value): value is string => Boolean(value));
    if (!currentVersionIds.length) {
      return {
        status: 'insufficient_information' as const,
        answer: 'Los documentos autorizados aun no tienen una version indexable para responder esta consulta.',
        citations: [] as CitationPayload[]
      };
    }

    const currentVersions = await this.versions.find({
      where: { id: In(currentVersionIds) }
    });

    const versionsById = new Map(currentVersions.map((version) => [version.id, version]));
    const visibleDocumentsWithVersion = visibleDocuments.filter((document) => document.currentVersionId && versionsById.has(document.currentVersionId));
    const indexedDocuments: DocumentRecord[] = [];
    const skippedDocuments: Array<{ name: string; reason: string }> = [];

    for (const document of visibleDocumentsWithVersion) {
      try {
        await this.indexing.ensureVersionIndexed(document, versionsById.get(document.currentVersionId!)!);
        indexedDocuments.push(document);
      } catch (error) {
        skippedDocuments.push({
          name: document.name,
          reason: error instanceof Error ? error.message : 'No fue posible indexar el documento'
        });
      }
    }

    if (!indexedDocuments.length) {
      return {
        status: 'insufficient_information' as const,
        answer: this.composeSkippedDocumentsMessage(
          skippedDocuments,
          'No fue posible indexar los documentos autorizados disponibles para responder esta consulta.'
        ),
        citations: [] as CitationPayload[]
      };
    }

    const searchResults = await this.indexing.searchVisibleChunks(
      indexedDocuments.map((document) => document.id),
      question
    );

    const citedChunks = this.prioritizeCitationsForQuestion(
      question,
      await this.toCitations(searchResults, indexedDocuments, versionsById)
    );
    if (!citedChunks.length) {
      return {
        status: 'insufficient_information' as const,
        answer: this.composeSkippedDocumentsMessage(
          skippedDocuments,
          'No encontre informacion suficiente en los documentos autorizados para responder con seguridad. Intenta reformular la pregunta o acotarla a un documento especifico.'
        ),
        citations: [] as CitationPayload[]
      };
    }

    const llmAnswer = await this.ollama.answer(question, citedChunks);
    if (!llmAnswer.answer) {
      return {
        status: 'insufficient_information' as const,
        answer: this.composeSkippedDocumentsMessage(
          skippedDocuments,
          llmAnswer.error ?? 'No pude generar una respuesta con el modelo local.'
        ),
        citations: citedChunks
      };
    }

    return {
      status: 'answered' as const,
      answer: this.composeSkippedDocumentsMessage(skippedDocuments, llmAnswer.answer),
      citations: citedChunks
    };
  }

  private async toCitations(searchResults: Array<{ chunk: DocumentChunk; score: number }>, documents: DocumentRecord[], versionsById: Map<string, DocumentVersion>) {
    if (!searchResults.length) {
      return [];
    }

    const documentsById = new Map(documents.map((document) => [document.id, document]));
    const chunksWithVersions = await this.chunks.find({
      where: { id: In(searchResults.map((result) => result.chunk.id)) }
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
        score: Number(result.score.toFixed(4))
      };
    });
  }

  private prioritizeCitationsForQuestion(question: string, citations: CitationPayload[]) {
    if (!citations.length) {
      return [];
    }

    const normalizedQuestion = question.toLowerCase();
    const scored = citations
      .map((citation) => ({
        citation,
        relevance: this.scoreCitationForQuestion(normalizedQuestion, citation)
      }))
      .sort((left, right) => {
        if (right.relevance !== left.relevance) {
          return right.relevance - left.relevance;
        }
        return right.citation.score - left.citation.score;
      });

    if (this.isInvoiceVendorQuestion(normalizedQuestion, 'envato')) {
      const envatoCitations = scored.filter((item) => item.relevance >= 6).map((item) => item.citation);
      return envatoCitations.length ? envatoCitations : scored.map((item) => item.citation);
    }

    if (this.isInvoiceQuestion(normalizedQuestion)) {
      const invoiceCitations = scored.filter((item) => item.relevance >= 3).map((item) => item.citation);
      return invoiceCitations.length ? invoiceCitations : scored.map((item) => item.citation);
    }

    return scored.map((item) => item.citation);
  }

  private scoreCitationForQuestion(question: string, citation: CitationPayload) {
    const haystack = `${citation.documentName} ${citation.fragment}`.toLowerCase();
    let score = 0;

    if (this.isInvoiceVendorQuestion(question, 'envato')) {
      if (/envato|elements\.envato\.com/.test(haystack)) {
        score += 6;
      }
      if (/invoice|bill to|billed on|due on|vat|total/.test(haystack)) {
        score += 3;
      }
    } else if (this.isInvoiceQuestion(question)) {
      if (/invoice|bill to|billed on|due on|vat|total/.test(haystack)) {
        score += 4;
      }
    }

    const questionTerms = question
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .split(/[^a-z0-9]+/i)
      .filter((term) => term.length > 3);

    for (const term of questionTerms) {
      if (haystack.includes(term)) {
        score += 1;
      }
    }

    return score;
  }

  private composeAnswer(question: string, citations: CitationPayload[]) {
    const normalizedQuestion = question.toLowerCase();
    const grouped = new Map<string, CitationPayload[]>();
    for (const citation of citations) {
      const key = `${citation.documentId}:${citation.versionLabel}`;
      grouped.set(key, [...(grouped.get(key) ?? []), citation]);
    }

    const leadCitation = citations[0];
    const combinedEvidence = citations
      .slice(0, 3)
      .map((citation) => citation.fragment)
      .join(' ');

    if (this.isInvoiceVendorQuestion(normalizedQuestion, 'envato')) {
      return this.composeVendorInvoiceAnswer('Envato', leadCitation, combinedEvidence);
    }

    if (this.isInvoiceAmountQuestion(normalizedQuestion)) {
      return this.composeInvoiceAmountAnswer(leadCitation, combinedEvidence);
    }

    if (this.isInvoiceQuestion(normalizedQuestion)) {
      return this.composeInvoiceAnswer(leadCitation, combinedEvidence);
    }

    if (this.isBroadDocumentQuestion(normalizedQuestion)) {
      return this.composeBroadDocumentAnswer(citations);
    }

    if (/(resume|resumen|sintetiza)/i.test(normalizedQuestion)) {
      return Array.from(grouped.values())
        .slice(0, 3)
        .map((items) => {
          const lead = items[0];
          const details = items
            .slice(0, 2)
            .map((item) => item.fragment)
            .join(' ');
          return `${lead.documentName} (version ${lead.versionLabel}): ${details}`;
        })
        .join('\n\n');
    }

    if (/(que documentos|cuales documentos|mencionan)/i.test(normalizedQuestion)) {
      return Array.from(grouped.values())
        .map((items) => {
          const lead = items[0];
          return `${lead.documentName} (version ${lead.versionLabel}) menciona el tema en: ${lead.fragment}`;
        })
        .join('\n');
    }

    if (/(ultima version aprobada|version aprobada|ultima version)/i.test(normalizedQuestion)) {
      return Array.from(grouped.values())
        .slice(0, 5)
        .map((items) => {
          const lead = items[0];
          return `${lead.documentName}: ${lead.fragment}`;
        })
        .join('\n');
    }

    return citations
      .slice(0, 3)
      .map((citation) => {
        const location = citation.pageNumber ? `pagina ${citation.pageNumber}` : 'sin pagina identificada';
        return `${citation.documentName} (version ${citation.versionLabel}, ${location}) aporta esta evidencia: ${citation.fragment}`;
      })
      .join('\n\n');
  }

  private isInvoiceQuestion(question: string) {
    return /(es una factura|es factura|esta factura|invoice|factura|comprobante|recibo)/i.test(question);
  }

  private isAmountQuestion(question: string) {
    return /(monto|montos|importe|total|cuanto|cuesta|costo|precio|valor|pagar|pago)/i.test(question);
  }

  private isInvoiceAmountQuestion(question: string) {
    return this.isInvoiceQuestion(question) && this.isAmountQuestion(question);
  }

  private isBroadDocumentQuestion(question: string) {
    return /(resume|resumen|sintetiza|de que trata|que contiene|que hay dentro|que informacion tiene|que es este documento|que muestra|muestra este pdf|informacion general|descripcion general)/i.test(question);
  }

  private isInvoiceVendorQuestion(question: string, vendor: string) {
    return this.isInvoiceQuestion(question) && question.includes(vendor.toLowerCase());
  }

  private composeVendorInvoiceAnswer(vendor: string, leadCitation: CitationPayload | undefined, evidence: string) {
    const hasVendor = new RegExp(vendor, 'i').test(evidence) || /elements\.envato\.com/i.test(evidence);
    const hasInvoiceSignals = this.hasInvoiceSignals(evidence);

    if (hasVendor && hasInvoiceSignals) {
      return this.composeAnswerWithEvidence(
        `Si, el documento parece ser una factura de ${vendor}.`,
        leadCitation,
        this.extractRelevantEvidence(evidence, [/elements\.envato\.com/i, /Invoice\s*#?\s*\d+/i, /Bill To/i, /Total/i])
      );
    }

    if (hasVendor) {
      return this.composeAnswerWithEvidence(
        `Hay evidencia de ${vendor} en el documento, pero no toda la estructura de factura se ve con claridad en el texto extraido.`,
        leadCitation,
        this.extractRelevantEvidence(evidence, [/elements\.envato\.com/i, /Envato/i])
      );
    }

    return this.composeAnswerWithEvidence(
      `No encontre evidencia suficiente para afirmar que sea una factura de ${vendor}.`,
      leadCitation,
      this.extractRelevantEvidence(evidence, [/Invoice/i, /Bill To/i, /Total/i])
    );
  }

  private composeInvoiceAnswer(leadCitation: CitationPayload | undefined, evidence: string) {
    if (this.hasInvoiceSignals(evidence)) {
      return this.composeAnswerWithEvidence(
        'Si, el documento parece corresponder a una factura.',
        leadCitation,
        this.extractRelevantEvidence(evidence, [/Invoice\s*#?\s*\d+/i, /Bill To/i, /Total/i, /VAT/i])
      );
    }

    return this.composeAnswerWithEvidence(
      'No encontre evidencia suficiente para confirmarlo como factura con el texto disponible.',
      leadCitation,
      this.extractRelevantEvidence(evidence, [/Invoice/i, /Bill To/i, /Total/i])
    );
  }

  private composeInvoiceAmountAnswer(leadCitation: CitationPayload | undefined, evidence: string) {
    const amounts = this.extractMoneyAmounts(evidence);
    if (amounts.length) {
      return this.composeAnswerWithEvidence(
        `El documento muestra estos importes detectados: ${amounts.join(', ')}.`,
        leadCitation,
        this.extractRelevantEvidence(evidence, [/Total/i, /Amount/i, /Due/i, /\$\s?\d[\d,.]*/i, /\b\d[\d,.]*\s?(USD|MXN|AUD|EUR)\b/i])
      );
    }

    return this.composeAnswerWithEvidence(
      'En el texto extraido no aparece un importe o total claro para la factura.',
      leadCitation,
      this.extractRelevantEvidence(evidence, [/Invoice/i, /Bill To/i, /Total/i, /Due/i])
    );
  }

  private composeBroadDocumentAnswer(citations: CitationPayload[]) {
    const leadCitation = citations[0];
    const evidence = citations
      .slice(0, 2)
      .map((citation) => citation.fragment)
      .join(' ');
    const amounts = this.extractMoneyAmounts(evidence);
    const signals: string[] = [];

    if (/invoice/i.test(evidence)) {
      signals.push('parece contener una factura');
    }
    if (/envato|elements\.envato\.com/i.test(evidence)) {
      signals.push('relacionada con Envato');
    }
    if (/bill to/i.test(evidence)) {
      signals.push('con datos de destinatario o cliente');
    }
    if (amounts.length) {
      signals.push(`con importes como ${amounts.slice(0, 3).join(', ')}`);
    }

    const summary = signals.length
      ? `El documento ${signals.join(', ')}.`
      : 'El documento contiene texto extraido, pero no pude identificar una estructura clara solo con los fragmentos recuperados.';

    return this.composeAnswerWithEvidence(summary, leadCitation, this.extractRelevantEvidence(evidence, [/Invoice/i, /Envato/i, /Bill To/i, /Total/i]));
  }

  private hasInvoiceSignals(evidence: string) {
    const matches = [/Invoice/i, /Bill To/i, /Billed On/i, /Due On/i, /Total/i, /VAT/i].filter((pattern) => pattern.test(evidence));
    return matches.length >= 2;
  }

  private extractMoneyAmounts(evidence: string) {
    const matches = evidence.match(/(?:[$€£]\s?\d[\d,.]*|\b\d[\d,.]*\s?(?:USD|MXN|AUD|EUR|AUD)\b)/gi) ?? [];
    return [...new Set(matches.map((match) => match.replace(/\s+/g, ' ').trim()))].slice(0, 6);
  }

  private composeAnswerWithEvidence(prefix: string, citation: CitationPayload | undefined, evidence: string) {
    if (!citation) {
      return prefix;
    }

    const location = citation.pageNumber ? `pagina ${citation.pageNumber}` : 'sin pagina identificada';
    const evidenceText = evidence ? ` Evidencia: ${evidence}.` : '';
    return `${prefix} Se apoya en ${citation.documentName} (version ${citation.versionLabel}, ${location}).${evidenceText}`;
  }

  private extractRelevantEvidence(evidence: string, patterns: RegExp[]) {
    const compact = evidence.replace(/\s+/g, ' ').trim();
    const fragments: string[] = [];

    for (const pattern of patterns) {
      const match = compact.match(pattern);
      if (!match?.index && match?.index !== 0) {
        continue;
      }

      const start = Math.max(match.index - 24, 0);
      const end = Math.min(match.index + match[0].length + 48, compact.length);
      fragments.push(compact.slice(start, end).trim());
    }

    const unique = [...new Set(fragments)].slice(0, 3);
    return unique.join(' | ');
  }

  private trimFragment(content: string) {
    const compact = content.replace(/\s+/g, ' ').trim();
    return compact.length > 320 ? `${compact.slice(0, 317)}...` : compact;
  }

  private composeSkippedDocumentsMessage(skippedDocuments: Array<{ name: string; reason: string }>, baseMessage: string) {
    if (!skippedDocuments.length) {
      return baseMessage;
    }

    const names = skippedDocuments.map((item) => item.name).join(', ');
    return `${baseMessage}\n\nSe omitieron temporalmente estos documentos por un problema de extraccion o indexacion: ${names}.`;
  }
}
