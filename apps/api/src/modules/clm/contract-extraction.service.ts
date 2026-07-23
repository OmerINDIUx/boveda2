import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { createHash, randomUUID } from 'crypto';
import { DataSource, Repository } from 'typeorm';
import { StorageService } from '../../storage/storage.service';
import { DocumentIndexingService } from '../ai-query/document-indexing.service';
import { OllamaChatService } from '../ai-query/ollama-chat.service';
import { UsersService } from '../users/users.service';
import { ContractAuditLog } from './contract-audit-log.entity';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractMilestone } from './contract-milestone.entity';
import { ContractObligation } from './contract-obligation.entity';
import { ContractVersion } from './contract-version.entity';
import { Contract } from './contract.entity';
import {
  ContractExtractionCheckpoint,
  ContractExtractionRun,
  ContractExtractionFact,
} from './entities/contract-extraction-run.entity';
import { ContractPayment } from './entities/contract-payment.entity';
import { ContractRecordAction } from './entities/contract-record-action.entity';
import { ContractRecord } from './entities/contract-record.entity';
import { ContractDeliverable } from './entities/contract-deliverable.entity';
import { ContractTextIndex } from './entities/contract-text-index.entity';

const PIPELINE_VERSION = 'contract-v7-clean-pdf-checkpoints';
const PROCESSING_STALE_MS = 90_000;
const CHUNK_LENGTH = 2000;
const CHUNK_OVERLAP = 250;
const AI_PROCESSING_SLOTS = 2;
const EMBEDDING_PROCESSING_SLOTS = 3;
const FACT_BATCH_MAX_CHUNKS = 3;
const FACT_BATCH_MAX_CHARACTERS = 12000;
const FACT_BATCH_MIN_SPLIT_CHARACTERS = 3500;
const FACT_BATCH_MAX_SPLIT_DEPTH = 2;
type ContractTranscriptionSegment = {
  text: string;
  pageNumber?: number;
  sectionLabel?: string;
  rawText?: string;
  normalizationMethod?: string;
};
type ContractTranscriptionChunk = {
  content: string;
  pageNumber?: number;
  sectionLabel?: string;
  rawContent?: string;
  normalizationMethod?: string;
};
type ContractEvidence = {
  sourceType: string;
  label: string;
  documentName: string;
  versionLabel: string;
  pageNumber?: number;
  fragment: string;
};
export type GotaContractSource =
  | { sourceType: 'version'; contract: Contract; version: ContractVersion }
  | { sourceType: 'attachment'; contract: Contract; attachment: ContractAttachment };
const ALLOWED_FIELDS: Record<ContractExtractionFact['category'], string[]> = {
  general: [
    'name',
    'contractType',
    'responsibleArea',
    'amount',
    'currency',
    'renewable',
    'renewalNoticeDays',
  ],
  dates: ['startDate', 'endDate', 'renewalDate'],
  parties: ['clientName', 'supplierName'],
  penalties: ['penalty'],
  guarantees: ['guarantee'],
  deliverables: ['deliverable'],
  obligations: ['obligation'],
  payments: ['payment'],
  milestones: ['milestone'],
  risks: ['risk'],
};

@Injectable()
export class ContractExtractionService {
  private readonly logger = new Logger(ContractExtractionService.name);

  constructor(
    @InjectRepository(ContractExtractionRun)
    private readonly runs: Repository<ContractExtractionRun>,
    @InjectRepository(ContractTextIndex)
    private readonly textIndexes: Repository<ContractTextIndex>,
    @InjectRepository(ContractVersion)
    private readonly versions: Repository<ContractVersion>,
    @InjectRepository(ContractAttachment)
    private readonly attachments: Repository<ContractAttachment>,
    private readonly storage: StorageService,
    private readonly indexing: DocumentIndexingService,
    private readonly ollama: OllamaChatService,
    private readonly users: UsersService,
    private readonly dataSource: DataSource
  ) {}

  async createAndStart(contractId: string, versionId: string, uploadedById: string) {
    let run = await this.runs.findOne({ where: { versionId } });
    if (!run) {
      run = await this.runs.save(
        this.runs.create({
          contractId,
          versionId,
          uploadedById,
          status: 'queued',
          progressPercent: 0,
          processingStage: 'queued',
          pipelineVersion: PIPELINE_VERSION,
        })
      );
    }
    void this.process(run.id).catch(() => undefined);
    return this.serialize(run);
  }

  async createAttachmentAndStart(contractId: string, attachmentId: string, uploadedById: string) {
    let run = await this.runs.findOne({ where: { attachmentId } });
    if (!run) {
      run = await this.runs.save(
        this.runs.create({
          contractId,
          attachmentId,
          uploadedById,
          status: 'queued',
          progressPercent: 0,
          processingStage: 'queued',
          pipelineVersion: PIPELINE_VERSION,
        })
      );
    }
    void this.process(run.id).catch(() => undefined);
    return this.serialize(run);
  }

  async get(contractId: string, versionId: string) {
    const run = await this.findRun(contractId, versionId);
    if (this.shouldStartOrResume(run)) void this.process(run.id).catch(() => undefined);
    return this.serialize(run);
  }

  async getAttachmentExtraction(contractId: string, attachmentId: string) {
    const run = await this.findAttachmentRun(contractId, attachmentId);
    if (this.shouldStartOrResume(run)) void this.process(run.id).catch(() => undefined);
    return this.serialize(run);
  }

  async retry(contractId: string, versionId: string, userId: string) {
    const run = await this.findRun(contractId, versionId);
    return this.retryRun(run, userId);
  }

  async retryAttachment(contractId: string, attachmentId: string, userId: string) {
    const run = await this.findAttachmentRun(contractId, attachmentId);
    return this.retryRun(run, userId);
  }

  private async retryRun(run: ContractExtractionRun, userId: string) {
    if (run.uploadedById !== userId) {
      throw new ForbiddenException('Solo la persona que cargó el documento puede reprocesarlo.');
    }
    if (run.status === 'approved') throw new BadRequestException('Este borrador ya fue aprobado.');
    const canResumeFacts = run.pipelineVersion === PIPELINE_VERSION && Boolean(run.contentHash);
    const canReuseText =
      run.pipelineVersion === PIPELINE_VERSION &&
      Boolean(run.contentHash) &&
      (run.progressPercent ?? 0) >= 60;
    run.status = 'queued';
    run.error = undefined;
    run.progressPercent = canResumeFacts
      ? Math.max(5, run.progressPercent ?? 0)
      : canReuseText
        ? 60
        : 0;
    run.processingStage = canResumeFacts || canReuseText ? 'resuming' : 'queued';
    run.pipelineVersion = PIPELINE_VERSION;
    if (!canResumeFacts) {
      run.facts = [];
      run.checkpoint = undefined;
      if (!canReuseText) run.contentHash = undefined;
    }
    await this.runs.save(run);
    void this.process(run.id).catch(() => undefined);
    return this.serialize(run);
  }

  async updateDraft(
    contractId: string,
    versionId: string,
    userId: string,
    facts: ContractExtractionFact[]
  ) {
    const run = await this.findRun(contractId, versionId);
    return this.updateRunDraft(run, userId, facts);
  }

  async updateAttachmentDraft(
    contractId: string,
    attachmentId: string,
    userId: string,
    facts: ContractExtractionFact[]
  ) {
    const run = await this.findAttachmentRun(contractId, attachmentId);
    return this.updateRunDraft(run, userId, facts);
  }

  private async updateRunDraft(
    run: ContractExtractionRun,
    userId: string,
    facts: ContractExtractionFact[]
  ) {
    this.assertUploader(run, userId);
    if (!['draft_ready', 'under_review'].includes(run.status)) {
      throw new BadRequestException('El borrador todavía no está listo para revisión.');
    }
    run.facts = this.validateReviewedFacts(facts, false, run.facts ?? []);
    run.status = 'under_review';
    run.progressPercent = 100;
    run.processingStage = 'under_review';
    return this.serialize(await this.runs.save(run));
  }

  async approveAttachment(
    contractId: string,
    attachmentId: string,
    userId: string,
    password: string,
    facts: ContractExtractionFact[]
  ) {
    return this.approveRun(
      await this.findAttachmentRun(contractId, attachmentId),
      userId,
      password,
      facts
    );
  }

  async approve(
    contractId: string,
    versionId: string,
    userId: string,
    password: string,
    facts: ContractExtractionFact[]
  ) {
    const run = await this.findRun(contractId, versionId);
    return this.approveRun(run, userId, password, facts);
  }

  private async approveRun(
    run: ContractExtractionRun,
    userId: string,
    password: string,
    facts: ContractExtractionFact[]
  ) {
    const contractId = run.contractId;
    this.assertUploader(run, userId);
    if (run.status === 'approved') throw new BadRequestException('Este borrador ya fue aprobado.');

    const user = await this.users.findByIdWithRoles(userId);
    if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ForbiddenException('La contraseña no es correcta.');
    }

    const reviewedFacts = this.validateReviewedFacts(facts, true, run.facts ?? []);
    const accepted = reviewedFacts.filter((fact) => fact.decision === 'accepted');
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const lockedRun = await queryRunner.manager.getRepository(ContractExtractionRun).findOne({
        where: { id: run.id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!lockedRun) throw new NotFoundException('El borrador ya no existe.');
      if (lockedRun.status === 'approved') {
        throw new BadRequestException('Este borrador ya fue aprobado.');
      }

      const contractRepo = queryRunner.manager.getRepository(Contract);
      const contract = await contractRepo.findOne({ where: { id: contractId } });
      if (!contract) throw new NotFoundException('Contrato no encontrado.');
      if (lockedRun.versionId && contract.currentVersionId !== lockedRun.versionId) {
        throw new BadRequestException('Solo se puede aprobar la versión vigente.');
      }
      if (lockedRun.attachmentId) {
        const attachment = await queryRunner.manager.getRepository(ContractAttachment).findOne({
          where: { id: lockedRun.attachmentId, contractId },
        });
        if (!attachment?.isCurrent) {
          throw new BadRequestException('Solo se puede aprobar la versión vigente del anexo.');
        }
      }

      const before = this.contractSnapshot(contract);
      this.applyScalarFacts(contract, accepted);
      await contractRepo.save(contract);

      const persistence = this.buildPersistencePayloads(accepted, {
        contractId,
        userId,
        currency: contract.currency ?? 'MXN',
        extractionRunId: lockedRun.id,
        versionId: lockedRun.versionId,
        attachmentId: lockedRun.attachmentId,
      });
      const obligations = persistence.obligations.map((payload) =>
        queryRunner.manager.getRepository(ContractObligation).create(payload)
      );
      if (obligations.length)
        await queryRunner.manager.getRepository(ContractObligation).save(obligations);

      const milestones = persistence.milestones.map((payload) =>
        queryRunner.manager.getRepository(ContractMilestone).create(payload)
      );
      if (milestones.length)
        await queryRunner.manager.getRepository(ContractMilestone).save(milestones);

      const payments = persistence.payments.map((payload) =>
        queryRunner.manager.getRepository(ContractPayment).create(payload)
      );
      if (payments.length) await queryRunner.manager.getRepository(ContractPayment).save(payments);

      const deliverables = persistence.deliverables.map((payload) =>
        queryRunner.manager.getRepository(ContractDeliverable).create(payload)
      );
      if (deliverables.length) {
        await queryRunner.manager.getRepository(ContractDeliverable).save(deliverables);
      }

      const recordRepo = queryRunner.manager.getRepository(ContractRecord);
      const extractedRecords = persistence.records.map((payload) => recordRepo.create(payload));
      const savedRecords = extractedRecords.length ? await recordRepo.save(extractedRecords) : [];
      if (savedRecords.length) {
        await queryRunner.manager.getRepository(ContractRecordAction).save(
          savedRecords.map((record) =>
            queryRunner.manager.getRepository(ContractRecordAction).create({
              recordId: record.id,
              actorId: userId,
              action: 'approved_from_ai_extraction',
              comment: 'Creado al aprobar la extracción documental.',
            })
          )
        );
      }

      lockedRun.facts = reviewedFacts;
      lockedRun.status = 'approved';
      lockedRun.progressPercent = 100;
      lockedRun.processingStage = 'approved';
      lockedRun.approvedAt = new Date();
      lockedRun.approvedById = userId;
      await queryRunner.manager.getRepository(ContractExtractionRun).save(lockedRun);
      await queryRunner.manager.getRepository(ContractAuditLog).save(
        queryRunner.manager.getRepository(ContractAuditLog).create({
          contractId,
          actorId: userId,
          action: 'approve_ai_extraction',
          beforeState: before,
          afterState: {
            contract: this.contractSnapshot(contract),
            extractionRunId: lockedRun.id,
            versionId: lockedRun.versionId,
            attachmentId: lockedRun.attachmentId,
            acceptedFacts: accepted.length,
            rejectedFacts: reviewedFacts.length - accepted.length,
            obligationsCreated: obligations.length,
            milestonesCreated: milestones.length,
            paymentsCreated: payments.length,
            deliverablesCreated: deliverables.length,
            penaltiesCreated: savedRecords.filter((record) => record.recordType === 'penalty')
              .length,
            guaranteesCreated: savedRecords.filter((record) => record.recordType === 'guarantee')
              .length,
            risksCreated: savedRecords.filter((record) => record.recordType === 'risk').length,
          },
        })
      );
      await queryRunner.commitTransaction();
      return this.serialize(lockedRun);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private buildPersistencePayloads(
    facts: ContractExtractionFact[],
    context: {
      contractId: string;
      userId: string;
      currency: string;
      extractionRunId: string;
      versionId?: string;
      attachmentId?: string;
    }
  ): {
    obligations: Array<Partial<ContractObligation>>;
    milestones: Array<Partial<ContractMilestone>>;
    payments: Array<Partial<ContractPayment>>;
    deliverables: Array<Partial<ContractDeliverable>>;
    records: Array<Partial<ContractRecord>>;
  } {
    const sourceMetadata = {
      source: 'ai_extraction',
      extractionRunId: context.extractionRunId,
      versionId: context.versionId,
      attachmentId: context.attachmentId,
    };
    const obligations = facts
      .filter((fact) => fact.category === 'obligations')
      .map((fact) => this.asObject(fact.value))
      .filter((value) => typeof value.description === 'string' && value.description.trim())
      .map((value) => ({
        contractId: context.contractId,
        description: String(value.description).trim(),
        responsibleUserId: this.optionalString(value.responsibleUserId),
        commitmentDate: this.isoDate(value.commitmentDate),
        status: 'pending' as const,
        comments: this.optionalString(value.comments),
        periodicity: this.optionalString(value.periodicity) ?? 'once',
        priority: this.optionalString(value.priority) ?? 'medium',
        consequence: this.optionalString(value.consequence),
        alertDaysBefore: this.nonNegativeInteger(value.alertDaysBefore),
      }));
    const milestones = facts
      .filter((fact) => fact.category === 'milestones')
      .map((fact) => this.asObject(fact.value))
      .filter(
        (value) => typeof value.name === 'string' && Boolean(this.isoDate(value.milestoneDate))
      )
      .map((value) => ({
        contractId: context.contractId,
        name: String(value.name).trim().slice(0, 180),
        milestoneDate: this.isoDate(value.milestoneDate)!,
        responsibleUserId: this.optionalString(value.responsibleUserId),
        status: 'pending',
        notes: this.optionalString(value.notes),
        alertDaysBefore: this.nonNegativeInteger(value.alertDaysBefore),
      }));
    const payments = facts
      .filter((fact) => fact.category === 'payments')
      .map((fact) => this.asObject(fact.value))
      .filter(
        (value) =>
          typeof value.concept === 'string' &&
          (this.decimal(value.amount) !== undefined ||
            this.percentage(value.percentage) !== undefined)
      )
      .map((value) => ({
        contractId: context.contractId,
        concept: String(value.concept).trim().slice(0, 200),
        amount: this.decimal(value.amount),
        currency: this.currency(value.currency) ?? context.currency,
        percentage: this.percentage(value.percentage),
        paymentCondition: this.optionalString(value.condition),
        paymentDate: this.isoDate(value.paymentDate),
        dueDate: this.isoDate(value.dueDate),
        status: 'pending',
        notes: this.optionalString(value.notes),
        createdById: context.userId,
      }));
    const deliverables = facts
      .filter((fact) => fact.category === 'deliverables')
      .map((fact) => ({ fact, value: this.asObject(fact.value) }))
      .filter(({ value }) => typeof value.name === 'string' && value.name.trim())
      .map(({ fact, value }) => ({
        contractId: context.contractId,
        name: String(value.name).trim().slice(0, 200),
        description: this.optionalString(value.description),
        dueDate: this.isoDate(value.dueDate),
        acceptanceCriteria: this.optionalString(value.acceptanceCriteria),
        responsibleUserId: this.optionalString(value.responsibleUserId),
        status: 'pending' as const,
        metadata: {
          ...sourceMetadata,
          evidence: fact.evidence,
          pageNumber: fact.pageNumber,
        },
      }));
    const records = facts
      .filter((fact) => ['penalties', 'guarantees', 'risks'].includes(fact.category))
      .map((fact, index): Partial<ContractRecord> => {
        const value = this.asObject(fact.value);
        const recordType =
          fact.category === 'penalties'
            ? 'penalty'
            : fact.category === 'guarantees'
              ? 'guarantee'
              : 'risk';
        const prefix =
          recordType === 'penalty' ? 'PEN' : recordType === 'guarantee' ? 'GAR' : 'RIE';
        const fallbackTitle =
          recordType === 'penalty'
            ? 'Penalización contractual'
            : recordType === 'guarantee'
              ? 'Garantía contractual'
              : 'Riesgo contractual';
        const amount = this.decimal(value.amount);
        return {
          contractId: context.contractId,
          recordType,
          recordNumber: `EXT-${prefix}-${context.extractionRunId.slice(0, 8)}-${index + 1}`,
          title: (this.optionalString(value.title) ?? fact.label ?? fallbackTitle).slice(0, 200),
          description: this.optionalString(value.description) ?? fact.evidence,
          status: 'approved',
          approvalStatus: 'approved',
          eventDate: this.isoDate(value.eventDate),
          dueDate: this.isoDate(value.dueDate),
          amount,
          approvedAmount: amount,
          currency: this.currency(value.currency) ?? context.currency,
          counterparty: this.optionalString(value.counterparty)?.slice(0, 180),
          basisClause: this.optionalString(value.basisClause),
          calculation: this.optionalString(value.calculation),
          percentage: this.percentage(value.percentage),
          issuer: this.optionalString(value.issuer)?.slice(0, 180),
          beneficiary: this.optionalString(value.beneficiary)?.slice(0, 180),
          validFrom: this.isoDate(value.validFrom),
          validUntil: this.isoDate(value.validUntil),
          responsibleUserId: this.optionalString(value.responsibleUserId),
          metadata: {
            ...sourceMetadata,
            evidence: fact.evidence,
            pageNumber: fact.pageNumber,
            capPercentage: value.capPercentage,
            trigger: value.trigger,
            frequency: value.frequency,
            durationMonths: value.durationMonths,
            startCondition: value.startCondition,
            coverage: value.coverage,
            severity: value.severity,
            recommendation: value.recommendation,
          },
          createdById: context.userId,
        };
      });
    return { obligations, milestones, payments, deliverables, records };
  }

  async ask(contract: Contract, version: ContractVersion | null, question: string) {
    if (!version) return null;
    const searchQuery = await this.createBilingualSearchQuery(question);
    const context = await this.buildQueryContext(contract, version, searchQuery);
    if (!context) return null;
    return this.answerFromEvidence(question, context.evidence, {
      documentsSearched: 1,
      approvedFactsUsed: context.approvedFactsUsed,
      transcriptionChunksUsed: context.transcriptionChunksUsed,
    });
  }

  async askAcross(sources: GotaContractSource[], question: string) {
    if (!sources.length) {
      return {
        answer: 'No hay documentos contractuales disponibles dentro del alcance seleccionado.',
        status: 'insufficient_information',
        context: {
          mode: 'persisted_contract_knowledge',
          documentsSearched: 0,
          approvedFactsUsed: 0,
          transcriptionChunksUsed: 0,
          fileRead: false,
        },
        citations: [],
      };
    }

    const searchQuery = await this.createBilingualSearchQuery(question);
    const contexts = (
      await Promise.all(
        sources.map((source) =>
          source.sourceType === 'version'
            ? this.buildQueryContext(source.contract, source.version, searchQuery)
            : this.buildAttachmentQueryContext(source.contract, source.attachment, searchQuery)
        )
      )
    ).filter((value): value is NonNullable<typeof value> => Boolean(value));
    if (!contexts.length) {
      return {
        answer:
          'Los documentos seleccionados todavía no tienen una transcripción o datos aprobados disponibles.',
        status: 'insufficient_information',
        context: {
          mode: 'persisted_contract_knowledge',
          documentsSearched: sources.length,
          approvedFactsUsed: 0,
          transcriptionChunksUsed: 0,
          fileRead: false,
        },
        citations: [],
      };
    }

    const queryEmbedding = this.indexing.createLocalEmbedding(searchQuery);
    const queryTokens = this.tokens(searchQuery);
    const evidence = contexts
      .flatMap((context) => context.evidence)
      .map((item) => ({
        item,
        score: this.relevanceScore(queryEmbedding, queryTokens, item.fragment),
      }))
      .sort((left, right) => right.score - left.score)
      .map(({ item }) => item)
      .slice(0, 12);
    return this.answerFromEvidence(question, evidence, {
      documentsSearched: contexts.length,
      approvedFactsUsed: contexts.reduce((sum, item) => sum + item.approvedFactsUsed, 0),
      transcriptionChunksUsed: contexts.reduce(
        (sum, item) => sum + item.transcriptionChunksUsed,
        0
      ),
    });
  }

  async getKnowledge(contractId: string, versionId: string) {
    const [version, run, rows] = await Promise.all([
      this.versions.findOne({ where: { id: versionId, contractId } }),
      this.runs.findOne({ where: { contractId, versionId } }),
      this.textIndexes.find({
        where: { contractId, versionId },
        order: { chunkIndex: 'ASC' },
      }),
    ]);
    if (!version) throw new NotFoundException('Versión no encontrada.');

    const pageMap = new Map<number, string[]>();
    const rawPageMap = new Map<number, string>();
    for (const row of this.compactPersistedRows(rows).sort(
      (left, right) => (left.chunkIndex ?? 0) - (right.chunkIndex ?? 0)
    )) {
      const page = row.pageNumber ?? 0;
      const current = pageMap.get(page) ?? [];
      current.push(row.content);
      pageMap.set(page, current);
      if (row.rawContent && !rawPageMap.has(page)) rawPageMap.set(page, row.rawContent);
    }

    return {
      version: {
        id: version.id,
        versionLabel: version.versionLabel,
        fileName: version.fileName,
        createdAt: version.createdAt,
      },
      extractionStatus: run?.status ?? 'not_processed',
      approvedAt: run?.approvedAt,
      facts: (run?.facts ?? []).map((fact) => ({
        ...fact,
        displayValue: this.humanReadableFactValue(fact),
        displayFields: this.humanReadableFactFields(fact.value),
      })),
      transcription: [...pageMap.entries()]
        .sort(([left], [right]) => left - right)
        .map(([pageNumber, contents]) => ({
          pageNumber: pageNumber || undefined,
          text: this.mergeChunkContents(contents),
        })),
      rawTranscription: [...rawPageMap.entries()]
        .sort(([left], [right]) => left - right)
        .map(([pageNumber, text]) => ({ pageNumber: pageNumber || undefined, text })),
      stats: {
        storedChunks: rows.length,
        visibleChunks: this.compactPersistedRows(rows).length,
        characters: rows.reduce((sum, row) => sum + row.content.length, 0),
        normalizationMethod: rows.some((row) => row.normalizationMethod === 'ollama')
          ? 'ollama'
          : rows.some((row) => row.normalizationMethod)
            ? 'deterministic'
            : 'legacy',
      },
    };
  }

  async normalizeStoredTranscription(contractId: string, versionId: string) {
    const version = await this.versions.findOne({ where: { id: versionId, contractId } });
    if (!version) throw new NotFoundException('Versión no encontrada.');
    const rows = await this.textIndexes.find({
      where: { contractId, versionId },
      order: { chunkIndex: 'ASC' },
    });
    const compactRows = this.compactPersistedRows(rows).sort(
      (left, right) => (left.chunkIndex ?? 0) - (right.chunkIndex ?? 0)
    );
    if (!compactRows.length) throw new BadRequestException('La versión no tiene transcripción.');

    const pages = new Map<number, { contents: string[]; raw?: string }>();
    for (const row of compactRows) {
      const page = row.pageNumber ?? 0;
      const current = pages.get(page) ?? { contents: [] };
      current.contents.push(row.content);
      if (row.rawContent && !current.raw) current.raw = row.rawContent;
      pages.set(page, current);
    }
    const sourceSegments = [...pages.entries()]
      .sort(([left], [right]) => left - right)
      .map(([pageNumber, page]) => ({
        text: page.raw ?? this.mergeChunkContents(page.contents),
        pageNumber: pageNumber || undefined,
      }));
    const normalized = await this.normalizeSegments(sourceSegments);
    await this.replaceTextIndex(contractId, { versionId }, this.buildChunks(normalized));
    return this.getKnowledge(contractId, versionId);
  }

  async indexAttachment(attachment: ContractAttachment) {
    const buffer = await this.storage.read(attachment.fileKey);
    const extracted = await this.indexing.extractFile(
      attachment.fileName,
      attachment.mimeType,
      buffer
    );
    const immediatelyAvailable = extracted.segments
      .map((segment) => ({
        text: this.cleanTranscriptionArtifacts(segment.text),
        pageNumber: segment.pageNumber,
        sectionLabel: segment.sectionLabel,
        rawText: segment.text,
        normalizationMethod: 'deterministic',
      }))
      .filter((segment) => Boolean(segment.text));
    const chunks = this.buildChunks(immediatelyAvailable);
    if (!chunks.length)
      throw new BadRequestException('No se pudo extraer texto del anexo para G.OTA.');
    await this.replaceTextIndex(attachment.contractId, { attachmentId: attachment.id }, chunks);

    // El anexo queda disponible para consulta antes de esperar a Ollama. La mejora
    // de la transcripción continúa en segundo plano y reemplaza el índice al terminar.
    void this.enhanceAttachmentIndex(attachment, extracted.segments).catch((error: unknown) => {
      this.logger.warn(
        `No fue posible normalizar con Ollama el anexo ${attachment.id}: ${error instanceof Error ? error.message : String(error)}`
      );
    });
  }

  private async enhanceAttachmentIndex(
    attachment: ContractAttachment,
    segments: Array<{ text: string; pageNumber?: number; sectionLabel?: string }>
  ) {
    const normalized = await this.normalizeSegments(segments);
    const chunks = this.buildChunks(normalized);
    if (!chunks.length) return;
    await this.replaceTextIndex(attachment.contractId, { attachmentId: attachment.id }, chunks);
  }

  async getAttachmentKnowledge(contractId: string, attachmentId: string) {
    const [attachment, rows] = await Promise.all([
      this.attachments.findOne({ where: { id: attachmentId, contractId } }),
      this.textIndexes.find({
        where: { contractId, attachmentId },
        order: { chunkIndex: 'ASC' },
      }),
    ]);
    if (!attachment) throw new NotFoundException('Anexo no encontrado.');
    return this.attachmentKnowledgeResponse(attachment, rows);
  }

  async normalizeStoredAttachmentTranscription(contractId: string, attachmentId: string) {
    const attachment = await this.attachments.findOne({ where: { id: attachmentId, contractId } });
    if (!attachment) throw new NotFoundException('Anexo no encontrado.');
    const rows = await this.textIndexes.find({
      where: { contractId, attachmentId },
      order: { chunkIndex: 'ASC' },
    });
    const compactRows = this.compactPersistedRows(rows).sort(
      (left, right) => (left.chunkIndex ?? 0) - (right.chunkIndex ?? 0)
    );
    if (!compactRows.length) {
      await this.indexAttachment(attachment);
      return this.getAttachmentKnowledge(contractId, attachmentId);
    }
    const pages = new Map<number, { contents: string[]; raw?: string }>();
    for (const row of compactRows) {
      const page = row.pageNumber ?? 0;
      const current = pages.get(page) ?? { contents: [] };
      current.contents.push(row.content);
      if (row.rawContent && !current.raw) current.raw = row.rawContent;
      pages.set(page, current);
    }
    const sourceSegments = [...pages.entries()]
      .sort(([left], [right]) => left - right)
      .map(([pageNumber, page]) => ({
        text: page.raw ?? this.mergeChunkContents(page.contents),
        pageNumber: pageNumber || undefined,
      }));
    const normalized = await this.normalizeSegments(sourceSegments);
    await this.replaceTextIndex(contractId, { attachmentId }, this.buildChunks(normalized));
    return this.getAttachmentKnowledge(contractId, attachmentId);
  }

  private async buildQueryContext(contract: Contract, version: ContractVersion, question: string) {
    const [rows, approvedRun] = await Promise.all([
      this.textIndexes.find({
        where: { contractId: contract.id, versionId: version.id },
        order: { chunkIndex: 'ASC' },
      }),
      this.runs.findOne({
        where: { contractId: contract.id, versionId: version.id, status: 'approved' },
      }),
    ]);
    const approvedFacts = (approvedRun?.facts ?? []).filter((fact) => fact.decision === 'accepted');
    if (!rows.length && !approvedFacts.length) return null;

    // Las consultas usan exclusivamente el indice local persistido. Ollama solo
    // interviene al final para redactar la respuesta y nunca vuelve a abrir el archivo.
    const queryEmbedding = this.indexing.createLocalEmbedding(question);
    const queryTokens = this.tokens(question);
    const rankedFacts = approvedFacts
      .map((fact) => {
        const content = this.approvedFactText(fact);
        return {
          fact,
          content,
          score: this.relevanceScore(queryEmbedding, queryTokens, content),
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 30);
    const rankedRows = this.compactPersistedRows(rows)
      .map((row) => {
        return {
          row,
          score: this.relevanceScore(queryEmbedding, queryTokens, row.content, row.embedding),
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, 6);
    const evidence = [
      ...rankedFacts.map(({ fact, content }) => ({
        sourceType: 'approved_contract_fact',
        label: `Dato aprobado · ${fact.label}`,
        documentName: `${contract.name} · datos aprobados`,
        versionLabel: version.versionLabel,
        pageNumber: fact.pageNumber,
        fragment: content.slice(0, 900),
      })),
      ...rankedRows.map(({ row }) => ({
        sourceType: 'contract_transcription',
        label: `Transcripcion · Version ${version.versionLabel}${row.pageNumber ? ` · pagina ${row.pageNumber}` : ''}`,
        documentName: `${contract.name} · transcripcion almacenada`,
        versionLabel: version.versionLabel,
        pageNumber: row.pageNumber,
        fragment: row.content.slice(0, 900),
      })),
    ];
    return {
      evidence,
      approvedFactsUsed: rankedFacts.length,
      transcriptionChunksUsed: rankedRows.length,
    };
  }

  private async buildAttachmentQueryContext(
    contract: Contract,
    attachment: ContractAttachment,
    question: string
  ) {
    const rows = await this.textIndexes.find({
      where: { contractId: contract.id, attachmentId: attachment.id },
      order: { chunkIndex: 'ASC' },
    });
    if (!rows.length) return null;
    const queryEmbedding = this.indexing.createLocalEmbedding(question);
    const queryTokens = this.tokens(question);
    const rankedRows = this.compactPersistedRows(rows)
      .map((row) => ({
        row,
        score: this.relevanceScore(queryEmbedding, queryTokens, row.content, row.embedding),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, 6);
    return {
      evidence: rankedRows.map(({ row }) => ({
        sourceType: 'contract_attachment_transcription',
        label: `Anexo · ${attachment.name} · Versión ${attachment.versionLabel || '1'}${row.pageNumber ? ` · página ${row.pageNumber}` : ''}`,
        documentName: `${contract.name} · anexo ${attachment.name}`,
        versionLabel: attachment.versionLabel || '1',
        pageNumber: row.pageNumber,
        fragment: row.content.slice(0, 900),
      })),
      approvedFactsUsed: 0,
      transcriptionChunksUsed: rankedRows.length,
    };
  }

  private async answerFromEvidence(
    question: string,
    evidence: ContractEvidence[],
    usage: {
      documentsSearched: number;
      approvedFactsUsed: number;
      transcriptionChunksUsed: number;
    }
  ) {
    const answer = await this.ollama.answer(question, evidence);
    return {
      answer:
        answer.answer ??
        `No fue posible redactar la respuesta con Ollama. Evidencia encontrada:\n${evidence.map((item, index) => `${index + 1}. ${item.fragment}`).join('\n')}`,
      status: answer.answer ? 'answered' : 'evidence_only',
      context: {
        mode: 'persisted_contract_knowledge',
        documentsSearched: usage.documentsSearched,
        approvedFactsUsed: usage.approvedFactsUsed,
        transcriptionChunksUsed: usage.transcriptionChunksUsed,
        fileRead: false,
        searchLanguages: ['es', 'en'],
      },
      citations: evidence.map((item) => ({
        sourceType: item.sourceType,
        label: item.label,
        fragment: item.fragment,
      })),
    };
  }

  private async process(runId: string) {
    const staleBefore = new Date(Date.now() - PROCESSING_STALE_MS);
    const claimed = await this.runs
      .createQueryBuilder()
      .update(ContractExtractionRun)
      .set({
        status: 'processing',
        error: undefined,
        pipelineVersion: PIPELINE_VERSION,
      })
      .where('id = :id', { id: runId })
      .andWhere(
        '(status IN (:...statuses) OR (status = :processingStatus AND updated_at < :staleBefore))',
        {
          statuses: ['queued', 'failed'],
          processingStatus: 'processing',
          staleBefore,
        }
      )
      .execute();
    if (!claimed.affected) return;
    const run = await this.runs.findOne({ where: { id: runId } });
    if (!run) return;
    try {
      if (!run.contentHash) await this.updateProgress(run.id, 5, 'reading_file');
      const document = run.versionId
        ? await this.versions.findOne({
            where: { id: run.versionId, contractId: run.contractId },
          })
        : run.attachmentId
          ? await this.attachments.findOne({
              where: { id: run.attachmentId, contractId: run.contractId },
            })
          : null;
      if (!document) throw new NotFoundException('Documento no encontrado.');
      const buffer = await this.storage.read(document.fileKey);
      const documentHash = createHash('sha256').update(buffer).digest('hex');
      const contentHash = `${PIPELINE_VERSION}:${documentHash}`;
      const sameDocument = run.contentHash?.endsWith(`:${documentHash}`) ?? false;
      if (!sameDocument) {
        run.facts = [];
        run.checkpoint = undefined;
      }
      run.contentHash = contentHash;
      run.pipelineVersion = PIPELINE_VERSION;
      await this.runs.save(run);

      let chunks: ContractTranscriptionChunk[] = [];
      const canReuseCompleteIndex =
        sameDocument &&
        ((run.checkpoint?.contentHash === contentHash &&
          ['extracting_facts', 'draft_ready'].includes(run.checkpoint.stage)) ||
          (run.progressPercent ?? 0) >= 60);
      if (canReuseCompleteIndex) {
        chunks = await this.loadPersistedChunks(run);
      }
      if (!chunks.length) {
        await this.updateProgress(run.id, 10, 'extracting_text');
        const extracted = await this.indexing.extractFile(
          document.fileName,
          document.mimeType,
          buffer
        );
        const normalizedSegments = await this.normalizeSegments(
          extracted.segments,
          (current, total) =>
            this.updateProgress(run.id, 10 + Math.round((current / total) * 10), 'restoring_text')
        );
        chunks = this.buildChunks(normalizedSegments);
        if (!chunks.length)
          throw new BadRequestException(
            'No se pudo extraer texto del archivo. Si es un PDF escaneado, requiere OCR.'
          );
        await this.updateProgress(run.id, 20, 'restored_text_ready');
      }

      const checkpoint = this.prepareCheckpoint(run.checkpoint, contentHash);
      checkpoint.stage = 'indexing_text';
      checkpoint.savedAt = new Date().toISOString();
      run.checkpoint = checkpoint;
      await this.runs.save(run);
      await this.replaceTextIndex(
        run.contractId,
        run.versionId ? { versionId: run.versionId } : { attachmentId: run.attachmentId },
        chunks,
        (current, total) =>
          this.updateProgress(
            run.id,
            20 + Math.round((current / total) * 40),
            'indexing_restored_text'
          ),
        sameDocument
      );

      const extractionBatches = this.buildFactExtractionBatches(chunks);
      const batchEntries = extractionBatches.map((evidence) => ({
        evidence,
        key: createHash('sha256').update(evidence).digest('hex'),
      }));
      checkpoint.stage = 'extracting_facts';
      checkpoint.totalBatches = batchEntries.length;
      checkpoint.savedAt = new Date().toISOString();
      run.checkpoint = checkpoint;
      run.progressPercent = Math.max(60, run.progressPercent ?? 0);
      run.processingStage = 'enumerating_items';
      await this.runs.save(run);

      const pendingBatches = batchEntries.filter((batch) => !checkpoint.batches[batch.key]);
      let checkpointQueue = Promise.resolve();
      await this.mapWithConcurrency(pendingBatches, AI_PROCESSING_SLOTS, async (batch) => {
        const result = await this.extractFactsResiliently(batch.evidence);
        checkpointQueue = checkpointQueue.then(async () => {
          checkpoint.batches[batch.key] = {
            facts: result.facts,
            errors: result.errors,
            model: result.model,
            completedAt: new Date().toISOString(),
          };
          checkpoint.savedAt = new Date().toISOString();
          const completed = Object.keys(checkpoint.batches).length;
          const partialFacts = Object.values(checkpoint.batches).flatMap((saved) => saved.facts);
          run.checkpoint = checkpoint;
          run.facts = this.deduplicateFacts(this.splitTrackableFacts(partialFacts));
          run.progressPercent =
            60 + Math.round((completed / Math.max(1, batchEntries.length)) * 30);
          run.processingStage = 'enumerating_items';
          await this.runs.save(run);
        });
        await checkpointQueue;
        return result;
      });

      const extractionResults = batchEntries
        .map((batch) => checkpoint.batches[batch.key])
        .filter(Boolean);
      const extractedFacts: ContractExtractionFact[] = [];
      let modelName: string | undefined;
      const extractionErrors: string[] = [];
      for (const result of extractionResults) {
        modelName = result.model ?? modelName;
        extractedFacts.push(...result.facts);
        extractionErrors.push(...result.errors);
      }
      const deterministicFacts = this.extractDeterministicSpecialFacts(chunks);
      const deterministicCategories = new Set(deterministicFacts.map((fact) => fact.category));
      const mergedFacts = [
        ...extractedFacts.filter((fact) => !deterministicCategories.has(fact.category)),
        ...deterministicFacts,
      ];
      const readableFacts = mergedFacts.filter((fact) => !this.isGarbledFact(fact));
      if (
        !readableFacts.length &&
        chunks.some((chunk) => this.isLikelyGarbledText(chunk.content))
      ) {
        throw new BadRequestException(
          'La capa de texto del PDF es ilegible. Se requiere volver a extraer el documento con OCR o un lector de PDF compatible.'
        );
      }
      if (!readableFacts.length && extractionErrors.length) {
        throw new BadRequestException(extractionErrors.at(-1));
      }
      run.facts = this.deduplicateFacts(this.splitTrackableFacts(readableFacts));
      run.status = 'draft_ready';
      run.progressPercent = 100;
      run.processingStage = 'draft_ready';
      run.modelName = modelName;
      run.contentHash = contentHash;
      checkpoint.stage = 'draft_ready';
      checkpoint.savedAt = new Date().toISOString();
      run.checkpoint = checkpoint;
      run.processedAt = new Date();
      run.error = undefined;
      await this.runs.save(run);
    } catch (error) {
      await this.runs.update(
        { id: run.id },
        {
          status: 'failed',
          processingStage: 'failed',
          error: error instanceof Error ? error.message : 'No fue posible procesar el contrato.',
        }
      );
      throw error;
    }
  }

  private buildChunks(segments: ContractTranscriptionSegment[]) {
    const chunks: ContractTranscriptionChunk[] = [];
    for (const segment of segments) {
      const text = segment.text
        .replace(/\r/g, '')
        .split('\n')
        .map((line) => line.replace(/[ \t]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n')
        .trim();
      let start = 0;
      while (start < text.length) {
        let end = Math.min(start + CHUNK_LENGTH, text.length);
        if (end < text.length) {
          const breakAt = Math.max(
            text.lastIndexOf('\n', end),
            text.lastIndexOf('. ', end),
            text.lastIndexOf(' ', end)
          );
          if (breakAt > start + 400) end = breakAt + 1;
        }
        const content = text.slice(start, end).trim();
        if (content)
          chunks.push({
            content,
            pageNumber: segment.pageNumber,
            sectionLabel: segment.sectionLabel,
            rawContent: start === 0 ? segment.rawText : undefined,
            normalizationMethod: segment.normalizationMethod,
          });
        if (end >= text.length) break;
        start = Math.max(end - CHUNK_OVERLAP, start + 1);
      }
    }
    return chunks;
  }

  private async normalizeSegments(
    segments: Array<{ text: string; pageNumber?: number; sectionLabel?: string }>,
    onProgress?: (current: number, total: number) => Promise<void>
  ): Promise<ContractTranscriptionSegment[]> {
    return this.mapWithConcurrency(
      segments,
      AI_PROCESSING_SLOTS,
      async (segment): Promise<ContractTranscriptionSegment> => {
        const rawText = segment.text;
        const deterministic = this.cleanTranscriptionArtifacts(rawText);
        if (!this.isLikelyGarbledText(deterministic)) {
          return {
            text: deterministic,
            pageNumber: segment.pageNumber,
            sectionLabel: segment.sectionLabel,
            rawText,
            normalizationMethod: 'deterministic',
          };
        }
        const result = await this.ollama.normalizeContractTranscription(
          deterministic,
          segment.pageNumber
        );
        const candidate = result.content
          ? this.cleanTranscriptionArtifacts(
              result.content.replace(/^```(?:markdown|text)?\s*/i, '').replace(/```\s*$/, '')
            )
          : '';
        const useOllama =
          candidate.length >= Math.max(40, deterministic.length * 0.45) &&
          this.preservesEnumeratedStructure(deterministic, candidate) &&
          !this.isLikelyGarbledText(candidate);
        return {
          text: useOllama ? candidate : deterministic,
          pageNumber: segment.pageNumber,
          sectionLabel: segment.sectionLabel,
          rawText,
          normalizationMethod: useOllama ? 'ollama' : 'deterministic',
        };
      },
      onProgress
    );
  }

  private buildFactExtractionBatches(chunks: ContractTranscriptionChunk[]) {
    const batches: string[] = [];
    let current: string[] = [];
    let currentLength = 0;
    for (const chunk of chunks) {
      const evidence = `[Pagina ${chunk.pageNumber ?? 'no identificada'}]\n${chunk.content}`;
      const separatorLength = current.length ? 2 : 0;
      const exceedsLimit =
        current.length > 0 &&
        (current.length >= FACT_BATCH_MAX_CHUNKS ||
          currentLength + separatorLength + evidence.length > FACT_BATCH_MAX_CHARACTERS);
      if (exceedsLimit) {
        batches.push(current.join('\n\n'));
        current = [];
        currentLength = 0;
      }
      current.push(evidence);
      currentLength += (current.length > 1 ? 2 : 0) + evidence.length;
    }
    if (current.length) batches.push(current.join('\n\n'));
    return batches;
  }

  private async extractFactsResiliently(
    evidence: string,
    depth = 0
  ): Promise<{ facts: ContractExtractionFact[]; model?: string; errors: string[] }> {
    const extraction = await this.ollama.extractContractFacts(evidence);
    if (!extraction.content) {
      return {
        facts: [],
        model: extraction.model,
        errors: [extraction.error ?? 'Ollama no generó el borrador de un lote.'],
      };
    }

    try {
      return {
        facts: this.parseFacts(extraction.content, evidence),
        model: extraction.model,
        errors: [],
      };
    } catch (error) {
      const parts =
        depth < FACT_BATCH_MAX_SPLIT_DEPTH
          ? this.splitFactExtractionEvidence(evidence)
          : [evidence];
      if (parts.length > 1) {
        const recovered: ContractExtractionFact[] = [];
        const errors: string[] = [];
        let model = extraction.model;
        for (const part of parts) {
          const result = await this.extractFactsResiliently(part, depth + 1);
          recovered.push(...result.facts);
          errors.push(...result.errors);
          model = result.model ?? model;
        }
        return { facts: recovered, model, errors };
      }

      return {
        facts: [],
        model: extraction.model,
        errors: [
          error instanceof Error
            ? error.message
            : 'Ollama devolvió un lote que no pudo interpretarse.',
        ],
      };
    }
  }

  private splitFactExtractionEvidence(evidence: string) {
    if (evidence.length < FACT_BATCH_MIN_SPLIT_CHARACTERS) return [evidence];
    const sections = evidence
      .split(/(?=^\[Pagina [^\]]+\]\n)/gmu)
      .map((section) => section.trim())
      .filter(Boolean);

    if (sections.length > 1) {
      const target = evidence.length / 2;
      let splitIndex = 1;
      let length = sections[0].length;
      while (splitIndex < sections.length - 1 && length + sections[splitIndex].length < target) {
        length += sections[splitIndex].length + 2;
        splitIndex += 1;
      }
      return [
        sections.slice(0, splitIndex).join('\n\n'),
        sections.slice(splitIndex).join('\n\n'),
      ].filter(Boolean);
    }

    const midpoint = Math.floor(evidence.length / 2);
    const newlineBefore = evidence.lastIndexOf('\n', midpoint);
    const newlineAfter = evidence.indexOf('\n', midpoint);
    const splitAt =
      newlineBefore > FACT_BATCH_MIN_SPLIT_CHARACTERS / 3
        ? newlineBefore
        : newlineAfter > midpoint
          ? newlineAfter
          : evidence.lastIndexOf(' ', midpoint);
    if (splitAt <= 0 || splitAt >= evidence.length - 1) return [evidence];

    const pageHeader = evidence.match(/^\[Pagina [^\]]+\]\n/u)?.[0] ?? '';
    const left = evidence.slice(0, splitAt).trim();
    const rightBody = evidence.slice(splitAt).trim();
    const right =
      pageHeader && !rightBody.startsWith('[Pagina ') ? `${pageHeader}${rightBody}` : rightBody;
    return [left, right].filter(Boolean);
  }

  private async mapWithConcurrency<T, R>(
    items: T[],
    slots: number,
    worker: (item: T, index: number) => Promise<R>,
    onProgress?: (current: number, total: number) => Promise<void>
  ): Promise<R[]> {
    if (!items.length) return [];
    const results = new Array<R>(items.length);
    let nextIndex = 0;
    let completed = 0;
    let progressQueue = Promise.resolve();
    const runners = Array.from({ length: Math.min(Math.max(1, slots), items.length) }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex;
        nextIndex += 1;
        results[index] = await worker(items[index], index);
        completed += 1;
        if (onProgress) {
          const current = completed;
          progressQueue = progressQueue.then(() => onProgress(current, items.length));
          await progressQueue;
        }
      }
    });
    await Promise.all(runners);
    return results;
  }

  private preservesEnumeratedStructure(source: string, restored: string) {
    const sourceMarkers = this.listMarkerCount(source);
    if (sourceMarkers < 2) return true;
    const restoredMarkers = this.listMarkerCount(restored);
    return restoredMarkers >= Math.ceil(sourceMarkers * 0.75);
  }

  private listMarkerCount(value: string) {
    return value.match(/(?:^|\n)\s*(?:(?:\d+|[a-z])[).:-]|[-•●▪◦])\s+(?=\S)/gimu)?.length ?? 0;
  }

  private cleanTranscriptionArtifacts(text: string) {
    return text
      .replaceAll('\u0000', ' ')
      .replace(/[ \t]+/g, ' ')
      .replace(/\s+(?=(?:\d{1,3}\.?\s*){6,}$)(?:\d{1,3}\.?\s*)+$/g, '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n')
      .trim();
  }

  private mergeChunkContents(contents: string[]) {
    if (!contents.length) return '';
    let merged = contents[0];
    for (const content of contents.slice(1)) {
      const maximum = Math.min(CHUNK_OVERLAP + 80, merged.length, content.length);
      let overlap = 0;
      for (let size = maximum; size >= 30; size -= 1) {
        if (merged.endsWith(content.slice(0, size))) {
          overlap = size;
          break;
        }
      }
      merged += overlap ? content.slice(overlap) : `\n\n${content}`;
    }
    return merged;
  }

  private prepareCheckpoint(
    existing: ContractExtractionCheckpoint | undefined,
    contentHash: string
  ): ContractExtractionCheckpoint {
    if (existing?.contentHash === contentHash) {
      return {
        ...existing,
        batches: existing.batches ?? {},
      };
    }
    return {
      contentHash,
      stage: 'indexing_text',
      totalBatches: 0,
      batches: {},
      savedAt: new Date().toISOString(),
    };
  }

  private async loadPersistedChunks(run: ContractExtractionRun) {
    const rows = await this.textIndexes.find({
      where: run.versionId
        ? { contractId: run.contractId, versionId: run.versionId }
        : { contractId: run.contractId, attachmentId: run.attachmentId },
      order: { chunkIndex: 'ASC' },
    });
    return rows.map((row) => ({
      content: row.content,
      pageNumber: row.pageNumber,
      sectionLabel: row.sectionLabel,
      rawContent: row.rawContent,
      normalizationMethod: row.normalizationMethod,
    }));
  }

  private async replaceTextIndex(
    contractId: string,
    source: { versionId?: string; attachmentId?: string },
    chunks: ContractTranscriptionChunk[],
    onProgress?: (current: number, total: number) => Promise<void>,
    resume = false
  ) {
    const where = source.versionId
      ? { contractId, versionId: source.versionId }
      : { contractId, attachmentId: source.attachmentId };
    if (!resume) {
      await this.textIndexes.delete(where);
    }
    const existing = resume
      ? await this.textIndexes.find({ where, order: { chunkIndex: 'ASC' } })
      : [];
    const staleIds = existing
      .filter((row) => {
        const chunk = chunks[row.chunkIndex ?? -1];
        return (
          !chunk || row.contentHash !== createHash('sha256').update(chunk.content).digest('hex')
        );
      })
      .map((row) => row.id)
      .filter(Boolean);
    if (staleIds.length) {
      await this.textIndexes.delete(staleIds);
    }
    const completedIndexes = new Set(
      existing
        .filter((row) => {
          const chunk = chunks[row.chunkIndex ?? -1];
          return (
            chunk && row.contentHash === createHash('sha256').update(chunk.content).digest('hex')
          );
        })
        .map((row) => row.chunkIndex)
    );
    const pending = chunks
      .map((chunk, index) => ({ chunk, index }))
      .filter(({ index }) => !completedIndexes.has(index));
    if (!pending.length) {
      if (onProgress) await onProgress(chunks.length, chunks.length);
      return;
    }
    await this.mapWithConcurrency(
      pending,
      EMBEDDING_PROCESSING_SLOTS,
      async ({ chunk, index }) => {
        const embeddings = await this.indexing.createPersistentEmbeddings(chunk.content);
        const row = this.textIndexes.create({
          contractId,
          versionId: source.versionId,
          attachmentId: source.attachmentId,
          content: chunk.content,
          rawContent: chunk.rawContent,
          normalizationMethod: chunk.normalizationMethod,
          contentHash: createHash('sha256').update(chunk.content).digest('hex'),
          pageNumber: chunk.pageNumber,
          sectionLabel: chunk.sectionLabel,
          chunkIndex: index,
          tokenCount: Math.ceil(chunk.content.length / 4),
          embedding: embeddings.local,
          ollamaEmbedding: embeddings.ollama,
          embeddingModel: embeddings.ollama ? embeddings.ollamaModel : 'holocron-hash-v1',
        });
        await this.textIndexes.save(row);
        return row;
      },
      onProgress
        ? (current) => onProgress(completedIndexes.size + current, chunks.length)
        : undefined
    );
  }

  private attachmentKnowledgeResponse(attachment: ContractAttachment, rows: ContractTextIndex[]) {
    const pageMap = new Map<number, string[]>();
    const rawPageMap = new Map<number, string>();
    for (const row of this.compactPersistedRows(rows).sort(
      (left, right) => (left.chunkIndex ?? 0) - (right.chunkIndex ?? 0)
    )) {
      const page = row.pageNumber ?? 0;
      const current = pageMap.get(page) ?? [];
      current.push(row.content);
      pageMap.set(page, current);
      if (row.rawContent && !rawPageMap.has(page)) rawPageMap.set(page, row.rawContent);
    }
    return {
      version: {
        id: attachment.id,
        versionLabel: attachment.versionLabel || '1',
        fileName: attachment.fileName,
        createdAt: attachment.createdAt,
        sourceType: 'attachment',
      },
      extractionStatus: rows.length ? 'indexed' : 'processing',
      facts: [],
      transcription: [...pageMap.entries()]
        .sort(([left], [right]) => left - right)
        .map(([pageNumber, contents]) => ({
          pageNumber: pageNumber || undefined,
          text: this.mergeChunkContents(contents),
        })),
      rawTranscription: [...rawPageMap.entries()]
        .sort(([left], [right]) => left - right)
        .map(([pageNumber, text]) => ({ pageNumber: pageNumber || undefined, text })),
      stats: {
        storedChunks: rows.length,
        visibleChunks: this.compactPersistedRows(rows).length,
        characters: rows.reduce((sum, row) => sum + row.content.length, 0),
        normalizationMethod: rows.some((row) => row.normalizationMethod === 'ollama')
          ? 'ollama'
          : rows.some((row) => row.normalizationMethod)
            ? 'deterministic'
            : 'legacy',
      },
    };
  }

  private compactPersistedRows(rows: ContractTextIndex[]) {
    const kept: ContractTextIndex[] = [];
    const exact = new Set<string>();
    for (const row of [...rows].sort((left, right) => right.content.length - left.content.length)) {
      const pageKey = `${row.pageNumber ?? 'none'}:${row.content}`;
      if (exact.has(pageKey)) continue;
      const isRedundantSuffix = kept.some(
        (candidate) =>
          candidate.pageNumber === row.pageNumber &&
          candidate.content.length > row.content.length &&
          candidate.content.endsWith(row.content)
      );
      if (isRedundantSuffix) continue;
      exact.add(pageKey);
      kept.push(row);
    }
    return kept;
  }

  private approvedFactText(fact: ContractExtractionFact) {
    return `${fact.label}: ${this.humanReadableFactValue(fact)}. Dato revisado y aprobado manualmente.`;
  }

  private humanReadableFactValue(fact: ContractExtractionFact) {
    const fields = this.humanReadableFactFields(fact.value);
    if (fields.length) return fields.map((field) => `${field.label}: ${field.value}`).join('; ');
    if (typeof fact.value === 'boolean') return fact.value ? 'Sí' : 'No';
    return String(fact.value);
  }

  private humanReadableFactFields(value: ContractExtractionFact['value']) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return [];
    const labels: Record<string, string> = {
      description: 'Descripción',
      commitmentDate: 'Fecha compromiso',
      periodicity: 'Periodicidad',
      priority: 'Prioridad',
      consequence: 'Consecuencia',
      concept: 'Concepto',
      amount: 'Importe',
      currency: 'Moneda',
      paymentDate: 'Fecha de pago',
      dueDate: 'Fecha límite',
      notes: 'Notas',
      name: 'Nombre',
      milestoneDate: 'Fecha del hito',
      severity: 'Severidad',
      recommendation: 'Recomendación',
      title: 'Título',
      basisClause: 'Cláusula de fundamento',
      calculation: 'Cálculo',
      percentage: 'Porcentaje',
      issuer: 'Emisor',
      beneficiary: 'Beneficiario',
      validFrom: 'Vigente desde',
      validUntil: 'Vigente hasta',
    };
    return Object.entries(value)
      .filter(
        ([, fieldValue]) => fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
      )
      .map(([key, fieldValue]) => ({
        key,
        label: labels[key] ?? key,
        value: typeof fieldValue === 'boolean' ? (fieldValue ? 'Sí' : 'No') : String(fieldValue),
      }));
  }

  private async createBilingualSearchQuery(question: string) {
    const expanded = await this.ollama.expandBilingualQuery(question);
    const glossary = this.bilingualContractGlossary(question);
    return [question, expanded.spanish, expanded.english, glossary].filter(Boolean).join('\n');
  }

  private bilingualContractGlossary(question: string) {
    const normalized = question
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, ' ');
    const concepts = [
      ['contrato', 'contract', 'agreement'],
      ['fecha inicio', 'fecha de inicio', 'start date', 'effective date', 'commencement date'],
      [
        'fecha terminacion',
        'fecha final',
        'vence',
        'vencimiento',
        'end date',
        'completion date',
        'expiration date',
        'expiry date',
      ],
      ['pago', 'pagos', 'payment', 'payments'],
      ['anticipo', 'advance payment', 'down payment'],
      ['importe', 'monto', 'amount', 'contract value', 'price'],
      ['obligacion', 'obligaciones', 'obligation', 'obligations', 'duties'],
      ['hito', 'hitos', 'milestone', 'milestones'],
      ['riesgo', 'riesgos', 'risk', 'risks'],
      ['cliente', 'client', 'customer', 'owner'],
      ['proveedor', 'contratista', 'supplier', 'vendor', 'contractor'],
      ['renovacion', 'renewal', 'extension'],
      ['penalizacion', 'pena', 'penalty', 'liquidated damages'],
      ['entregable', 'entregables', 'deliverable', 'deliverables'],
      ['garantia', 'warranty', 'guarantee'],
      ['terminacion anticipada', 'rescisión', 'termination', 'cancellation'],
    ];
    return concepts
      .filter((terms) =>
        terms.some((term) =>
          normalized.includes(term.normalize('NFD').replace(/\p{Diacritic}/gu, ' '))
        )
      )
      .flat()
      .join(' ');
  }

  private relevanceScore(
    queryEmbedding: number[],
    queryTokens: string[],
    content: string,
    storedEmbedding?: number[]
  ) {
    const contentEmbedding = storedEmbedding?.length
      ? storedEmbedding
      : this.indexing.createLocalEmbedding(content);
    const semantic = this.cosine(queryEmbedding, contentEmbedding);
    const contentTokens = new Set(this.tokens(content));
    const keyword =
      queryTokens.filter((token) => contentTokens.has(token)).length /
      Math.max(queryTokens.length, 1);
    return semantic * 0.65 + keyword * 0.35;
  }

  private parseFacts(content: string, sourceEvidence?: string) {
    const clean = content
      .replace(/^\uFEFF/u, '')
      .replace(/^```(?:json)?/i, '')
      .replace(/```$/, '')
      .trim();
    let payload: unknown;
    try {
      payload = JSON.parse(clean);
    } catch {
      const objectStart = clean.indexOf('{');
      const arrayStart = clean.indexOf('[');
      const starts = [objectStart, arrayStart].filter((index) => index >= 0);
      const start = starts.length ? Math.min(...starts) : -1;
      const end = Math.max(clean.lastIndexOf('}'), clean.lastIndexOf(']'));
      if (start < 0 || end <= start) {
        throw new BadRequestException('Ollama devolvio un borrador que no es JSON valido.');
      }
      try {
        payload = JSON.parse(clean.slice(start, end + 1));
      } catch {
        throw new BadRequestException('Ollama devolvio un borrador que no es JSON valido.');
      }
    }
    const payloadObject = this.asObject(payload);
    let rawFacts: unknown = Array.isArray(payload) ? payload : payloadObject.facts;
    if (!Array.isArray(rawFacts)) {
      rawFacts = ['data', 'items', 'results']
        .map((key) => payloadObject[key])
        .find((value) => Array.isArray(value));
    }
    if (!Array.isArray(rawFacts) && payloadObject.fact) rawFacts = [payloadObject.fact];
    if (
      !Array.isArray(rawFacts) &&
      payloadObject.category &&
      payloadObject.field &&
      payloadObject.value !== undefined
    ) {
      rawFacts = [payloadObject];
    }
    if (!Array.isArray(rawFacts)) {
      const categorizedFacts = Object.keys(ALLOWED_FIELDS).flatMap((category) => {
        const values = payloadObject[category];
        if (!Array.isArray(values)) return [];
        return values.map((value) => ({
          ...this.asObject(value),
          category: this.asObject(value).category ?? category,
        }));
      });
      if (categorizedFacts.length) rawFacts = categorizedFacts;
    }
    if (!Array.isArray(rawFacts) && !Object.keys(payloadObject).length) rawFacts = [];
    if (!Array.isArray(rawFacts))
      throw new BadRequestException('Ollama no devolvio una lista de datos.');
    const seen = new Set<string>();
    const facts: ContractExtractionFact[] = [];
    for (const raw of rawFacts) {
      const item = this.asObject(raw);
      const category = String(item.category ?? '') as ContractExtractionFact['category'];
      let field = String(item.field ?? '');
      if (category === 'obligations') field = 'obligation';
      if (category === 'payments') field = 'payment';
      if (category === 'milestones') field = 'milestone';
      if (category === 'risks') field = 'risk';
      if (category === 'penalties') field = 'penalty';
      if (category === 'guarantees') field = 'guarantee';
      if (category === 'deliverables') field = 'deliverable';
      if (
        !ALLOWED_FIELDS[category]?.includes(field) ||
        item.value === null ||
        item.value === undefined
      )
        continue;
      const verifiedEvidence = this.verifyEvidence(
        this.optionalString(item.evidence),
        sourceEvidence
      );
      if (
        sourceEvidence &&
        ['penalties', 'guarantees', 'deliverables', 'payments'].includes(category) &&
        !verifiedEvidence
      ) {
        continue;
      }
      const value = this.sanitizeStructuredValue(category, item.value, verifiedEvidence);
      if (value === undefined) continue;
      if (
        this.isLikelyGarbledText(typeof value === 'string' ? value : JSON.stringify(value)) ||
        this.isLikelyGarbledText(verifiedEvidence ?? '')
      ) {
        continue;
      }
      const key = `${category}:${field}:${JSON.stringify(value)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      facts.push({
        id: randomUUID(),
        category,
        field,
        label: this.optionalString(item.label) ?? this.defaultLabel(category, field),
        value,
        confidence: Math.max(0, Math.min(1, Number(item.confidence ?? 0.5))),
        pageNumber: Number.isFinite(Number(item.pageNumber)) ? Number(item.pageNumber) : undefined,
        evidence: verifiedEvidence?.slice(0, 1000),
        decision: 'pending',
      });
    }
    return facts;
  }

  private isGarbledFact(fact: ContractExtractionFact) {
    const value = typeof fact.value === 'string' ? fact.value : JSON.stringify(fact.value);
    return this.isLikelyGarbledText(value) || this.isLikelyGarbledText(fact.evidence ?? '');
  }

  private isLikelyGarbledText(value: string) {
    const words = value.match(/\p{L}+/gu) ?? [];
    if (words.length < 2) return false;
    const letterCount = words.reduce((sum, word) => sum + word.length, 0);
    if (letterCount < 24) return false;
    const longWords = words.filter((word) => word.length >= 28);
    const longLetterCount = longWords.reduce((sum, word) => sum + word.length, 0);
    const longest = Math.max(...words.map((word) => word.length));
    const singletonRatio = words.filter((word) => word.length === 1).length / words.length;
    return (
      longest >= 60 ||
      longLetterCount / letterCount >= 0.22 ||
      (words.length >= 12 && singletonRatio >= 0.35)
    );
  }

  private verifyEvidence(candidate?: string, sourceEvidence?: string) {
    if (!candidate) return undefined;
    if (!sourceEvidence) return candidate;
    const normalizedCandidate = this.normalizeForComparison(candidate);
    const normalizedSource = this.normalizeForComparison(sourceEvidence);
    return normalizedCandidate.length >= 12 && normalizedSource.includes(normalizedCandidate)
      ? candidate
      : undefined;
  }

  private sanitizeStructuredValue(
    category: ContractExtractionFact['category'],
    rawValue: unknown,
    evidence?: string
  ): ContractExtractionFact['value'] | undefined {
    if (!evidence) return rawValue as ContractExtractionFact['value'];
    if (typeof rawValue !== 'object' || rawValue === null || Array.isArray(rawValue)) {
      return rawValue as ContractExtractionFact['value'];
    }
    if (category === 'penalties') return this.penaltyValueFromEvidence(evidence);
    if (category === 'guarantees') return this.guaranteeValueFromEvidence(evidence);
    if (category === 'payments') return this.paymentValueFromEvidence(evidence);
    if (category === 'deliverables') {
      const value = this.asObject(rawValue);
      const proposedName = this.optionalString(value.name);
      const name =
        proposedName &&
        this.normalizeForComparison(evidence).includes(this.normalizeForComparison(proposedName))
          ? proposedName
          : evidence;
      return { name: name.slice(0, 200) };
    }
    return rawValue as ContractExtractionFact['value'];
  }

  private penaltyValueFromEvidence(evidence: string, basisClause?: string) {
    const percentages = [...evidence.matchAll(/(\d+(?:[.,]\d+)?)\s*%/g)].map((match) =>
      Number(match[1].replace(',', '.'))
    );
    const frequency = evidence.match(/por cada\s+([^,.;]+)/i)?.[1]?.trim();
    const trigger = evidence.match(/(?:en )?caso de\s+(.+?),\s*se aplicar[aá]/iu)?.[1]?.trim();
    const fixedAmount = this.explicitMonetaryAmount(evidence);
    const calculation =
      percentages[0] !== undefined
        ? [
            `${percentages[0]}%`,
            /monto total del contrato/iu.test(evidence) ? 'del monto total del contrato' : '',
            frequency ? `por cada ${frequency}` : '',
          ]
            .filter(Boolean)
            .join(' ')
        : undefined;
    return {
      title: trigger ? `Penalización por ${trigger}` : 'Penalización contractual',
      description: trigger ? `Aplica en caso de ${trigger}.` : undefined,
      percentage: percentages[0],
      capPercentage:
        /l[ií]mite|m[aá]xim/iu.test(evidence) && percentages.length > 1
          ? percentages[percentages.length - 1]
          : undefined,
      trigger,
      frequency,
      basisClause,
      calculation,
      amount: fixedAmount?.amount,
      currency: fixedAmount?.currency,
    };
  }

  private guaranteeValueFromEvidence(evidence: string, basisClause?: string) {
    const duration = evidence.match(/(\d+)\s+mes(?:es)?/iu);
    const startCondition = evidence.match(
      /(?:a partir de|contados? a partir de)\s+(.+?)(?:\.|$)/iu
    );
    const coverage = evidence.match(/garantiza\s+(.+?)\s+por un periodo/iu)?.[1]?.trim();
    const fixedAmount = this.explicitMonetaryAmount(evidence);
    return {
      title: coverage ? `Garantía de ${coverage}` : 'Garantía contractual',
      description: coverage ? `Cubre ${coverage}.` : undefined,
      issuer: /EL CONTRATISTA/iu.test(evidence) ? 'EL CONTRATISTA' : undefined,
      beneficiary: undefined,
      durationMonths: duration ? Number(duration[1]) : undefined,
      startCondition: startCondition?.[1]?.trim(),
      coverage,
      validFrom: undefined,
      validUntil: undefined,
      amount: fixedAmount?.amount,
      currency: fixedAmount?.currency,
      basisClause,
    };
  }

  private paymentValueFromEvidence(evidence: string) {
    const percentageMatch = evidence.match(/^\s*(?:\d+\.\s*)?(\d+(?:[.,]\d+)?)\s*%\s*(.+)$/iu);
    const fixedAmount = this.explicitMonetaryAmount(evidence);
    if (!percentageMatch && !fixedAmount) return undefined;
    const condition = percentageMatch?.[2]?.trim().replace(/[.;]$/, '');
    const concept = /anticipo/iu.test(condition ?? evidence)
      ? 'Anticipo'
      : condition
        ? `Pago ${condition}`
        : 'Pago contractual';
    return {
      concept,
      amount: fixedAmount?.amount,
      currency: fixedAmount?.currency,
      percentage: percentageMatch ? Number(percentageMatch[1].replace(',', '.')) : undefined,
      condition,
    };
  }

  private explicitMonetaryAmount(evidence: string) {
    const match = evidence.match(/\$\s*([\d,.]+)(?:\s*(MXN|USD|EUR))?/iu);
    if (!match) return undefined;
    const amount = this.decimal(match[1]);
    if (!amount) return undefined;
    return { amount, currency: match[2]?.toUpperCase() };
  }

  private extractDeterministicSpecialFacts(chunks: ContractTranscriptionChunk[]) {
    const facts: ContractExtractionFact[] = [];
    const add = (
      category: ContractExtractionFact['category'],
      field: string,
      label: string,
      value: Record<string, unknown>,
      evidence: string,
      pageNumber?: number
    ) => {
      facts.push({
        id: randomUUID(),
        category,
        field,
        label,
        value,
        confidence: 1,
        pageNumber,
        evidence: evidence.slice(0, 1000),
        decision: 'pending',
      });
    };

    for (const chunk of chunks) {
      const deliverables = this.clauseSection(chunk.content, 'ENTREGABLES');
      if (deliverables) {
        for (const item of this.clauseListItems(deliverables.body, /deber[aá]\s+entregar/iu)) {
          add('deliverables', 'deliverable', 'Entregable', { name: item }, item, chunk.pageNumber);
        }
      }

      const penalty = this.clauseSection(chunk.content, 'PENALIZACIONES');
      if (penalty?.body) {
        add(
          'penalties',
          'penalty',
          'Penalización',
          this.penaltyValueFromEvidence(penalty.body, penalty.heading),
          penalty.body,
          chunk.pageNumber
        );
      }

      const guarantee = this.clauseSection(chunk.content, 'GARANT');
      if (guarantee?.body) {
        add(
          'guarantees',
          'guarantee',
          'Garantía',
          this.guaranteeValueFromEvidence(guarantee.body, guarantee.heading),
          guarantee.body,
          chunk.pageNumber
        );
      }

      const amountSection = this.clauseSection(chunk.content, 'MONTO DEL CONTRATO');
      if (amountSection) {
        for (const line of this.clauseListItems(
          amountSection.body,
          /pago\s+se\s+realizar[aá].*siguiente\s+manera/iu
        )) {
          const payment = this.paymentValueFromEvidence(line);
          if (payment) {
            add('payments', 'payment', 'Pago contractual', payment, line.trim(), chunk.pageNumber);
          }
        }
      }

      const responsibilitySections = [
        {
          keyword: 'RESPONSABILIDADES DEL CONTRATISTA',
          party: 'EL CONTRATISTA',
          intro: /contratista\s+ser[aá]\s+responsable\s+de/iu,
        },
        {
          keyword: 'RESPONSABILIDADES DEL CLIENTE',
          party: 'EL CLIENTE',
          intro: /cliente\s+ser[aá]\s+responsable\s+de/iu,
        },
      ];
      for (const responsibility of responsibilitySections) {
        const section = this.clauseSection(chunk.content, responsibility.keyword);
        if (!section) continue;
        for (const item of this.clauseListItems(section.body, responsibility.intro)) {
          add(
            'obligations',
            'obligation',
            `Obligación de ${responsibility.party}`,
            {
              description: item,
              periodicity: 'once',
              priority: 'medium',
              comments: `Responsable: ${responsibility.party}`,
            },
            item,
            chunk.pageNumber
          );
        }
      }

      const schedule = this.clauseSection(chunk.content, 'PLAZO DE EJECUCIÓN');
      if (schedule) {
        const completion = schedule.body.match(
          /fecha\s+estimada\s+de\s+(?:terminaci[oó]n|determinaci[oó]n)\s+ser[aá]\s+el\s+([^.\n]+)/iu
        );
        const milestoneDate = completion ? this.spanishDate(completion[1]) : undefined;
        if (completion && milestoneDate) {
          add(
            'milestones',
            'milestone',
            'Hito de terminación',
            {
              name: 'Terminación estimada de la obra',
              milestoneDate,
            },
            completion[0],
            chunk.pageNumber
          );
        }
      }
    }
    return facts;
  }

  private clauseListItems(body: string, introduction: RegExp) {
    const lines = body
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const introductionIndex = lines.findIndex((line) => introduction.test(line));
    const candidates = introductionIndex >= 0 ? lines.slice(introductionIndex + 1) : lines;
    const items =
      introductionIndex >= 0 && candidates.length > 1
        ? candidates
        : this.enumeratedItems(candidates.join('\n'));
    return items
      .map((item) => item.replace(/^\s*[*]\s*/u, '').trim())
      .filter((item) => item && !introduction.test(item));
  }

  private splitTrackableFacts(facts: ContractExtractionFact[]) {
    const primaryFields: Partial<
      Record<ContractExtractionFact['category'], 'description' | 'name' | 'concept'>
    > = {
      obligations: 'description',
      deliverables: 'name',
      payments: 'concept',
      milestones: 'name',
      risks: 'description',
    };
    const result: ContractExtractionFact[] = [];

    for (const fact of facts) {
      const primaryField = primaryFields[fact.category];
      if (!primaryField || typeof fact.value !== 'object' || fact.value === null) {
        result.push(fact);
        continue;
      }
      const value = this.asObject(fact.value);
      const primaryValue = this.optionalString(value[primaryField]);
      if (!primaryValue) {
        result.push(fact);
        continue;
      }
      const items = this.enumeratedItems(primaryValue);
      if (items.length < 2) {
        result.push(fact);
        continue;
      }
      items.forEach((item) => {
        result.push({
          ...fact,
          id: randomUUID(),
          label: this.defaultLabel(fact.category, fact.field),
          value: { ...value, [primaryField]: item },
          evidence: item,
        });
      });
    }
    return result;
  }

  private enumeratedItems(value: string) {
    const normalized = value
      .replace(/\r/g, '\n')
      .replace(/\s+(?=(?:\d+|[a-z])[).:-]\s+)/giu, '\n')
      .replace(/\s+(?=[•●▪◦]\s*)/gu, '\n');
    const items = normalized
      .split('\n')
      .map((line) => line.replace(/^\s*(?:(?:\d+|[a-z])[).:-]|[•●▪◦-])\s*/iu, '').trim())
      .filter(Boolean);
    const hasExplicitList =
      /(?:^|\n|\s)(?:\d+|[a-z])[).:-]\s+\S/iu.test(value) ||
      /(?:^|\n|\s)[•●▪◦]\s*\S/u.test(value) ||
      value.split(/\r?\n/u).filter((line) => /^\s*-\s+\S/u.test(line)).length > 1;
    return hasExplicitList ? items : [value.trim()];
  }

  private clauseSection(content: string, keyword: string) {
    const ordinal =
      /(?:^|\n)\s*(?:D[ÉE]CIMA(?:\s*(?:PRIMERA|SEGUNDA|TERCERA|CUARTA))?|PRIMERA|SEGUNDA|TERCERA|CUARTA|QUINTA|SEXTA|S[ÉE]PTIMA|OCTAVA|NOVENA)\.?\s+/gimu;
    const boundaries = [...content.matchAll(ordinal)].map((match) => match.index ?? 0);
    if (!boundaries.length) return undefined;
    const normalizedKeyword = this.normalizeForComparison(keyword);
    const section = boundaries
      .map((start, index) => content.slice(start, boundaries[index + 1] ?? content.length).trim())
      .find((candidate) =>
        this.normalizeForComparison(candidate.slice(0, 180)).includes(normalizedKeyword)
      );
    if (!section) return undefined;
    const keywordMatch = new RegExp(
      keyword
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\s+/g, '\\s+'),
      'iu'
    );
    const comparableSection = section.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const match = comparableSection.match(keywordMatch);
    if (!match || match.index === undefined) return undefined;
    const bodyStart = match.index + match[0].length;
    return {
      heading: section.slice(0, bodyStart).trim(),
      body: section.slice(bodyStart).trim(),
    };
  }

  private spanishDate(value: string) {
    const months: Record<string, string> = {
      enero: '01',
      febrero: '02',
      marzo: '03',
      abril: '04',
      mayo: '05',
      junio: '06',
      julio: '07',
      agosto: '08',
      septiembre: '09',
      setiembre: '09',
      octubre: '10',
      noviembre: '11',
      diciembre: '12',
    };
    const match = this.normalizeForComparison(value).match(
      /^(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})$/u
    );
    if (!match || !months[match[2]]) return undefined;
    return `${match[3]}-${months[match[2]]}-${match[1].padStart(2, '0')}`;
  }

  private normalizeForComparison(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9%]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private validateReviewedFacts(
    facts: ContractExtractionFact[],
    requireComplete: boolean,
    originalFacts: ContractExtractionFact[]
  ) {
    if (!Array.isArray(facts) || facts.length > 500)
      throw new BadRequestException('Borrador invalido.');
    const originals = new Map(originalFacts.map((fact) => [fact.id, fact]));
    if (facts.length !== originals.size || facts.some((fact) => !originals.has(fact.id))) {
      throw new BadRequestException('No puedes agregar ni eliminar hallazgos del borrador.');
    }
    return facts.map((fact) => {
      const original = originals.get(fact.id);
      if (
        !original ||
        original.category !== fact.category ||
        original.field !== fact.field ||
        !ALLOWED_FIELDS[fact.category]?.includes(fact.field)
      ) {
        throw new BadRequestException('El borrador contiene un campo no permitido.');
      }
      if (JSON.stringify(fact.value).length > 10000) {
        throw new BadRequestException('Uno de los valores del borrador es demasiado grande.');
      }
      if (!['pending', 'accepted', 'rejected'].includes(fact.decision)) {
        throw new BadRequestException('Decision de revision invalida.');
      }
      if (requireComplete && fact.decision === 'pending') {
        throw new BadRequestException('Debes aceptar o rechazar todos los datos antes de aprobar.');
      }
      return {
        ...fact,
        label: String(fact.label).slice(0, 200),
        evidence: fact.evidence?.slice(0, 1000),
      };
    });
  }

  private deduplicateFacts(facts: ContractExtractionFact[]) {
    const seen = new Set<string>();
    return facts.filter((fact) => {
      const key = `${fact.category}:${fact.field}:${JSON.stringify(fact.value)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private applyScalarFacts(contract: Contract, facts: ContractExtractionFact[]) {
    for (const fact of facts) {
      if (!['general', 'dates', 'parties'].includes(fact.category)) continue;
      const value = fact.value;
      if (fact.field === 'name' && typeof value === 'string' && value.trim())
        contract.name = value.trim().slice(0, 180);
      if (fact.field === 'contractType' && typeof value === 'string')
        contract.contractType = value.slice(0, 100);
      if (fact.field === 'responsibleArea' && typeof value === 'string')
        contract.responsibleArea = value.slice(0, 160);
      if (fact.field === 'clientName' && typeof value === 'string')
        contract.clientName = value.slice(0, 180);
      if (fact.field === 'supplierName' && typeof value === 'string')
        contract.supplierName = value.slice(0, 180);
      if (fact.field === 'startDate' && this.isoDate(value))
        contract.startDate = this.isoDate(value);
      if (fact.field === 'endDate' && this.isoDate(value)) contract.endDate = this.isoDate(value);
      if (fact.field === 'renewalDate' && this.isoDate(value))
        contract.renewalDate = this.isoDate(value);
      if (fact.field === 'amount' && this.decimal(value)) contract.amount = this.decimal(value);
      if (fact.field === 'currency') contract.currency = this.currency(value) ?? contract.currency;
      if (fact.field === 'renewable') contract.renewable = value === true || value === 'true';
      if (fact.field === 'renewalNoticeDays' && Number.isFinite(Number(value)))
        contract.renewalNoticeDays = Math.max(0, Math.round(Number(value)));
    }
  }

  private async findRun(contractId: string, versionId: string) {
    const run = await this.runs.findOne({ where: { contractId, versionId } });
    if (!run) throw new NotFoundException('No existe procesamiento para esta version.');
    return run;
  }

  private async findAttachmentRun(contractId: string, attachmentId: string) {
    const run = await this.runs.findOne({ where: { contractId, attachmentId } });
    if (!run) throw new NotFoundException('No existe procesamiento para este anexo.');
    return run;
  }

  private shouldStartOrResume(run: ContractExtractionRun) {
    if (run.status === 'queued') return true;
    if (run.status !== 'processing') return false;
    const updatedAt = run.updatedAt ? new Date(run.updatedAt).getTime() : 0;
    return updatedAt < Date.now() - PROCESSING_STALE_MS;
  }

  private assertUploader(run: ContractExtractionRun, userId: string) {
    if (run.uploadedById !== userId)
      throw new ForbiddenException('Solo la persona que cargo la version puede aprobarla.');
  }

  private serialize(run: ContractExtractionRun) {
    return {
      id: run.id,
      contractId: run.contractId,
      versionId: run.versionId,
      attachmentId: run.attachmentId,
      uploadedById: run.uploadedById,
      status: run.status,
      progressPercent: run.progressPercent ?? 0,
      processingStage: run.processingStage ?? run.status,
      facts: run.facts ?? [],
      checkpoint: run.checkpoint
        ? {
            stage: run.checkpoint.stage,
            completedBatches: Object.keys(run.checkpoint.batches ?? {}).length,
            totalBatches: run.checkpoint.totalBatches,
            savedAt: run.checkpoint.savedAt,
          }
        : undefined,
      error: run.error,
      modelName: run.modelName,
      processedAt: run.processedAt,
      approvedAt: run.approvedAt,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  }

  private contractSnapshot(contract: Contract) {
    return {
      name: contract.name,
      contractType: contract.contractType,
      responsibleArea: contract.responsibleArea,
      clientName: contract.clientName,
      supplierName: contract.supplierName,
      startDate: contract.startDate,
      endDate: contract.endDate,
      renewalDate: contract.renewalDate,
      amount: contract.amount,
      currency: contract.currency,
      renewable: contract.renewable,
      renewalNoticeDays: contract.renewalNoticeDays,
    };
  }

  private async updateProgress(runId: string, progressPercent: number, processingStage: string) {
    await this.runs.update(
      { id: runId },
      {
        progressPercent: Math.max(0, Math.min(100, Math.round(progressPercent))),
        processingStage,
      }
    );
  }

  async deleteAttachmentIndex(contractId: string, attachmentId: string) {
    await this.textIndexes.delete({ contractId, attachmentId });
  }

  private defaultLabel(category: string, field: string) {
    const labels: Record<string, string> = {
      name: 'Nombre del contrato',
      contractType: 'Tipo de contrato',
      responsibleArea: 'Area responsable',
      amount: 'Importe contractual',
      currency: 'Moneda',
      renewable: 'Renovacion automatica',
      renewalNoticeDays: 'Dias de aviso para renovacion',
      startDate: 'Fecha de inicio',
      endDate: 'Fecha de terminacion',
      renewalDate: 'Fecha de renovacion',
      clientName: 'Cliente',
      supplierName: 'Proveedor',
      obligation: 'Obligacion',
      payment: 'Pago',
      milestone: 'Hito',
      risk: 'Riesgo contractual',
      penalty: 'Penalización contractual',
      guarantee: 'Garantía contractual',
      deliverable: 'Entregable contractual',
    };
    return labels[field] ?? `${category}: ${field}`;
  }

  private asObject(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private optionalString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private isoDate(value: unknown) {
    if (typeof value !== 'string') return undefined;
    const match = value.match(/^\d{4}-\d{2}-\d{2}$/);
    return match ? match[0] : undefined;
  }

  private decimal(value: unknown) {
    const normalized = String(value ?? '').replace(/[^0-9.-]/g, '');
    const amount = Number(normalized);
    return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : undefined;
  }

  private percentage(value: unknown) {
    const normalized = String(value ?? '')
      .replace(/[^0-9.,-]/g, '')
      .replace(',', '.');
    const percentage = Number(normalized);
    return Number.isFinite(percentage) && percentage >= 0 && percentage <= 100
      ? percentage.toFixed(4)
      : undefined;
  }

  private nonNegativeInteger(value: unknown) {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
  }

  private currency(value: unknown) {
    const normalized = String(value ?? '')
      .trim()
      .toUpperCase();
    return /^[A-Z]{3}$/.test(normalized) ? normalized : undefined;
  }

  private tokens(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  private cosine(left: number[], right: number[]) {
    if (!left.length || left.length !== right.length) return 0;
    return left.reduce((sum, value, index) => sum + value * (right[index] ?? 0), 0);
  }
}
