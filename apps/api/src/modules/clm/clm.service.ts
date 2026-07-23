import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'crypto';
import { Repository, Brackets, FindOptionsWhere, In, IsNull, Like } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { StorageService } from '../../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DocumentRecord } from '../documents/document.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { AskContractQueryDto } from './dto/ask-contract-query.dto';
import { AssignTagsDto } from './dto/assign-tags.dto';
import { BatchActionDto } from './dto/batch-action.dto';
import { CloseContractDto } from './dto/close-contract.dto';
import { ContractSearchDto } from './dto/contract-search.dto';
import { CreateAmendmentDto } from './dto/create-amendment.dto';
import { CreateContractAttachmentDto } from './dto/create-contract-attachment.dto';
import { CreateContractAttachmentVersionDto } from './dto/create-contract-attachment-version.dto';
import { CreateContractCommentDto } from './dto/create-contract-comment.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateContractMilestoneDto } from './dto/create-contract-milestone.dto';
import { CreateContractObligationDto } from './dto/create-contract-obligation.dto';
import { CreateContractVersionDto } from './dto/create-contract-version.dto';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { CreateNegotiationDto } from './dto/create-negotiation.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreateSignatureRequestDto } from './dto/create-signature-request.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateClauseDto } from './dto/create-clause.dto';
import { ImportContractsDto } from './dto/import-contracts.dto';
import { RenewContractDto } from './dto/renew-contract.dto';
import { SetCustomValueDto } from './dto/set-custom-value.dto';
import { UpdateAmendmentDto } from './dto/update-amendment.dto';
import { UpdateContractMilestoneDto } from './dto/update-contract-milestone.dto';
import { UpdateContractObligationDto } from './dto/update-contract-obligation.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { UpdateNegotiationDto } from './dto/update-negotiation.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { UpdateLifecycleStageDto } from './dto/update-lifecycle-stage.dto';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';
import { CreateContractRequestDto } from './dto/create-contract-request.dto';
import { ReviewContractRequestDto } from './dto/review-contract-request.dto';
import { ContractAmendment } from './entities/contract-amendment.entity';
import { ContractClause } from './entities/contract-clause.entity';
import { ContractCustomField } from './entities/contract-custom-field.entity';
import { ContractCustomValue } from './entities/contract-custom-value.entity';
import { ContractImportLog } from './entities/contract-import-log.entity';
import { ContractLifecycleEvent } from './entities/contract-lifecycle-event.entity';
import { ContractNegotiation } from './entities/contract-negotiation.entity';
import { ContractPayment } from './entities/contract-payment.entity';
import { ContractSignatureRequest } from './entities/contract-signature-request.entity';
import { ContractTemplate } from './entities/contract-template.entity';
import { ContractRequest } from './entities/contract-request.entity';
import { Counterparty } from './entities/counterparty.entity';
import { CounterpartyContact } from './entities/counterparty-contact.entity';
import { CounterpartyDocument } from './entities/counterparty-document.entity';
import { ContractTextIndex } from './entities/contract-text-index.entity';
import { Tag } from './entities/tag.entity';
import { SignatureProvider } from './signature/signature-provider.interface';
import { ReportGeneratorService } from './reports/report-generator.service';
import { ReportType } from './reports/report-types';
import { ErpIntegration } from './integration/erp-integration.interface';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractAuditLog } from './contract-audit-log.entity';
import { ContractComment } from './contract-comment.entity';
import { ContractMilestone } from './contract-milestone.entity';
import { ContractObligation } from './contract-obligation.entity';
import { ContractVersion } from './contract-version.entity';
import { Contract } from './contract.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { ContractExtractionService } from './contract-extraction.service';
import { ContractExtractionFact } from './entities/contract-extraction-run.entity';
import { AskGotaQueryDto } from './dto/ask-gota-query.dto';
import {
  CreateContractDeliverableDto,
  UpdateContractDeliverableDto,
} from './dto/contract-deliverable.dto';
import { ContractDeliverable } from './entities/contract-deliverable.entity';

const CONTRACT_SOON_DAYS = 30;

const LIFECYCLE_TRANSITIONS: Record<string, string[]> = {
  request: ['drafting'],
  drafting: ['internal_review', 'request'],
  internal_review: ['negotiation', 'approval', 'drafting'],
  negotiation: ['approval', 'internal_review'],
  approval: ['signature', 'negotiation', 'internal_review'],
  signature: ['active', 'approval'],
  active: ['obligations_tracking', 'renewal_modification_termination'],
  obligations_tracking: ['renewal_modification_termination', 'archived'],
  renewal_modification_termination: ['active', 'signature', 'archived'],
  archived: ['obligations_tracking'],
};

const STATUS_TRANSITIONS: Record<Contract['status'], Contract['status'][]> = {
  draft: ['in_review', 'closed'],
  in_review: ['approved', 'draft', 'closed'],
  approved: ['active', 'in_review', 'closed'],
  active: ['expiring_soon', 'renewed', 'closed'],
  expiring_soon: ['renewed', 'closed'],
  expired: ['renewed', 'closed'],
  renewed: ['active', 'closed'],
  closed: ['renewed'],
};

@Injectable()
export class ClmService {
  private readonly logger = new Logger(ClmService.name);

  constructor(
    @InjectRepository(Contract) private readonly contracts: Repository<Contract>,
    @InjectRepository(ContractVersion) private readonly versions: Repository<ContractVersion>,
    @InjectRepository(ContractAttachment)
    private readonly attachments: Repository<ContractAttachment>,
    @InjectRepository(ContractObligation)
    private readonly obligations: Repository<ContractObligation>,
    @InjectRepository(ContractMilestone) private readonly milestones: Repository<ContractMilestone>,
    @InjectRepository(ContractDeliverable)
    private readonly deliverables: Repository<ContractDeliverable>,
    @InjectRepository(ContractComment) private readonly comments: Repository<ContractComment>,
    @InjectRepository(ContractAuditLog) private readonly auditLogs: Repository<ContractAuditLog>,
    @InjectRepository(ContractAmendment)
    private readonly amendmentsRepo: Repository<ContractAmendment>,
    @InjectRepository(ContractPayment) private readonly paymentsRepo: Repository<ContractPayment>,
    @InjectRepository(ContractSignatureRequest)
    private readonly signaturesRepo: Repository<ContractSignatureRequest>,
    @InjectRepository(ContractNegotiation)
    private readonly negotiationsRepo: Repository<ContractNegotiation>,
    @InjectRepository(ContractTemplate)
    private readonly templatesRepo: Repository<ContractTemplate>,
    @InjectRepository(ContractClause) private readonly clausesRepo: Repository<ContractClause>,
    @InjectRepository(ContractCustomField)
    private readonly customFieldsRepo: Repository<ContractCustomField>,
    @InjectRepository(ContractCustomValue)
    private readonly customValuesRepo: Repository<ContractCustomValue>,
    @InjectRepository(ContractImportLog)
    private readonly importLogsRepo: Repository<ContractImportLog>,
    @InjectRepository(Tag) private readonly tagsRepo: Repository<Tag>,
    @InjectRepository(DocumentRecord) private readonly documents: Repository<DocumentRecord>,
    @InjectRepository(DocumentVersion)
    private readonly documentVersions: Repository<DocumentVersion>,
    @InjectRepository(Counterparty)
    private readonly counterpartiesRepo: Repository<Counterparty>,
    @InjectRepository(CounterpartyContact)
    private readonly counterpartyContactsRepo: Repository<CounterpartyContact>,
    @InjectRepository(CounterpartyDocument)
    private readonly counterpartyDocumentsRepo: Repository<CounterpartyDocument>,
    @InjectRepository(ContractRequest)
    private readonly requestsRepo: Repository<ContractRequest>,
    @InjectRepository(ContractTextIndex)
    private readonly textIndexRepo: Repository<ContractTextIndex>,
    @InjectRepository(ContractLifecycleEvent)
    private readonly lifecycleEventsRepo: Repository<ContractLifecycleEvent>,
    private readonly scope: AccessScopeService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    private readonly reportGenerator: ReportGeneratorService,
    private readonly contractExtraction: ContractExtractionService,
    @Inject('SIGNATURE_PROVIDER') private readonly signatureProvider: SignatureProvider,
    @Inject('ERP_INTEGRATION') private readonly erpIntegration: ErpIntegration
  ) {}

  async list(userId: string, search?: ContractSearchDto) {
    const projectIds = search?.projectId
      ? [search.projectId]
      : await this.scope.visibleProjectIdsForUser(userId);
    if (search?.projectId && !(await this.scope.canAccessProject(userId, search.projectId))) {
      throw new ForbiddenException('No tienes acceso a este centro de costos');
    }
    if (!projectIds.length) {
      return [];
    }

    const query = this.contracts
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.project', 'project')
      .leftJoinAndSelect('c.responsibleUser', 'responsibleUser')
      .leftJoinAndSelect('c.mainDocument', 'mainDocument')
      .leftJoinAndSelect('c.tags', 'tags')
      .where('c.projectId IN (:...projectIds)', { projectIds })
      .andWhere('c.deletedAt IS NULL');

    if (search?.search) {
      const term = `%${search.search}%`;
      query.andWhere(
        new Brackets((qb) => {
          qb.where('c.name LIKE :term', { term })
            .orWhere('c.supplierName LIKE :term', { term })
            .orWhere('c.clientName LIKE :term', { term })
            .orWhere('c.contractType LIKE :term', { term });
        })
      );
    }

    if (search?.status) {
      const statuses = search.status.split(',');
      query.andWhere('c.status IN (:...statuses)', { statuses });
    }

    if (search?.contractType) {
      query.andWhere('c.contractType = :contractType', { contractType: search.contractType });
    }

    if (search?.tagId) {
      query
        .innerJoin('contract_tags', 'ct', 'ct.contract_id = c.id')
        .andWhere('ct.tag_id = :tagId', { tagId: search.tagId });
    }

    if (search?.dateFrom) {
      query.andWhere('c.endDate >= :dateFrom', { dateFrom: search.dateFrom });
    }

    if (search?.dateTo) {
      query.andWhere('c.endDate <= :dateTo', { dateTo: search.dateTo });
    }

    if (search?.amountMin) {
      query.andWhere('c.amount >= :amountMin', { amountMin: search.amountMin });
    }

    if (search?.amountMax) {
      query.andWhere('c.amount <= :amountMax', { amountMax: search.amountMax });
    }

    if (search?.responsibleUserId) {
      query.andWhere('c.responsibleUserId = :responsibleUserId', {
        responsibleUserId: search.responsibleUserId,
      });
    }

    const sortBy = search?.sortBy ?? 'updatedAt';
    const sortOrder = search?.sortOrder ?? 'DESC';
    query.orderBy(`c.${sortBy}`, sortOrder);

    const items = await query.getMany();
    return Promise.all(items.map((contract) => this.toListItem(contract)));
  }

  async create(userId: string, dto: CreateContractDto) {
    await this.assertProjectAccess(userId, dto.projectId);
    if (
      dto.lifecycleStage &&
      !Object.prototype.hasOwnProperty.call(LIFECYCLE_TRANSITIONS, dto.lifecycleStage)
    ) {
      throw new BadRequestException(`Etapa de ciclo de vida no reconocida: ${dto.lifecycleStage}`);
    }
    await this.assertDocumentBelongsToProject(dto.projectId, dto.mainDocumentId);

    const contract = await this.contracts.save(
      this.contracts.create({
        ...dto,
        endDate: dto.endDate,
        renewalDate: dto.renewalDate,
        renewalNoticeDays: dto.renewalNoticeDays ? Number(dto.renewalNoticeDays) : 30,
        alertDaysBefore: dto.renewalNoticeDays ? Number(dto.renewalNoticeDays) : 30,
        createdById: userId,
        status: this.normalizeStatus(dto.status, dto.endDate),
      })
    );

    await this.log(contract.id, userId, 'create', undefined, {
      name: contract.name,
      status: contract.status,
    });

    await this.syncAlerts(contract);
    return this.getDetail(userId, contract.id, false);
  }

  async getDetail(userId: string, contractId: string, logView = true) {
    const contract = await this.assertContractAccess(userId, contractId);
    const loaders = {
      versions: () =>
        this.versions.find({
          where: { contractId },
          relations: ['uploadedBy'],
          order: { createdAt: 'DESC' },
        }),
      attachments: () =>
        this.attachments.find({
          where: { contractId },
          relations: ['uploadedBy'],
          order: { createdAt: 'DESC' },
        }),
      obligations: () =>
        this.obligations.find({
          where: { contractId },
          relations: ['responsibleUser', 'evidenceDocument'],
          order: { createdAt: 'DESC' },
        }),
      milestones: () =>
        this.milestones.find({
          where: { contractId },
          relations: ['responsibleUser', 'evidenceDocument'],
          order: { milestoneDate: 'ASC' },
        }),
      deliverables: () =>
        this.deliverables.find({
          where: { contractId },
          relations: ['responsibleUser'],
          order: { dueDate: 'ASC', createdAt: 'DESC' },
        }),
      comments: () =>
        this.comments.find({
          where: { contractId },
          relations: ['author'],
          order: { createdAt: 'DESC' },
        }),
      audit: () =>
        this.auditLogs.find({
          where: { contractId },
          relations: ['actor'],
          order: { createdAt: 'DESC' },
        }),
      amendments: () =>
        this.amendmentsRepo.find({ where: { contractId }, order: { createdAt: 'DESC' } }),
      payments: () =>
        this.paymentsRepo.find({ where: { contractId }, order: { createdAt: 'DESC' } }),
      signatures: () =>
        this.signaturesRepo.find({
          where: { contractId },
          relations: ['createdBy', 'version', 'attachment'],
          order: { createdAt: 'DESC' },
        }),
      negotiations: () =>
        this.negotiationsRepo.find({
          where: { contractId },
          relations: ['createdBy'],
          order: { createdAt: 'DESC' },
        }),
      tags: () =>
        this.tagsRepo
          .createQueryBuilder('t')
          .innerJoin('contract_tags', 'ct', 'ct.tag_id = t.id')
          .where('ct.contract_id = :contractId', { contractId })
          .getMany(),
      customValues: () =>
        this.customValuesRepo.find({ where: { contractId }, relations: ['field'] }),
      children: () =>
        this.contracts.find({
          where: { parentContractId: contractId },
          order: { createdAt: 'DESC' },
        }),
      lifecycleHistory: () =>
        this.lifecycleEventsRepo.find({
          where: { contractId },
          relations: ['changedBy', 'relatedDocument', 'relatedVersion'],
          order: { createdAt: 'ASC' },
        }),
    };

    const loaderEntries = Object.entries(loaders);
    const settledSections = await Promise.allSettled(loaderEntries.map(([, loader]) => loader()));
    const loadedSections: Record<string, unknown[]> = {};
    const sectionErrors: Record<string, string> = {};

    settledSections.forEach((result, index) => {
      const section = loaderEntries[index][0];
      if (result.status === 'fulfilled') {
        loadedSections[section] = result.value;
        return;
      }

      loadedSections[section] = [];
      sectionErrors[section] =
        'No se pudo cargar esta sección. Puedes reintentar sin perder el resto.';
      this.logger.error(
        `Error loading CLM detail section ${section} for contract ${contractId}`,
        result.reason instanceof Error ? result.reason.stack : String(result.reason)
      );
    });

    const versions = loadedSections.versions as ContractVersion[];
    const attachments = loadedSections.attachments as ContractAttachment[];
    const obligations = loadedSections.obligations as ContractObligation[];
    const milestones = loadedSections.milestones as ContractMilestone[];
    const deliverables = loadedSections.deliverables as ContractDeliverable[];
    const comments = loadedSections.comments as ContractComment[];
    const audit = loadedSections.audit as ContractAuditLog[];
    const amendments = loadedSections.amendments as ContractAmendment[];
    const payments = loadedSections.payments as ContractPayment[];
    const signatures = loadedSections.signatures as ContractSignatureRequest[];
    const negotiations = loadedSections.negotiations as ContractNegotiation[];
    const tags = loadedSections.tags as Tag[];
    const customValues = loadedSections.customValues as ContractCustomValue[];
    const children = loadedSections.children as Contract[];
    const lifecycleHistory = loadedSections.lifecycleHistory as ContractLifecycleEvent[];

    if (logView) {
      try {
        await this.log(contractId, userId, 'view');
      } catch (error) {
        sectionErrors.activityLog = 'La vista se cargó, pero no se pudo registrar en auditoría.';
        this.logger.error(
          `Error logging CLM contract view for ${contractId}`,
          error instanceof Error ? error.stack : String(error)
        );
      }
    }

    const currentVersion =
      versions.find((item) => item.id === contract.currentVersionId) ?? versions[0] ?? null;

    return {
      ...(await this.toListItem(contract)),
      currentVersion,
      versions,
      attachments,
      obligations,
      milestones,
      deliverables,
      comments: comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        createdAt: comment.createdAt,
        author: comment.author
          ? { id: comment.author.id, name: comment.author.name, email: comment.author.email }
          : null,
      })),
      audit,
      amendments,
      payments,
      signatures: signatures.map((s) => ({
        id: s.id,
        versionId: s.versionId,
        attachmentId: s.attachmentId,
        provider: s.provider,
        status: s.status,
        signersJson: s.signersJson,
        signedAt: s.signedAt,
        createdAt: s.createdAt,
        createdBy: s.createdBy ? { id: s.createdBy.id, name: s.createdBy.name } : null,
        version: s.version
          ? {
              id: s.version.id,
              versionLabel: s.version.versionLabel,
              fileName: s.version.fileName,
            }
          : null,
        attachment: s.attachment
          ? {
              id: s.attachment.id,
              name: s.attachment.name,
              versionLabel: s.attachment.versionLabel,
              fileName: s.attachment.fileName,
            }
          : null,
      })),
      negotiations,
      tags,
      customValues,
      lifecycleHistory,
      childrenContracts: children.map((c) => ({ id: c.id, name: c.name, status: c.status })),
      isPartial: Object.keys(sectionErrors).length > 0,
      sectionErrors,
    };
  }

  async update(userId: string, contractId: string, dto: UpdateContractDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    if (dto.status && dto.status !== contract.status) {
      this.assertStatusTransition(contract.status, dto.status);
    }
    await this.assertDocumentBelongsToProject(contract.projectId, dto.mainDocumentId);
    const before = { ...contract };

    const contractFields = { ...dto };
    delete contractFields.lifecycleStage;
    Object.assign(contract, {
      ...contractFields,
      renewalNoticeDays: dto.renewalNoticeDays
        ? Number(dto.renewalNoticeDays)
        : contract.renewalNoticeDays,
      alertDaysBefore: dto.renewalNoticeDays
        ? Number(dto.renewalNoticeDays)
        : contract.alertDaysBefore,
    });
    contract.status = this.normalizeStatus(
      dto.status ?? contract.status,
      dto.endDate ?? contract.endDate
    );

    await this.contracts.save(contract);
    await this.log(
      contractId,
      userId,
      'edit',
      this.snapshotContract(before),
      this.snapshotContract(contract)
    );
    await this.syncAlerts(contract);
    return this.getDetail(userId, contractId, false);
  }

  async createVersion(userId: string, contractId: string, dto: CreateContractVersionDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    const previousVersionId = contract.currentVersionId;
    let stored: { fileKey: string; sizeBytes: number };
    if (dto.fileKey) {
      const buffer = await this.storage.read(dto.fileKey);
      stored = { fileKey: dto.fileKey, sizeBytes: buffer.byteLength };
    } else if (dto.base64Content) {
      stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);
    } else {
      throw new BadRequestException('Selecciona el archivo del contrato.');
    }
    const version = await this.versions.save(
      this.versions.create({
        contractId,
        versionLabel: dto.versionLabel,
        fileKey: stored.fileKey,
        fileName: dto.fileName,
        fileExtension: this.getExtension(dto.fileName),
        mimeType: dto.mimeType,
        sizeBytes: Number(dto.sizeBytes ?? stored.sizeBytes),
        uploadedById: userId,
        changeSummary: dto.changeSummary,
      })
    );
    contract.currentVersionId = version.id;
    if (!contract.status || contract.status === 'draft') {
      contract.status = 'in_review';
    }
    await this.contracts.save(contract);
    await this.log(
      contractId,
      userId,
      'upload_new_version',
      { previousVersionId },
      { versionId: version.id }
    );
    const extraction = await this.contractExtraction.createAndStart(contractId, version.id, userId);
    return {
      ...(await this.getDetail(userId, contractId, false)),
      createdVersionId: version.id,
      extractionRunId: extraction.id,
      extractionStatus: extraction.status,
    };
  }

  async getVersionExtraction(userId: string, contractId: string, versionId: string) {
    await this.assertContractAccess(userId, contractId);
    return this.contractExtraction.get(contractId, versionId);
  }

  async startVersionExtraction(userId: string, contractId: string, versionId: string) {
    await this.assertContractAccess(userId, contractId);
    const version = await this.versions.findOne({ where: { id: versionId, contractId } });
    if (!version) throw new NotFoundException('Version no encontrada');
    return this.contractExtraction.createAndStart(
      contractId,
      versionId,
      version.uploadedById ?? userId
    );
  }

  async retryVersionExtraction(userId: string, contractId: string, versionId: string) {
    await this.assertContractAccess(userId, contractId);
    return this.contractExtraction.retry(contractId, versionId, userId);
  }

  async updateVersionExtraction(
    userId: string,
    contractId: string,
    versionId: string,
    facts: ContractExtractionFact[]
  ) {
    await this.assertContractAccess(userId, contractId);
    return this.contractExtraction.updateDraft(contractId, versionId, userId, facts);
  }

  async approveVersionExtraction(
    userId: string,
    contractId: string,
    versionId: string,
    password: string,
    facts: ContractExtractionFact[]
  ) {
    await this.assertContractAccess(userId, contractId);
    const result = await this.contractExtraction.approve(
      contractId,
      versionId,
      userId,
      password,
      facts
    );
    const contract = await this.contracts.findOne({ where: { id: contractId } });
    if (contract) await this.syncAlerts(contract);
    return result;
  }

  async getAttachmentExtraction(userId: string, contractId: string, attachmentId: string) {
    await this.assertContractAccess(userId, contractId);
    return this.contractExtraction.getAttachmentExtraction(contractId, attachmentId);
  }

  async startAttachmentExtraction(userId: string, contractId: string, attachmentId: string) {
    await this.assertContractAccess(userId, contractId);
    const attachment = await this.attachments.findOne({ where: { id: attachmentId, contractId } });
    if (!attachment) throw new NotFoundException('Anexo no encontrado');
    return this.contractExtraction.createAttachmentAndStart(
      contractId,
      attachmentId,
      attachment.uploadedById ?? userId
    );
  }

  async retryAttachmentExtraction(userId: string, contractId: string, attachmentId: string) {
    await this.assertContractAccess(userId, contractId);
    return this.contractExtraction.retryAttachment(contractId, attachmentId, userId);
  }

  async updateAttachmentExtraction(
    userId: string,
    contractId: string,
    attachmentId: string,
    facts: ContractExtractionFact[]
  ) {
    await this.assertContractAccess(userId, contractId);
    return this.contractExtraction.updateAttachmentDraft(contractId, attachmentId, userId, facts);
  }

  async approveAttachmentExtraction(
    userId: string,
    contractId: string,
    attachmentId: string,
    password: string,
    facts: ContractExtractionFact[]
  ) {
    await this.assertContractAccess(userId, contractId);
    const result = await this.contractExtraction.approveAttachment(
      contractId,
      attachmentId,
      userId,
      password,
      facts
    );
    const contract = await this.contracts.findOne({ where: { id: contractId } });
    if (contract) await this.syncAlerts(contract);
    return result;
  }

  async getVersionFile(userId: string, contractId: string, versionId: string) {
    await this.assertContractAccess(userId, contractId);
    const version = await this.versions.findOne({ where: { id: versionId, contractId } });
    if (!version) throw new NotFoundException('Version no encontrada');

    return {
      buffer: await this.storage.read(version.fileKey),
      fileName: version.fileName,
      mimeType: version.mimeType || 'application/octet-stream',
    };
  }

  async addAttachment(userId: string, contractId: string, dto: CreateContractAttachmentDto) {
    await this.assertContractAccess(userId, contractId);
    const stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);
    const attachmentGroupId = randomUUID();
    const attachment = await this.attachments.save(
      this.attachments.create({
        contractId,
        name: dto.name,
        attachmentGroupId,
        versionLabel: '1',
        isCurrent: true,
        fileKey: stored.fileKey,
        fileName: dto.fileName,
        fileExtension: this.getExtension(dto.fileName),
        mimeType: dto.mimeType,
        sizeBytes: Number(dto.sizeBytes ?? stored.sizeBytes),
        uploadedById: userId,
        notes: dto.notes,
      })
    );
    await this.log(contractId, userId, 'add_attachment', undefined, {
      attachmentId: attachment.id,
      fileName: attachment.fileName,
    });
    await this.contractExtraction.createAttachmentAndStart(contractId, attachment.id, userId);
    return this.getDetail(userId, contractId, false);
  }

  async addAttachmentVersion(
    userId: string,
    contractId: string,
    attachmentId: string,
    dto: CreateContractAttachmentVersionDto
  ) {
    await this.assertContractAccess(userId, contractId);
    const attachment = await this.attachments.findOne({ where: { id: attachmentId, contractId } });
    if (!attachment) throw new NotFoundException('Anexo no encontrado');

    const attachmentGroupId = attachment.attachmentGroupId || attachment.id;
    const duplicateLabel = await this.attachments.findOne({
      where: { contractId, attachmentGroupId, versionLabel: dto.versionLabel },
    });
    if (duplicateLabel) {
      throw new BadRequestException(`La versión ${dto.versionLabel} ya existe para este anexo`);
    }
    const stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);
    await this.attachments.update({ contractId, attachmentGroupId }, { isCurrent: false });
    const version = await this.attachments.save(
      this.attachments.create({
        contractId,
        name: attachment.name,
        attachmentGroupId,
        versionLabel: dto.versionLabel,
        isCurrent: true,
        fileKey: stored.fileKey,
        fileName: dto.fileName,
        fileExtension: this.getExtension(dto.fileName),
        mimeType: dto.mimeType,
        sizeBytes: Number(dto.sizeBytes ?? stored.sizeBytes),
        uploadedById: userId,
        notes: dto.notes,
      })
    );
    await this.log(contractId, userId, 'add_attachment_version', undefined, {
      attachmentGroupId,
      previousVersionId: attachment.id,
      attachmentVersionId: version.id,
      versionLabel: version.versionLabel,
      fileName: version.fileName,
    });
    await this.contractExtraction.createAttachmentAndStart(contractId, version.id, userId);
    return this.getDetail(userId, contractId, false);
  }

  async getAttachmentFile(userId: string, contractId: string, attachmentId: string) {
    await this.assertContractAccess(userId, contractId);
    const attachment = await this.attachments.findOne({
      where: { id: attachmentId, contractId },
    });
    if (!attachment) throw new NotFoundException('Adjunto no encontrado');

    return {
      buffer: await this.storage.read(attachment.fileKey),
      fileName: attachment.fileName,
      mimeType: attachment.mimeType || 'application/octet-stream',
    };
  }

  async addObligation(userId: string, contractId: string, dto: CreateContractObligationDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    await this.assertDocumentBelongsToProject(contract.projectId, dto.evidenceDocumentId);
    const obligation = await this.obligations.save(
      this.obligations.create({
        contractId,
        description: dto.description,
        responsibleUserId: dto.responsibleUserId,
        commitmentDate: dto.commitmentDate,
        status: this.normalizeObligationStatus(dto.status, dto.commitmentDate),
        evidenceDocumentId: dto.evidenceDocumentId,
        comments: dto.comments,
        alertDaysBefore: dto.alertDaysBefore ?? 14,
      })
    );
    await this.log(contractId, userId, 'add_obligation', undefined, {
      obligationId: obligation.id,
      description: obligation.description,
    });
    await this.syncAlerts(contract);
    return this.getDetail(userId, contractId, false);
  }

  async updateObligation(
    userId: string,
    contractId: string,
    obligationId: string,
    dto: UpdateContractObligationDto
  ) {
    const contract = await this.assertContractAccess(userId, contractId);
    const obligation = await this.obligations.findOne({ where: { id: obligationId, contractId } });
    if (!obligation) throw new NotFoundException('Obligacion no encontrada');
    await this.assertDocumentBelongsToProject(contract.projectId, dto.evidenceDocumentId);
    const before = { ...obligation };
    Object.assign(obligation, dto);
    obligation.status = this.normalizeObligationStatus(
      dto.status ?? obligation.status,
      dto.commitmentDate ?? obligation.commitmentDate
    );
    await this.obligations.save(obligation);
    await this.log(
      contractId,
      userId,
      'edit_obligation',
      before as Record<string, unknown>,
      obligation as unknown as Record<string, unknown>
    );
    await this.syncAlerts(contract);
    return this.getDetail(userId, contractId, false);
  }

  async addMilestone(userId: string, contractId: string, dto: CreateContractMilestoneDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    await this.assertDocumentBelongsToProject(contract.projectId, dto.evidenceDocumentId);
    const milestone = await this.milestones.save(
      this.milestones.create({
        contractId,
        name: dto.name,
        milestoneDate: dto.milestoneDate,
        responsibleUserId: dto.responsibleUserId,
        status: dto.status ?? 'pending',
        evidenceDocumentId: dto.evidenceDocumentId,
        notes: dto.notes,
        alertDaysBefore: dto.alertDaysBefore ?? 7,
      })
    );
    await this.log(contractId, userId, 'add_milestone', undefined, {
      milestoneId: milestone.id,
      name: milestone.name,
    });
    await this.syncAlerts(contract);
    return this.getDetail(userId, contractId, false);
  }

  async updateMilestone(
    userId: string,
    contractId: string,
    milestoneId: string,
    dto: UpdateContractMilestoneDto
  ) {
    const contract = await this.assertContractAccess(userId, contractId);
    const milestone = await this.milestones.findOne({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Hito no encontrado');
    await this.assertDocumentBelongsToProject(contract.projectId, dto.evidenceDocumentId);
    const before = { ...milestone };
    Object.assign(milestone, dto);
    if (milestone.status === 'completed' && !milestone.completedAt)
      milestone.completedAt = new Date();
    if (milestone.status !== 'completed') milestone.completedAt = undefined;
    await this.milestones.save(milestone);
    await this.log(
      contractId,
      userId,
      'edit_milestone',
      before as Record<string, unknown>,
      milestone as unknown as Record<string, unknown>
    );
    await this.syncAlerts(contract);
    return this.getDetail(userId, contractId, false);
  }

  async addDeliverable(userId: string, contractId: string, dto: CreateContractDeliverableDto) {
    await this.assertContractAccess(userId, contractId);
    const deliverable = await this.deliverables.save(
      this.deliverables.create({
        ...dto,
        dueDate: dto.dueDate || undefined,
        contractId,
        status: dto.status ?? 'pending',
      })
    );
    await this.log(contractId, userId, 'add_deliverable', undefined, {
      deliverableId: deliverable.id,
      name: deliverable.name,
    });
    return this.getDetail(userId, contractId, false);
  }

  async updateDeliverable(
    userId: string,
    contractId: string,
    deliverableId: string,
    dto: UpdateContractDeliverableDto
  ) {
    await this.assertContractAccess(userId, contractId);
    const deliverable = await this.deliverables.findOne({
      where: { id: deliverableId, contractId },
    });
    if (!deliverable) throw new NotFoundException('Entregable no encontrado');
    const before = { ...deliverable };
    Object.assign(deliverable, {
      ...dto,
      ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate || undefined } : {}),
    });
    if (dto.status === 'delivered' && !deliverable.deliveredAt)
      deliverable.deliveredAt = new Date();
    if (dto.status === 'accepted' && !deliverable.acceptedAt) deliverable.acceptedAt = new Date();
    if (dto.status && !['delivered', 'accepted'].includes(dto.status)) {
      deliverable.deliveredAt = undefined;
    }
    if (dto.status && dto.status !== 'accepted') deliverable.acceptedAt = undefined;
    await this.deliverables.save(deliverable);
    await this.log(
      contractId,
      userId,
      'edit_deliverable',
      before as unknown as Record<string, unknown>,
      deliverable as unknown as Record<string, unknown>
    );
    return this.getDetail(userId, contractId, false);
  }

  async addComment(userId: string, contractId: string, dto: CreateContractCommentDto) {
    await this.assertContractAccess(userId, contractId);
    const comment = await this.comments.save(
      this.comments.create({ contractId, authorId: userId, body: dto.body })
    );
    await this.log(contractId, userId, 'comment', undefined, { commentId: comment.id });
    return this.getDetail(userId, contractId, false);
  }

  async close(userId: string, contractId: string, dto: CloseContractDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    const before = this.snapshotContract(contract);
    contract.status = 'closed';
    contract.closedAt = new Date();
    contract.closeReason = dto.closeReason;
    await this.contracts.save(contract);
    await this.log(contractId, userId, 'close', before, this.snapshotContract(contract));
    return this.getDetail(userId, contractId, false);
  }

  async renew(userId: string, contractId: string, dto: RenewContractDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    const before = this.snapshotContract(contract);
    contract.status = 'renewed';
    contract.renewalDate = dto.renewalDate ?? new Date().toISOString().slice(0, 10);
    contract.endDate = dto.expirationDate ?? contract.endDate;
    contract.closedAt = undefined;
    contract.closeReason = undefined;
    await this.contracts.save(contract);
    await this.log(contractId, userId, 'renew', before, this.snapshotContract(contract));
    await this.syncAlerts(contract);
    return this.getDetail(userId, contractId, false);
  }

  async synchronizeAlerts(userId: string, projectId?: string) {
    const contracts = await this.listContractsForAlerts(userId, projectId);
    let created = 0;
    for (const contract of contracts) {
      created += await this.syncAlerts(contract);
    }
    return { ok: true, alertsCreated: created, contractsProcessed: contracts.length };
  }

  async batchAction(userId: string, dto: BatchActionDto) {
    const results: Array<{ id: string; ok: boolean; error?: string }> = [];
    for (const id of dto.ids) {
      try {
        await this.assertContractAccess(userId, id);
        switch (dto.action) {
          case 'close':
            await this.close(userId, id, {
              closeReason: (dto.payload?.closeReason as string) ?? 'Cierre masivo',
            });
            break;
          case 'renew':
            await this.renew(userId, id, {
              renewalDate:
                (dto.payload?.renewalDate as string) ?? new Date().toISOString().slice(0, 10),
              expirationDate: dto.payload?.expirationDate as string,
            });
            break;
          case 'approve':
            await this.update(userId, id, { status: 'approved' });
            break;
          case 'activate':
            await this.update(userId, id, { status: 'active' });
            break;
          default:
            results.push({ id, ok: false, error: `Accion desconocida: ${dto.action}` });
            continue;
        }
        results.push({ id, ok: true });
      } catch (error) {
        results.push({
          id,
          ok: false,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      }
    }
    return {
      results,
      total: dto.ids.length,
      success: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    };
  }

  async importContracts(userId: string, dto: ImportContractsDto) {
    await this.assertProjectAccess(userId, dto.projectId);
    const cleanBase64 = dto.base64Content.includes(',')
      ? dto.base64Content.split(',')[1]
      : dto.base64Content;
    const buffer = Buffer.from(cleanBase64, 'base64');
    const content = buffer.toString('utf-8');
    const lines = content.split('\n').filter((l) => l.trim());
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const rows = lines.slice(1);

    const errors: Array<{ row: number; message: string }> = [];
    let success = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        const values = rows[i].split(',').map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] ?? '';
        });

        await this.contracts.save(
          this.contracts.create({
            projectId: dto.projectId,
            name: row.name || row.nombre || `Importado ${i + 1}`,
            supplierName: row.supplier || row.proveedor,
            clientName: row.client || row.cliente,
            contractType: row.type || row.tipo,
            amount: row.amount || row.monto,
            currency: row.currency || row.moneda || 'MXN',
            startDate: row.start_date || row.inicio,
            endDate: row.end_date || row.vencimiento || row.fin,
            status: 'draft',
            createdById: userId,
          })
        );
        success++;
      } catch (error) {
        errors.push({ row: i + 2, message: error instanceof Error ? error.message : 'Error' });
      }
    }

    await this.importLogsRepo.save(
      this.importLogsRepo.create({
        projectId: dto.projectId,
        fileName: dto.fileName,
        totalRows: rows.length,
        successRows: success,
        errorRows: errors.length,
        errorsJson: errors as unknown as Record<string, unknown>[],
        createdById: userId,
      })
    );

    return {
      total: rows.length,
      success,
      errors,
      log: {
        fileName: dto.fileName,
        totalRows: rows.length,
        successRows: success,
        errorRows: errors.length,
      },
    };
  }

  async exportContract(userId: string, contractId: string) {
    const detail = await this.getDetail(userId, contractId, false);
    return {
      contract: {
        name: detail.name,
        status: detail.status,
        supplierName: detail.supplierName,
        clientName: detail.clientName,
        contractType: detail.contractType,
        responsibleArea: detail.responsibleArea,
        startDate: detail.startDate,
        endDate: detail.endDate,
        amount: detail.amount,
        currency: detail.currency,
      },
      obligations: detail.obligations,
      milestones: detail.milestones,
      versions: detail.versions,
      tags: detail.tags,
      amendments: detail.amendments,
      payments: detail.payments,
    };
  }

  async ask(userId: string, contractId: string, dto: AskContractQueryDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    const currentVersion = contract.currentVersionId
      ? await this.versions.findOne({ where: { id: contract.currentVersionId, contractId } })
      : null;
    const indexedAnswer = await this.contractExtraction.ask(contract, currentVersion, dto.question);
    if (indexedAnswer) {
      await this.log(contractId, userId, 'ask_ai', undefined, {
        question: dto.question,
        citations: indexedAnswer.citations.length,
        source: 'persisted_contract_index',
      });
      return indexedAnswer;
    }
    const detail = await this.getDetail(userId, contractId, false);
    const chunks = this.buildKnowledgeChunks(detail);
    const scored = chunks
      .map((chunk) => ({ ...chunk, score: this.scoreChunk(dto.question, chunk.text) }))
      .filter((chunk) => chunk.score > 0.12)
      .sort((left, right) => right.score - left.score)
      .slice(0, 6);

    await this.log(contractId, userId, 'ask_ai', undefined, {
      question: dto.question,
      citations: scored.length,
    });

    if (!scored.length) {
      return {
        answer: 'No encontre informacion suficiente en este contrato para responder con seguridad.',
        status: 'insufficient_information',
        citations: [],
      };
    }

    return {
      answer: scored.map((item, index) => `${index + 1}. ${item.text}`).join('\n'),
      status: 'answered',
      citations: scored.map((item) => ({
        sourceType: item.sourceType,
        label: item.label,
        fragment: item.text,
      })),
    };
  }

  async askGota(userId: string, dto: AskGotaQueryDto) {
    const visibleProjectIds = await this.scope.visibleProjectIdsForUser(userId);
    if (!visibleProjectIds.length) {
      return this.contractExtraction.askAcross([], dto.question);
    }

    const requestedIds = [...new Set(dto.documentIds ?? dto.versionIds ?? [])];
    const contracts = await this.contracts.find({
      where: {
        projectId: In(visibleProjectIds),
      },
      order: { updatedAt: 'DESC' },
    });
    const contractIds = contracts.map((contract) => contract.id);
    const [versions, attachments] = contractIds.length
      ? await Promise.all([
          this.versions.find({
            where: {
              contractId: In(contractIds),
              ...(requestedIds.length ? { id: In(requestedIds) } : {}),
            },
            order: { createdAt: 'DESC' },
          }),
          this.attachments.find({
            where: {
              contractId: In(contractIds),
              ...(requestedIds.length ? { id: In(requestedIds) } : {}),
            },
            order: { createdAt: 'DESC' },
          }),
        ])
      : [[], []];
    if (requestedIds.length && versions.length + attachments.length !== requestedIds.length) {
      throw new ForbiddenException('Uno o más documentos no están dentro de tu alcance.');
    }
    const contractsById = new Map(contracts.map((contract) => [contract.id, contract]));
    const versionSources = versions.flatMap((version) => {
      const contract = contractsById.get(version.contractId);
      return contract ? [{ sourceType: 'version' as const, contract, version }] : [];
    });
    const attachmentSources = attachments.flatMap((attachment) => {
      const contract = contractsById.get(attachment.contractId);
      return contract ? [{ sourceType: 'attachment' as const, contract, attachment }] : [];
    });
    const sources = [...versionSources, ...attachmentSources];

    const response = await this.contractExtraction.askAcross(sources, dto.question);
    if (contracts[0]) {
      await this.log(contracts[0].id, userId, 'ask_gota', undefined, {
        question: dto.question,
        documentsRequested: requestedIds.length || sources.length,
        documentsAvailable: sources.length,
      });
    }
    return response;
  }

  async listGotaSources(userId: string) {
    const visibleProjectIds = await this.scope.visibleProjectIdsForUser(userId);
    if (!visibleProjectIds.length) return [];
    const contracts = await this.contracts.find({
      where: { projectId: In(visibleProjectIds) },
      order: { updatedAt: 'DESC' },
    });
    if (!contracts.length) return [];
    const contractIds = contracts.map((contract) => contract.id);
    const [versions, attachments] = await Promise.all([
      this.versions.find({
        where: { contractId: In(contractIds) },
        order: { createdAt: 'DESC' },
      }),
      this.attachments.find({
        where: { contractId: In(contractIds) },
        order: { createdAt: 'DESC' },
      }),
    ]);
    const byId = new Map(contracts.map((contract) => [contract.id, contract]));
    const versionSources = versions.map((version) => {
      const contract = byId.get(version.contractId)!;
      return {
        id: version.id,
        sourceType: 'version' as const,
        contractId: contract.id,
        contractName: contract.name,
        versionLabel: version.versionLabel,
        fileName: version.fileName,
        createdAt: version.createdAt,
        isCurrent: contract.currentVersionId === version.id,
      };
    });
    const attachmentSources = attachments.map((attachment) => {
      const contract = byId.get(attachment.contractId)!;
      return {
        id: attachment.id,
        sourceType: 'attachment' as const,
        contractId: contract.id,
        contractName: contract.name,
        versionLabel: attachment.versionLabel || '1',
        documentName: attachment.name,
        fileName: attachment.fileName,
        createdAt: attachment.createdAt,
        isCurrent: attachment.isCurrent ?? true,
        attachmentGroupId: attachment.attachmentGroupId || attachment.id,
      };
    });
    return [...versionSources, ...attachmentSources].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }

  async getGotaKnowledge(userId: string, documentId: string) {
    const version = await this.versions.findOne({ where: { id: documentId } });
    if (version) {
      await this.assertContractAccess(userId, version.contractId);
      return this.contractExtraction.getKnowledge(version.contractId, version.id);
    }
    const attachment = await this.attachments.findOne({ where: { id: documentId } });
    if (!attachment) throw new NotFoundException('Documento contractual no encontrado');
    await this.assertContractAccess(userId, attachment.contractId);
    return this.contractExtraction.getAttachmentKnowledge(attachment.contractId, attachment.id);
  }

  async normalizeGotaTranscription(userId: string, documentId: string) {
    const version = await this.versions.findOne({ where: { id: documentId } });
    if (version) {
      await this.assertContractAccess(userId, version.contractId);
      return this.contractExtraction.normalizeStoredTranscription(version.contractId, version.id);
    }
    const attachment = await this.attachments.findOne({ where: { id: documentId } });
    if (!attachment) throw new NotFoundException('Documento contractual no encontrado');
    await this.assertContractAccess(userId, attachment.contractId);
    return this.contractExtraction.normalizeStoredAttachmentTranscription(
      attachment.contractId,
      attachment.id
    );
  }

  async addAmendment(userId: string, contractId: string, dto: CreateAmendmentDto) {
    await this.assertContractAccess(userId, contractId);
    const amendment = await this.amendmentsRepo.save(
      this.amendmentsRepo.create({ contractId, ...dto, createdById: userId })
    );
    await this.log(contractId, userId, 'add_amendment', undefined, {
      amendmentId: amendment.id,
      amendmentNumber: amendment.amendmentNumber,
    });
    return this.getDetail(userId, contractId, false);
  }

  async updateAmendment(
    userId: string,
    contractId: string,
    amendmentId: string,
    dto: UpdateAmendmentDto
  ) {
    await this.assertContractAccess(userId, contractId);
    const amendment = await this.amendmentsRepo.findOne({ where: { id: amendmentId, contractId } });
    if (!amendment) throw new NotFoundException('Enmienda no encontrada');
    Object.assign(amendment, dto);
    await this.amendmentsRepo.save(amendment);
    await this.log(contractId, userId, 'edit_amendment', undefined, { amendmentId });
    return this.getDetail(userId, contractId, false);
  }

  async addPayment(userId: string, contractId: string, dto: CreatePaymentDto) {
    await this.assertContractAccess(userId, contractId);
    const payload = this.buildPaymentPayload(dto);
    const payment = await this.paymentsRepo.save(
      this.paymentsRepo.create({
        contractId,
        ...payload,
        concept: payload.concept ?? dto.concept,
        amount: payload.amount ?? dto.amount,
        createdById: userId,
      })
    );
    await this.log(contractId, userId, 'add_payment', undefined, {
      paymentId: payment.id,
      concept: payment.concept,
    });
    return this.getDetail(userId, contractId, false);
  }

  async updatePayment(
    userId: string,
    contractId: string,
    paymentId: string,
    dto: UpdatePaymentDto
  ) {
    await this.assertContractAccess(userId, contractId);
    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId, contractId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    Object.assign(payment, this.buildPaymentPayload(dto, payment));
    await this.paymentsRepo.save(payment);
    await this.log(contractId, userId, 'edit_payment', undefined, { paymentId });
    return this.getDetail(userId, contractId, false);
  }

  async getPaymentProof(userId: string, contractId: string, paymentId: string) {
    await this.assertContractAccess(userId, contractId);
    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId, contractId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (!payment.invoiceFileKey) {
      throw new NotFoundException('El pago no tiene comprobante cargado');
    }

    return {
      buffer: await this.storage.read(payment.invoiceFileKey),
      fileName: this.paymentProofFileName(payment),
      mimeType: 'application/octet-stream',
    };
  }

  getIntegrationStatus() {
    return {
      signature: {
        provider: this.signatureProvider.name,
        configured: this.signatureProvider.configured,
        simulated: this.signatureProvider.name === 'stub',
      },
      erp: {
        provider: this.erpIntegration.name,
        configured: this.erpIntegration.configured,
        simulated: this.erpIntegration.name === 'stub',
      },
    };
  }

  testErpConnection() {
    return this.erpIntegration.testConnection();
  }

  async syncPaymentToErp(userId: string, contractId: string, paymentId: string) {
    const contract = await this.assertContractAccess(userId, contractId);
    const payment = await this.paymentsRepo.findOne({ where: { id: paymentId, contractId } });
    if (!payment) throw new NotFoundException('Pago no encontrado');
    if (!payment.amount) {
      throw new BadRequestException(
        'Define el importe del pago antes de sincronizarlo con el ERP.'
      );
    }
    if (!this.erpIntegration.configured) {
      throw new BadRequestException('La integración ERP no está configurada');
    }
    if (payment.erpSyncStatus === 'synced' && payment.erpExternalId) {
      return { payment, duplicate: true };
    }

    const fingerprint = createHash('sha256')
      .update(
        JSON.stringify({
          paymentId: payment.id,
          concept: payment.concept,
          amount: payment.amount,
          currency: payment.currency,
          paymentDate: payment.paymentDate,
          dueDate: payment.dueDate,
          invoiceNumber: payment.invoiceNumber,
        })
      )
      .digest('hex')
      .slice(0, 24);
    const idempotencyKey = `clm-payment-${payment.id}-${fingerprint}`;

    payment.erpSyncStatus = 'syncing';
    payment.erpSyncError = null;
    await this.paymentsRepo.save(payment);

    const result =
      payment.status === 'paid' && payment.paymentDate
        ? await this.erpIntegration.syncPayment({
            idempotencyKey,
            contractName: contract.name,
            concept: payment.concept,
            amount: payment.amount,
            currency: payment.currency,
            paidAt: payment.paymentDate,
          })
        : payment.invoiceNumber && payment.dueDate
          ? await this.erpIntegration.syncInvoice({
              idempotencyKey,
              invoiceNumber: payment.invoiceNumber,
              contractName: contract.name,
              amount: payment.amount,
              currency: payment.currency,
              issuedAt: payment.paymentDate ?? payment.createdAt.toISOString().slice(0, 10),
              dueAt: payment.dueDate,
            })
          : null;

    if (!result) {
      payment.erpSyncStatus = 'failed';
      payment.erpSyncError = 'Registra fecha de pago o factura con fecha de vencimiento';
      await this.paymentsRepo.save(payment);
      throw new BadRequestException(payment.erpSyncError);
    }

    payment.erpSyncStatus = result.success ? 'synced' : 'failed';
    payment.erpExternalId = result.externalId ?? null;
    payment.erpSyncError = result.errorMessage ?? null;
    payment.erpSyncedAt = result.success ? new Date() : null;
    await this.paymentsRepo.save(payment);
    await this.log(
      contractId,
      userId,
      result.success ? 'erp_payment_synced' : 'erp_payment_failed',
      undefined,
      {
        paymentId,
        provider: this.erpIntegration.name,
        externalId: result.externalId,
        error: result.errorMessage,
      }
    );

    if (!result.success) {
      throw new BadRequestException(result.errorMessage ?? 'No se pudo sincronizar con el ERP');
    }
    return { payment, duplicate: false };
  }

  async sendForSignature(userId: string, contractId: string, dto: CreateSignatureRequestDto) {
    await this.assertContractAccess(userId, contractId);
    if (dto.versionId && dto.attachmentId) {
      throw new BadRequestException('Selecciona un contrato o un anexo para firmar, no ambos');
    }

    const attachment = dto.attachmentId
      ? await this.attachments.findOne({ where: { id: dto.attachmentId, contractId } })
      : null;
    const version = attachment
      ? null
      : dto.versionId
        ? await this.versions.findOne({ where: { id: dto.versionId, contractId } })
        : await this.versions.findOne({ where: { contractId }, order: { createdAt: 'DESC' } });
    const document = attachment ?? version;

    if (!document) {
      throw new NotFoundException(
        dto.attachmentId
          ? 'No se encontró el anexo seleccionado para firmar'
          : 'No hay versión del contrato para firmar'
      );
    }

    const fileBuffer = await this.storage.read(document.fileKey);
    const base64Content = fileBuffer.toString('base64');
    const documentHash = createHash('sha256').update(fileBuffer).digest('hex');
    const normalizedSigners = [...dto.signers]
      .map((signer, index) => ({
        name: signer.name.trim(),
        email: signer.email.trim().toLowerCase(),
        order: signer.order ?? index + 1,
      }))
      .sort((left, right) => left.order - right.order || left.email.localeCompare(right.email));
    const activeRequests = await this.signaturesRepo.find({
      where: {
        contractId,
        versionId: version?.id ?? IsNull(),
        attachmentId: attachment?.id ?? IsNull(),
        provider: this.signatureProvider.name,
        documentHash,
        status: In(['pending', 'sent', 'delivered']),
      },
      order: { createdAt: 'DESC' },
    });
    const existingRequest = activeRequests.find(
      (request) => JSON.stringify(request.signersJson) === JSON.stringify(normalizedSigners)
    );
    if (existingRequest) {
      return { signature: existingRequest, reused: true };
    }

    const result = await this.signatureProvider.send({
      contractId,
      versionId: version?.id,
      documentBase64: base64Content,
      fileName: document.fileName,
      signers: normalizedSigners,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    const signature = await this.signaturesRepo.save(
      this.signaturesRepo.create({
        contractId,
        versionId: version?.id,
        attachmentId: attachment?.id,
        provider: this.signatureProvider.name,
        providerRequestId: result.providerRequestId,
        status: result.status,
        signersJson: normalizedSigners as unknown as Record<string, unknown>,
        documentHash,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        createdById: userId,
      })
    );

    await this.log(contractId, userId, 'send_for_signature', undefined, {
      signatureId: signature.id,
      versionId: version?.id,
      attachmentId: attachment?.id,
      providerRequestId: result.providerRequestId,
    });
    return { signature, signingUrl: result.signingUrl };
  }

  async checkSignatureStatus(userId: string, contractId: string, signatureId: string) {
    await this.assertContractAccess(userId, contractId);
    const signature = await this.signaturesRepo.findOne({ where: { id: signatureId, contractId } });
    if (!signature) throw new NotFoundException('Solicitud de firma no encontrada');
    if (signature.providerRequestId) {
      const status = await this.signatureProvider.checkStatus(signature.providerRequestId);
      if (status.status !== signature.status || status.signedAt) {
        signature.status = status.status;
        if (status.status === 'completed') {
          signature.signedAt = status.signedAt ?? signature.signedAt ?? new Date();
        }
        await this.signaturesRepo.save(signature);
      }
    }
    return signature;
  }

  async addNegotiation(userId: string, contractId: string, dto: CreateNegotiationDto) {
    await this.assertContractAccess(userId, contractId);
    const negotiation = await this.negotiationsRepo.save(
      this.negotiationsRepo.create({ contractId, ...dto, createdById: userId })
    );
    await this.log(contractId, userId, 'add_negotiation', undefined, {
      negotiationId: negotiation.id,
      partyName: negotiation.partyName,
    });
    return this.getDetail(userId, contractId, false);
  }

  async updateNegotiation(
    userId: string,
    contractId: string,
    negotiationId: string,
    dto: UpdateNegotiationDto
  ) {
    await this.assertContractAccess(userId, contractId);
    const negotiation = await this.negotiationsRepo.findOne({
      where: { id: negotiationId, contractId },
    });
    if (!negotiation) throw new NotFoundException('Negociacion no encontrada');
    Object.assign(negotiation, dto);
    if (dto.status === 'accepted' || dto.status === 'rejected') {
      negotiation.resolvedAt = new Date();
    }
    await this.negotiationsRepo.save(negotiation);
    return this.getDetail(userId, contractId, false);
  }

  async assignTags(userId: string, contractId: string, dto: AssignTagsDto) {
    await this.assertContractAccess(userId, contractId);
    const contract = await this.contracts.findOne({
      where: { id: contractId },
      relations: ['tags'],
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');

    const tagIds = [...(dto.tagIds ?? [])];
    if (dto.tagNames?.length) {
      for (const name of dto.tagNames) {
        let tag = await this.tagsRepo.findOne({ where: { name } });
        if (!tag) {
          tag = await this.tagsRepo.save(this.tagsRepo.create({ name }));
        }
        tagIds.push(tag.id);
      }
    }

    const tags = await this.tagsRepo.findByIds(tagIds);
    contract.tags = tags;
    await this.contracts.save(contract);
    await this.log(contractId, userId, 'assign_tags', undefined, { tagIds });
    return this.getDetail(userId, contractId, false);
  }

  async setCustomValue(userId: string, contractId: string, dto: SetCustomValueDto) {
    await this.assertContractAccess(userId, contractId);
    let cv = await this.customValuesRepo.findOne({ where: { contractId, fieldId: dto.fieldId } });
    if (cv) {
      cv.value = dto.value;
    } else {
      cv = this.customValuesRepo.create({ contractId, fieldId: dto.fieldId, value: dto.value });
    }
    await this.customValuesRepo.save(cv);
    return this.getDetail(userId, contractId, false);
  }

  async setCustomValues(userId: string, contractId: string, values: SetCustomValueDto[]) {
    await this.assertContractAccess(userId, contractId);
    for (const dto of values) {
      let cv = await this.customValuesRepo.findOne({ where: { contractId, fieldId: dto.fieldId } });
      if (cv) {
        cv.value = dto.value;
      } else {
        cv = this.customValuesRepo.create({ contractId, fieldId: dto.fieldId, value: dto.value });
      }
      await this.customValuesRepo.save(cv);
    }
    return this.getDetail(userId, contractId, false);
  }

  async setParentContract(userId: string, contractId: string, parentContractId: string | null) {
    const contract = await this.assertContractAccess(userId, contractId);
    if (parentContractId) {
      const parent = await this.assertContractAccess(userId, parentContractId);
      if (parent.id === contract.id)
        throw new ForbiddenException('Un contrato no puede ser su propio padre');
    }
    contract.parentContractId = parentContractId ?? undefined;
    await this.contracts.save(contract);
    await this.log(contractId, userId, 'set_parent', undefined, { parentContractId });
    return this.getDetail(userId, contractId, false);
  }

  async generateReport(userId: string, dto: CreateReportDto) {
    const projectIds = dto.projectId
      ? [dto.projectId]
      : await this.scope.visibleProjectIdsForUser(userId);
    if (dto.projectId && !(await this.scope.canAccessProject(userId, dto.projectId))) {
      throw new ForbiddenException('No tienes acceso a este centro de costos');
    }
    return this.reportGenerator.generate(
      {
        type: dto.type as ReportType,
        projectId: dto.projectId,
        dateFrom: dto.dateFrom,
        dateTo: dto.dateTo,
      },
      projectIds
    );
  }

  async getDashboard(userId: string, projectId?: string) {
    const projectIds = projectId ? [projectId] : await this.scope.visibleProjectIdsForUser(userId);
    if (projectId && !(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este centro de costos');
    }
    if (!projectIds.length) {
      return {
        contractsByStatus: [],
        contractsByType: [],
        expiringThisMonth: 0,
        totalAmount: 0,
        pendingObligations: 0,
        activeContracts: 0,
      };
    }

    const contracts = await this.contracts.find({
      where: projectIds.map((id) => ({ projectId: id })),
    });
    const contractIds = contracts.map((c) => c.id);

    const statusCounts = new Map<string, number>();
    let totalAmount = 0;
    let activeCount = 0;
    let expiringCount = 0;
    const typeCounts = new Map<string, number>();
    const today = new Date();
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    for (const c of contracts) {
      statusCounts.set(c.status, (statusCounts.get(c.status) ?? 0) + 1);
      const key = c.contractType ?? 'Sin tipo';
      typeCounts.set(key, (typeCounts.get(key) ?? 0) + 1);
      if (c.amount) totalAmount += Number(c.amount);
      if (c.status === 'active' || c.status === 'approved') activeCount++;
      if (c.endDate) {
        const end = new Date(c.endDate);
        if (end >= today && end <= monthEnd) expiringCount++;
      }
    }

    let pendingObligations = 0;
    if (contractIds.length) {
      pendingObligations = await this.obligations.count({
        where: [
          ...contractIds.map((id) => ({ contractId: id, status: 'pending' as const })),
          ...contractIds.map((id) => ({ contractId: id, status: 'overdue' as const })),
        ],
      });
    }

    return {
      contractsByStatus: [...statusCounts.entries()].map(([key, value]) => ({ key, value })),
      contractsByType: [...typeCounts.entries()].map(([label, value]) => ({ label, value })),
      expiringThisMonth: expiringCount,
      totalAmount,
      pendingObligations,
      activeContracts: activeCount,
      totalContracts: contracts.length,
    };
  }

  async createTag(userId: string, dto: CreateTagDto) {
    return this.tagsRepo.save(this.tagsRepo.create(dto));
  }

  async listTags() {
    return this.tagsRepo.find({ order: { name: 'ASC' } });
  }

  async deleteTag(tagId: string) {
    await this.tagsRepo.delete(tagId);
    return { ok: true };
  }

  async createCustomField(dto: CreateCustomFieldDto) {
    return this.customFieldsRepo.save(this.customFieldsRepo.create(dto));
  }

  async listCustomFields(contractType?: string) {
    const where = contractType ? { contractType } : {};
    return this.customFieldsRepo.find({ where, order: { sortOrder: 'ASC', fieldLabel: 'ASC' } });
  }

  async deleteCustomField(fieldId: string) {
    await this.customValuesRepo.delete({ fieldId });
    await this.customFieldsRepo.delete(fieldId);
    return { ok: true };
  }

  async listTemplates() {
    return this.templatesRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async createTemplate(userId: string, dto: CreateTemplateDto) {
    const template = await this.templatesRepo.save(
      this.templatesRepo.create({
        name: dto.name,
        description: dto.description,
        contractType: dto.contractType,
        createdById: userId,
      })
    );
    if (dto.clauseIds?.length) {
      await this.templatesRepo.query(
        `INSERT IGNORE INTO template_clauses (template_id, clause_id, sort_order) VALUES ${dto.clauseIds.map((id, idx) => `('${template.id}', '${id}', ${idx})`).join(', ')}`
      );
    }
    return template;
  }

  async getTemplateDetail(templateId: string) {
    const template = await this.templatesRepo.findOne({
      where: { id: templateId },
      relations: ['createdBy'],
    });
    if (!template) throw new NotFoundException('Plantilla no encontrada');
    const clauses = await this.clausesRepo.query(
      `SELECT c.* FROM contract_clauses c JOIN template_clauses tc ON tc.clause_id = c.id WHERE tc.template_id = ? ORDER BY tc.sort_order`,
      [templateId]
    );
    return { ...template, clauses };
  }

  async listClauses(category?: string) {
    const where = category ? { category, isActive: true } : { isActive: true };
    return this.clausesRepo.find({ where, order: { category: 'ASC', title: 'ASC' } });
  }

  async createClause(userId: string, dto: CreateClauseDto) {
    return this.clausesRepo.save(this.clausesRepo.create({ ...dto, createdById: userId }));
  }

  async listImportLogs(userId: string) {
    const projectIds = await this.scope.visibleProjectIdsForUser(userId);
    if (!projectIds.length) return [];
    return this.importLogsRepo.find({
      where: projectIds.map((id) => ({ projectId: id })),
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async updateLifecycleStage(userId: string, contractId: string, dto: UpdateLifecycleStageDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    if (!Object.prototype.hasOwnProperty.call(LIFECYCLE_TRANSITIONS, dto.stage)) {
      throw new BadRequestException(`Etapa de ciclo de vida no reconocida: ${dto.stage}`);
    }
    const previousStage = contract.lifecycleStage;
    if (previousStage !== dto.stage && !LIFECYCLE_TRANSITIONS[previousStage]?.includes(dto.stage)) {
      throw new BadRequestException(
        `Transición no permitida: ${previousStage || 'sin etapa'} → ${dto.stage}`
      );
    }
    const now = new Date();
    let timeInPreviousStageMinutes: number | undefined;
    if (contract.lifecycleChangedAt) {
      timeInPreviousStageMinutes = Math.floor(
        (now.getTime() - contract.lifecycleChangedAt.getTime()) / 60000
      );
    }
    contract.lifecycleStage = dto.stage;
    contract.lifecycleChangedAt = now;
    await this.contracts.save(contract);
    await this.lifecycleEventsRepo.save(
      this.lifecycleEventsRepo.create({
        contractId,
        previousStage,
        stage: dto.stage,
        changedById: userId,
        comments: dto.comments,
        decision: dto.decision,
        relatedDocumentId: dto.relatedDocumentId,
        relatedVersionId: dto.relatedVersionId,
        timeInPreviousStageMinutes,
      })
    );
    await this.log(contractId, userId, 'lifecycle_change', { previousStage }, { stage: dto.stage });
    return this.getDetail(userId, contractId, false);
  }

  async deleteVersion(userId: string, contractId: string, versionId: string) {
    await this.assertContractAccess(userId, contractId);
    const version = await this.versions.findOne({ where: { id: versionId, contractId } });
    if (!version) throw new NotFoundException('Version no encontrada');
    await this.versions.softDelete(versionId);
    await this.log(contractId, userId, 'delete_version', undefined, { versionId });
    return this.getDetail(userId, contractId, false);
  }

  async deleteAttachment(userId: string, contractId: string, attachmentId: string) {
    await this.assertContractAccess(userId, contractId);
    const attachment = await this.attachments.findOne({ where: { id: attachmentId, contractId } });
    if (!attachment) throw new NotFoundException('Adjunto no encontrado');
    const attachmentGroupId = attachment.attachmentGroupId || attachment.id;
    const versions = await this.attachments.find({ where: { contractId, attachmentGroupId } });
    for (const version of versions) {
      await this.contractExtraction.deleteAttachmentIndex(contractId, version.id);
    }
    await this.attachments.softDelete(versions.map((version) => version.id));
    await this.log(contractId, userId, 'delete_attachment', undefined, {
      attachmentId,
      attachmentGroupId,
      versionsDeleted: versions.length,
    });
    return this.getDetail(userId, contractId, false);
  }

  async deleteObligation(userId: string, contractId: string, obligationId: string) {
    await this.assertContractAccess(userId, contractId);
    const obligation = await this.obligations.findOne({ where: { id: obligationId, contractId } });
    if (!obligation) throw new NotFoundException('Obligacion no encontrada');
    await this.obligations.softDelete(obligationId);
    await this.log(contractId, userId, 'delete_obligation', undefined, { obligationId });
    return this.getDetail(userId, contractId, false);
  }

  async remindObligation(userId: string, contractId: string, obligationId: string) {
    await this.assertContractAccess(userId, contractId);
    const obligation = await this.obligations.findOne({
      where: { id: obligationId, contractId },
      relations: ['responsibleUser'],
    });
    if (!obligation) throw new NotFoundException('Obligacion no encontrada');
    const recipientId = obligation.responsibleUserId ?? userId;
    await this.notifications.notify({
      recipients: [{ userId: recipientId }],
      notificationType: 'contract_obligation_pending',
      title: `Recordatorio de obligacion: ${obligation.description.slice(0, 80)}`,
      body: `La obligacion "${obligation.description}" vence el ${obligation.commitmentDate ?? 'sin fecha'}.`,
      entityType: 'obligation',
      entityId: obligation.id,
      category: 'contract',
      meta: { route: `/clm/${contractId}`, obligationId: obligation.id },
      dedupeKey: `obligation-remind:${obligation.id}:${this.today()}`,
    });
    obligation.lastRemindedAt = new Date();
    obligation.reminderCount = (obligation.reminderCount ?? 0) + 1;
    await this.obligations.save(obligation);
    await this.log(contractId, userId, 'remind_obligation', undefined, { obligationId });
    return { ok: true, remindedAt: obligation.lastRemindedAt };
  }

  async getCalendarEvents(userId: string, contractId: string) {
    await this.assertContractAccess(userId, contractId);
    const [obligations, milestones] = await Promise.all([
      this.obligations.find({
        where: { contractId },
        relations: ['responsibleUser'],
      }),
      this.milestones.find({
        where: { contractId },
        relations: ['responsibleUser'],
      }),
    ]);
    const events: Array<{
      id: string;
      type: 'obligation' | 'milestone';
      title: string;
      date: string;
      status: string;
      responsible: string | null;
    }> = [];
    for (const ob of obligations) {
      if (ob.commitmentDate) {
        events.push({
          id: ob.id,
          type: 'obligation',
          title: ob.description.slice(0, 100),
          date: ob.commitmentDate,
          status: ob.status,
          responsible: ob.responsibleUser?.name ?? null,
        });
      }
    }
    for (const ms of milestones) {
      events.push({
        id: ms.id,
        type: 'milestone',
        title: ms.name,
        date: ms.milestoneDate,
        status: ms.status,
        responsible: ms.responsibleUser?.name ?? null,
      });
    }
    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  }

  async deleteMilestone(userId: string, contractId: string, milestoneId: string) {
    await this.assertContractAccess(userId, contractId);
    const milestone = await this.milestones.findOne({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Hito no encontrado');
    await this.milestones.softDelete(milestoneId);
    await this.log(contractId, userId, 'delete_milestone', undefined, { milestoneId });
    return this.getDetail(userId, contractId, false);
  }

  async deleteComment(userId: string, contractId: string, commentId: string) {
    await this.assertContractAccess(userId, contractId);
    const comment = await this.comments.findOne({ where: { id: commentId, contractId } });
    if (!comment) throw new NotFoundException('Comentario no encontrado');
    await this.comments.softDelete(commentId);
    await this.log(contractId, userId, 'delete_comment', undefined, { commentId });
    return this.getDetail(userId, contractId, false);
  }

  async getRiskMatrix(userId: string, contractId: string) {
    await this.assertContractAccess(userId, contractId);
    const contract = await this.contracts.findOne({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contrato no encontrado');

    const obligations = await this.obligations.find({ where: { contractId } });
    const payments = await this.paymentsRepo.find({ where: { contractId } });
    const overdueObligations = obligations.filter(
      (o) => o.status === 'overdue' || o.status === 'pending'
    ).length;
    const totalObligations = obligations.length || 1;
    const overduePayments = payments.filter(
      (p) => p.status === 'overdue' || p.status === 'pending'
    ).length;

    const amount = Number(contract.amount ?? 0);
    const financialScore = Math.min(
      100,
      (amount > 1000000 ? 60 : amount > 100000 ? 30 : 10) +
        (overduePayments / (payments.length || 1)) * 40
    );

    const legalScore = Math.min(
      100,
      (overdueObligations / totalObligations) * 60 + (contract.status === 'draft' ? 20 : 0)
    );

    const operationalScore = Math.min(
      100,
      overdueObligations > 0 ? 50 + (overdueObligations / totalObligations) * 50 : 10
    );

    const complianceScore = Math.min(
      100,
      contract.status === 'expired' || contract.status === 'expiring_soon'
        ? 70
        : contract.status === 'active'
          ? 10
          : 30
    );

    const reputationalScore = Math.min(100, amount > 500000 ? 40 : 20);

    const weightedScore =
      financialScore * 0.25 +
      legalScore * 0.25 +
      operationalScore * 0.2 +
      complianceScore * 0.15 +
      reputationalScore * 0.15;

    const overallLevel =
      weightedScore < 25
        ? 'low'
        : weightedScore < 50
          ? 'medium'
          : weightedScore < 75
            ? 'high'
            : 'critical';

    return {
      overallScore: Math.round(weightedScore),
      overallLevel,
      dimensions: {
        financial: {
          score: Math.round(financialScore),
          weight: 0.25,
          level:
            financialScore < 25
              ? 'low'
              : financialScore < 50
                ? 'medium'
                : financialScore < 75
                  ? 'high'
                  : 'critical',
        },
        legal: {
          score: Math.round(legalScore),
          weight: 0.25,
          level:
            legalScore < 25
              ? 'low'
              : legalScore < 50
                ? 'medium'
                : legalScore < 75
                  ? 'high'
                  : 'critical',
        },
        operational: {
          score: Math.round(operationalScore),
          weight: 0.2,
          level:
            operationalScore < 25
              ? 'low'
              : operationalScore < 50
                ? 'medium'
                : operationalScore < 75
                  ? 'high'
                  : 'critical',
        },
        compliance: {
          score: Math.round(complianceScore),
          weight: 0.15,
          level:
            complianceScore < 25
              ? 'low'
              : complianceScore < 50
                ? 'medium'
                : complianceScore < 75
                  ? 'high'
                  : 'critical',
        },
        reputational: {
          score: Math.round(reputationalScore),
          weight: 0.15,
          level:
            reputationalScore < 25
              ? 'low'
              : reputationalScore < 50
                ? 'medium'
                : reputationalScore < 75
                  ? 'high'
                  : 'critical',
        },
      },
      indicators: {
        overdueObligations,
        totalObligations,
        overduePayments,
        totalPayments: payments.length,
        contractAmount: amount,
        contractStatus: contract.status,
      },
    };
  }

  async listAlerts(userId: string) {
    const projectIds = await this.scope.visibleProjectIdsForUser(userId);
    if (!projectIds.length) return [];
    const contracts = await this.contracts.find({
      where: projectIds.map((id) => ({ projectId: id })),
      relations: ['responsibleUser'],
    });
    const alerts: Array<{
      id: string;
      contractId: string;
      contractName: string;
      type: string;
      severity: string;
      message: string;
      date: string;
      dismissed: boolean;
    }> = [];
    for (const c of contracts) {
      if (c.endDate) {
        const alertDays = c.alertDaysBefore ?? CONTRACT_SOON_DAYS;
        if (this.isWithinDays(c.endDate, alertDays)) {
          alerts.push({
            id: `expiring-${c.id}`,
            contractId: c.id,
            contractName: c.name,
            type: 'contract_expiring',
            severity: 'warning',
            message: `El contrato "${c.name}" vence el ${c.endDate}`,
            date: c.endDate,
            dismissed: false,
          });
        }
        if (this.isExpired(c.endDate) && c.status !== 'closed' && c.status !== 'renewed') {
          alerts.push({
            id: `expired-${c.id}`,
            contractId: c.id,
            contractName: c.name,
            type: 'contract_expired',
            severity: 'critical',
            message: `El contrato "${c.name}" vencio el ${c.endDate}`,
            date: c.endDate,
            dismissed: false,
          });
        }
      }
      const obligations = await this.obligations.find({
        where: { contractId: c.id, status: 'overdue' },
      });
      for (const ob of obligations) {
        alerts.push({
          id: `obligation-overdue-${ob.id}`,
          contractId: c.id,
          contractName: c.name,
          type: 'obligation_overdue',
          severity: 'critical',
          message: `Obligacion vencida: "${ob.description.slice(0, 80)}"`,
          date: ob.commitmentDate ?? c.endDate ?? '',
          dismissed: false,
        });
      }
    }
    alerts.sort((a, b) => a.date.localeCompare(b.date));
    return alerts;
  }

  async dismissAlert(userId: string, alertId: string) {
    await this.log(`alert-${alertId}`, userId, 'dismiss_alert', undefined, { alertId });
    return { ok: true, dismissed: true, alertId };
  }

  async generateFromTemplate(
    userId: string,
    templateId: string,
    variables: Record<string, string>
  ) {
    const template = await this.templatesRepo.findOne({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Plantilla no encontrada');
    if (!template.content) throw new NotFoundException('La plantilla no tiene contenido');
    let content = template.content;
    for (const [key, value] of Object.entries(variables)) {
      content = content.replace(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi'), value);
    }
    content = content.replace(/\{\{\s*\w+\s*\}\}/g, '');
    return {
      content,
      templateId,
      templateName: template.name,
      usedVariables: Object.keys(variables),
    };
  }

  async createTemplateVersion(userId: string, templateId: string, dto: CreateTemplateDto) {
    const parent = await this.templatesRepo.findOne({ where: { id: templateId } });
    if (!parent) throw new NotFoundException('Plantilla original no encontrada');
    const version = await this.templatesRepo.save(
      this.templatesRepo.create({
        name: dto.name ?? parent.name,
        description: dto.description ?? parent.description,
        contractType: dto.contractType ?? parent.contractType,
        content: dto.content,
        version: `${Number(parent.versionNumber) + 1}.0`,
        versionNumber: (parent.versionNumber ?? 0) + 1,
        parentTemplateId: templateId,
        createdById: userId,
        isActive: false,
      })
    );
    return version;
  }

  async listCounterparties(userId: string, search?: string) {
    const projectIds = await this.scope.visibleProjectIdsForUser(userId);
    if (!projectIds.length) return [];
    const where: FindOptionsWhere<Counterparty>[] | undefined = search
      ? [
          { businessName: Like(`%${search}%`) },
          { rfc: Like(`%${search}%`) },
          { commercialName: Like(`%${search}%`) },
        ]
      : undefined;
    return this.counterpartiesRepo.find({ where, order: { businessName: 'ASC' } });
  }

  async createCounterparty(userId: string, dto: CreateCounterpartyDto) {
    const existing = await this.counterpartiesRepo.findOne({ where: { rfc: dto.rfc } });
    if (existing) throw new ForbiddenException('Ya existe una contraparte con este RFC');
    const counterparty = await this.counterpartiesRepo.save(
      this.counterpartiesRepo.create({
        ...dto,
        status: 'active',
      })
    );
    return counterparty;
  }

  async getCounterparty(id: string) {
    const counterparty = await this.counterpartiesRepo.findOne({ where: { id } });
    if (!counterparty) throw new NotFoundException('Contraparte no encontrada');
    const [contacts, documents] = await Promise.all([
      this.counterpartyContactsRepo.find({ where: { counterpartyId: id } }),
      this.counterpartyDocumentsRepo.find({ where: { counterpartyId: id } }),
    ]);
    return { ...counterparty, contacts, documents };
  }

  async updateCounterparty(id: string, dto: UpdateCounterpartyDto) {
    const counterparty = await this.counterpartiesRepo.findOne({ where: { id } });
    if (!counterparty) throw new NotFoundException('Contraparte no encontrada');
    Object.assign(counterparty, dto);
    await this.counterpartiesRepo.save(counterparty);
    return this.getCounterparty(id);
  }

  async deleteCounterparty(userId: string, id: string) {
    const counterparty = await this.counterpartiesRepo.findOne({ where: { id } });
    if (!counterparty) throw new NotFoundException('Contraparte no encontrada');
    await this.counterpartiesRepo.softDelete(id);
    return { ok: true };
  }

  async listRequests(userId: string) {
    const projectIds = await this.scope.visibleProjectIdsForUser(userId);
    if (!projectIds.length) return [];
    return this.requestsRepo.find({
      where: projectIds.map((pid) => ({ projectId: pid })),
      relations: ['project', 'responsibleUser', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async createRequest(userId: string, dto: CreateContractRequestDto) {
    if (dto.projectId) {
      await this.assertProjectAccess(userId, dto.projectId);
    }
    const request = await this.requestsRepo.save(
      this.requestsRepo.create({
        ...dto,
        estimatedAmount: dto.estimatedAmount ? Number(dto.estimatedAmount) : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        createdById: userId,
        status: 'draft',
      })
    );
    return request;
  }

  async getRequest(id: string) {
    const request = await this.requestsRepo.findOne({
      where: { id },
      relations: ['project', 'responsibleUser', 'createdBy', 'reviewedBy'],
    });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    return request;
  }

  async reviewRequest(userId: string, id: string, dto: ReviewContractRequestDto) {
    const request = await this.requestsRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    request.status = dto.status;
    request.reviewComments = dto.reviewComments;
    request.reviewedById = userId;
    request.reviewedAt = new Date();
    await this.requestsRepo.save(request);
    return this.getRequest(id);
  }

  async convertRequest(userId: string, id: string) {
    const request = await this.requestsRepo.findOne({ where: { id } });
    if (!request) throw new NotFoundException('Solicitud no encontrada');
    if (request.status !== 'approved') {
      throw new ForbiddenException('La solicitud debe estar aprobada para convertirla en contrato');
    }
    const contract = await this.contracts.save(
      this.contracts.create({
        name: `Contrato - ${request.counterpartyName ?? request.contractType}`,
        contractType: request.contractType,
        projectId: request.projectId ?? undefined,
        supplierName: request.counterpartyName,
        counterpartyRfc: request.counterpartyRfc,
        startDate: request.startDate ? request.startDate.toISOString().slice(0, 10) : undefined,
        endDate: request.endDate ? request.endDate.toISOString().slice(0, 10) : undefined,
        amount: request.estimatedAmount ? String(request.estimatedAmount) : undefined,
        currency: request.currency,
        responsibleUserId: request.responsibleUserId,
        status: 'draft',
        createdById: userId,
      })
    );
    await this.log(contract.id, userId, 'created_from_request', undefined, {
      requestId: id,
    });
    return contract;
  }

  async handleSignatureWebhook(
    provider: string,
    payload: Record<string, unknown>,
    rawBody: Buffer,
    signatureHeader: string
  ) {
    if (provider !== this.signatureProvider.name) {
      throw new BadRequestException(`Proveedor de firma no activo: ${provider}`);
    }
    const verifyWebhook = this.signatureProvider.verifyWebhook;
    if (
      typeof verifyWebhook === 'function' &&
      !verifyWebhook.call(this.signatureProvider, rawBody, signatureHeader)
    ) {
      throw new UnauthorizedException('Firma HMAC del webhook inválida');
    }
    const handler = this.signatureProvider.handleWebhook;
    if (typeof handler === 'function') {
      const result = await handler.call(this.signatureProvider, payload);
      const providerRequestId =
        result.envelopeId ?? (payload as { providerRequestId?: string }).providerRequestId ?? '';
      if (providerRequestId) {
        const signature = await this.signaturesRepo.findOne({
          where: { providerRequestId },
          relations: ['contract'],
        });
        if (signature) {
          const duplicate =
            signature.status === result.status &&
            (!result.signedAt || signature.signedAt?.getTime() === result.signedAt.getTime());
          if (duplicate) {
            return { received: true, status: result.status, duplicate: true };
          }
          signature.status = result.status;
          if (result.signedAt) signature.signedAt = result.signedAt;
          await this.signaturesRepo.save(signature);
          if (result.status === 'completed' && signature.contract) {
            signature.contract.status = 'active';
            await this.contracts.save(signature.contract);
            await this.log(signature.contractId, 'system', 'signature_completed', undefined, {
              signatureId: signature.id,
            });
          }
        }
      }
      return { received: true, status: result.status };
    }
    return { received: true };
  }

  async searchContracts(
    userId: string,
    query: string,
    projectId?: string,
    page?: string,
    limit?: string
  ) {
    const projectIds = projectId ? [projectId] : await this.scope.visibleProjectIdsForUser(userId);
    if (projectId && !(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este centro de costos');
    }
    if (!projectIds.length) {
      return { items: [], total: 0, page: 1, limit: 10 };
    }
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const offset = (pageNum - 1) * limitNum;
    const term = `%${query}%`;

    const [contractResults, total] = await this.contracts
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.project', 'project')
      .leftJoinAndSelect('c.responsibleUser', 'responsibleUser')
      .leftJoinAndSelect('c.tags', 'tags')
      .where('c.projectId IN (:...projectIds)', { projectIds })
      .andWhere('c.deletedAt IS NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('c.name LIKE :term', { term })
            .orWhere('c.supplierName LIKE :term', { term })
            .orWhere('c.clientName LIKE :term', { term })
            .orWhere('c.contractType LIKE :term', { term })
            .orWhere('c.responsibleArea LIKE :term', { term });
        })
      )
      .skip(offset)
      .take(limitNum)
      .orderBy('c.updatedAt', 'DESC')
      .getManyAndCount();

    const items = await Promise.all(
      contractResults.map(async (contract) => {
        const item = await this.toListItem(contract);
        return { ...item, snippet: null as string | null };
      })
    );

    const textIndexMatches = await this.textIndexRepo
      .createQueryBuilder('ti')
      .leftJoinAndSelect('ti.contract', 'contract')
      .leftJoinAndSelect('ti.version', 'version')
      .where('ti.content LIKE :term', { term })
      .andWhere('contract.projectId IN (:...projectIds)', { projectIds })
      .andWhere('contract.deletedAt IS NULL')
      .skip(offset)
      .take(limitNum)
      .orderBy('ti.createdAt', 'DESC')
      .getMany();

    for (const match of textIndexMatches) {
      const idx = match.content.toLowerCase().indexOf(query.toLowerCase());
      const snippet =
        idx >= 0
          ? '...' + match.content.slice(Math.max(0, idx - 80), idx + 120) + '...'
          : match.content.slice(0, 200);
      const existing = items.find((i) => i.id === match.contractId);
      if (existing) {
        existing.snippet = snippet;
      } else {
        const contract = match.contract;
        if (contract) {
          items.push({
            ...(await this.toListItem(contract)),
            snippet,
          });
        }
      }
    }

    return {
      items,
      total: Math.max(total, textIndexMatches.length),
      page: pageNum,
      limit: limitNum,
    };
  }

  async reindexContractText(userId: string, contractId: string) {
    await this.assertContractAccess(userId, contractId);
    const versions = await this.versions.find({
      where: { contractId },
      order: { createdAt: 'DESC' },
    });
    const queued = [];
    for (const version of versions) {
      queued.push(
        await this.contractExtraction.createAndStart(
          contractId,
          version.id,
          version.uploadedById ?? userId
        )
      );
    }
    return { ok: true, versionsProcessed: versions.length, queued };
  }

  private async listContractsForAlerts(userId: string, projectId?: string) {
    const projectIds = projectId ? [projectId] : await this.scope.visibleProjectIdsForUser(userId);
    if (projectId && !(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este centro de costos');
    }
    if (!projectIds.length) return [];
    return this.contracts.find({
      where: projectIds.map((id) => ({ projectId: id })),
      relations: ['responsibleUser'],
    });
  }

  private async assertContractAccess(userId: string, contractId: string) {
    const contract = await this.contracts.findOne({
      where: { id: contractId },
      relations: ['project', 'responsibleUser', 'mainDocument'],
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    await this.assertProjectAccess(userId, contract.projectId);
    return contract;
  }

  private async assertProjectAccess(userId: string, projectId: string) {
    if (!(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este centro de costos');
    }
  }

  private async assertDocumentBelongsToProject(projectId: string, documentId?: string) {
    if (!documentId) return;
    const document = await this.documents.findOne({ where: { id: documentId } });
    if (!document || document.projectId !== projectId) {
      throw new ForbiddenException(
        'El documento indicado no pertenece al centro de costos del contrato'
      );
    }
  }

  private async toListItem(contract: Contract) {
    const obligationRows = await this.obligations.find({ where: { contractId: contract.id } });
    const pendingObligations = obligationRows.filter(
      (item) => this.normalizeObligationStatus(item.status, item.commitmentDate) !== 'completed'
    ).length;
    const status = this.normalizeStatus(contract.status, contract.endDate);
    if (status !== contract.status) {
      contract.status = status;
      await this.contracts.save(contract);
    }

    return {
      id: contract.id,
      name: contract.name,
      projectId: contract.projectId,
      supplierName: contract.supplierName,
      clientName: contract.clientName,
      responsibleArea: contract.responsibleArea,
      contractType: contract.contractType,
      status,
      startDate: contract.startDate,
      endDate: contract.endDate,
      renewalDate: contract.renewalDate,
      amount: contract.amount,
      currency: contract.currency,
      responsibleUserId: contract.responsibleUserId,
      mainDocumentId: contract.mainDocumentId,
      currentVersionId: contract.currentVersionId,
      renewable: contract.renewable,
      renewalNoticeDays: contract.renewalNoticeDays,
      alertDaysBefore: contract.alertDaysBefore,
      parentContractId: contract.parentContractId,
      closeReason: contract.closeReason,
      closedAt: contract.closedAt,
      updatedAt: contract.updatedAt,
      createdAt: contract.createdAt,
      project: contract.project,
      responsibleUser: contract.responsibleUser,
      mainDocument: contract.mainDocument
        ? {
            id: contract.mainDocument.id,
            name: contract.mainDocument.name,
            documentNumber: contract.mainDocument.documentNumber,
          }
        : null,
      pendingObligations,
      tags: contract.tags,
    };
  }

  private normalizeStatus(status: Contract['status'] | undefined, endDate?: string) {
    if (status === 'closed' || status === 'renewed') return status;
    if (this.isExpired(endDate)) return 'expired';
    if (this.isExpiringSoon(endDate)) return 'expiring_soon';
    switch (status) {
      case 'in_review':
      case 'approved':
      case 'active':
      case 'draft':
        return status;
      default:
        return 'draft';
    }
  }

  private buildPaymentPayload(
    dto: CreatePaymentDto | UpdatePaymentDto,
    existing?: Partial<ContractPayment>
  ) {
    const concept = this.optionalPaymentValue(dto.concept) ?? existing?.concept;
    const amount = this.optionalPaymentValue(dto.amount) ?? existing?.amount;
    const percentage = this.optionalPaymentValue(dto.percentage) ?? existing?.percentage;
    const paymentCondition =
      this.optionalPaymentValue(dto.paymentCondition) ?? existing?.paymentCondition;
    const currency = this.optionalPaymentValue(dto.currency) ?? existing?.currency ?? 'MXN';
    const dueDate = this.optionalPaymentValue(dto.dueDate) ?? existing?.dueDate ?? null;
    const paymentDate = this.optionalPaymentValue(dto.paymentDate) ?? existing?.paymentDate ?? null;
    const invoiceNumber =
      this.optionalPaymentValue(dto.invoiceNumber) ?? existing?.invoiceNumber ?? null;
    const invoiceFileKey =
      this.optionalPaymentValue(dto.invoiceFileKey) ?? existing?.invoiceFileKey ?? null;
    const notes = this.optionalPaymentValue(dto.notes) ?? existing?.notes ?? null;
    const rawStatus = this.optionalPaymentValue(dto.status);

    return {
      concept,
      amount,
      percentage,
      paymentCondition,
      currency,
      dueDate,
      paymentDate,
      invoiceNumber,
      invoiceFileKey,
      notes,
      status: this.resolvePaymentStatus(rawStatus, paymentDate, dueDate, existing?.status),
    };
  }

  private resolvePaymentStatus(
    explicitStatus?: string | null,
    paymentDate?: string | null,
    dueDate?: string | null,
    fallback?: string
  ) {
    if (explicitStatus) {
      return explicitStatus;
    }

    if (paymentDate) {
      return 'paid';
    }

    if (dueDate) {
      const today = new Date().toISOString().slice(0, 10);
      return dueDate < today ? 'overdue' : 'scheduled';
    }

    return fallback ?? 'pending';
  }

  private optionalPaymentValue(value?: string | null) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = typeof value === 'string' ? value.trim() : value;
    return trimmed === '' ? null : trimmed;
  }

  private paymentProofFileName(payment: ContractPayment) {
    const storedName = payment.invoiceFileKey?.match(/^[0-9a-f-]{36}-(.+)$/i)?.[1];
    if (storedName) {
      return storedName;
    }

    const safeConcept = (payment.concept || 'comprobante-pago')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-+|-+$/g, '');

    return `${safeConcept || 'comprobante-pago'}.bin`;
  }

  private assertStatusTransition(from: Contract['status'], to: Contract['status']) {
    if (!STATUS_TRANSITIONS[from]?.includes(to)) {
      throw new BadRequestException(`Cambio de estado no permitido: ${from} → ${to}`);
    }
  }

  private normalizeObligationStatus(
    status: ContractObligation['status'] | undefined,
    commitmentDate?: string
  ) {
    if (status === 'completed' || status === 'waived') return status;
    if (this.isExpired(commitmentDate)) return 'overdue';
    return status ?? 'pending';
  }

  private isExpired(dateValue?: string) {
    if (!dateValue) return false;
    return this.diffDays(dateValue) < 0;
  }

  private isExpiringSoon(dateValue?: string) {
    if (!dateValue || this.isExpired(dateValue)) return false;
    return this.diffDays(dateValue) <= CONTRACT_SOON_DAYS;
  }

  private diffDays(dateValue: string) {
    const today = new Date();
    const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const b = new Date(`${dateValue}T00:00:00`);
    return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async syncAlerts(contract: Contract) {
    if (!contract.responsibleUserId) return 0;
    let created = 0;
    const alertDays = contract.alertDaysBefore ?? CONTRACT_SOON_DAYS;
    if (this.isWithinDays(contract.endDate, alertDays) || contract.status === 'expiring_soon') {
      await this.notifications.notify({
        recipients: [{ userId: contract.responsibleUserId }],
        notificationType: 'contract_expiring_soon',
        title: `Contrato proximo a vencer: ${contract.name}`,
        body: `El contrato ${contract.name} vence el ${contract.endDate ?? 'sin fecha definida'}.`,
        entityType: 'contract',
        entityId: contract.id,
        category: 'contract',
        meta: { route: '/clm' },
        dedupeKey: `contract-soon:${contract.id}:${this.today()}`,
      });
      created += 1;
    }
    return created;
  }

  private isWithinDays(dateValue: string | undefined, limitDays: number) {
    if (!dateValue) return false;
    const diff = this.diffDays(dateValue);
    return diff >= 0 && diff <= limitDays;
  }

  private async storeBase64File(base64Content: string, fileName: string, mimeType: string) {
    const cleanBase64 = base64Content.includes(',') ? base64Content.split(',')[1] : base64Content;
    const buffer = Buffer.from(cleanBase64, 'base64');
    return this.storage.put(buffer, fileName, mimeType);
  }

  private getExtension(fileName: string) {
    const parts = fileName.split('.');
    return parts.length > 1 ? parts.at(-1)?.toLowerCase() : undefined;
  }

  private async log(
    contractId: string,
    actorId: string,
    action: string,
    beforeState?: Record<string, unknown>,
    afterState?: Record<string, unknown>
  ) {
    await this.auditLogs.save(
      this.auditLogs.create({ contractId, actorId, action, beforeState, afterState })
    );
  }

  private snapshotContract(contract: Contract) {
    return {
      id: contract.id,
      name: contract.name,
      status: contract.status,
      startDate: contract.startDate,
      endDate: contract.endDate,
      renewalDate: contract.renewalDate,
      amount: contract.amount,
      currency: contract.currency,
      responsibleUserId: contract.responsibleUserId,
      responsibleArea: contract.responsibleArea,
      contractType: contract.contractType,
      mainDocumentId: contract.mainDocumentId,
      closeReason: contract.closeReason,
      closedAt: contract.closedAt,
    };
  }

  private buildKnowledgeChunks(detail: Awaited<ReturnType<ClmService['getDetail']>>) {
    const chunks: Array<{ sourceType: string; label: string; text: string }> = [];
    chunks.push({
      sourceType: 'contract',
      label: 'Resumen del contrato',
      text: [
        `Contrato ${detail.name}.`,
        detail.supplierName ? `Proveedor: ${detail.supplierName}.` : undefined,
        detail.clientName ? `Cliente: ${detail.clientName}.` : undefined,
        detail.contractType ? `Tipo: ${detail.contractType}.` : undefined,
        detail.status ? `Estado: ${detail.status}.` : undefined,
        detail.startDate ? `Inicio: ${detail.startDate}.` : undefined,
        detail.endDate ? `Vencimiento: ${detail.endDate}.` : undefined,
        detail.renewalDate ? `Renovacion: ${detail.renewalDate}.` : undefined,
        detail.amount ? `Monto: ${detail.amount} ${detail.currency}.` : undefined,
      ]
        .filter(Boolean)
        .join(' '),
    });
    for (const obligation of detail.obligations) {
      chunks.push({
        sourceType: 'obligation',
        label: 'Obligacion contractual',
        text: `Obligacion: ${obligation.description}. Responsable: ${obligation.responsibleUser?.name ?? 'Sin asignar'}. Fecha compromiso: ${obligation.commitmentDate ?? 'Sin fecha'}. Estado: ${obligation.status}. Comentarios: ${obligation.comments ?? 'Sin comentarios'}.`,
      });
    }
    for (const milestone of detail.milestones) {
      chunks.push({
        sourceType: 'milestone',
        label: 'Hito contractual',
        text: `Hito: ${milestone.name}. Fecha: ${milestone.milestoneDate}. Responsable: ${milestone.responsibleUser?.name ?? 'Sin asignar'}. Estado: ${milestone.status}. Notas: ${milestone.notes ?? 'Sin notas'}.`,
      });
    }
    for (const comment of detail.comments) {
      chunks.push({
        sourceType: 'comment',
        label: 'Comentario',
        text: `Comentario de ${comment.author?.name ?? 'usuario'}: ${comment.body}`,
      });
    }
    for (const version of detail.versions) {
      chunks.push({
        sourceType: 'version',
        label: `Version ${version.versionLabel}`,
        text: `Version ${version.versionLabel} del archivo ${version.fileName}. Resumen de cambios: ${version.changeSummary ?? 'Sin resumen de cambios'}.`,
      });
    }
    return chunks;
  }

  private scoreChunk(question: string, text: string) {
    const left = this.tokenize(question);
    const right = this.tokenize(text);
    if (!left.length || !right.length) return 0;
    const set = new Set(right);
    let matches = 0;
    for (const token of left) {
      if (set.has(token)) matches += 1;
    }
    const keywordScore = matches / left.length;
    const semanticScore = this.cosine(this.embedding(question), this.embedding(text));
    return keywordScore * 0.45 + semanticScore * 0.55;
  }

  private embedding(value: string) {
    const vector = new Array<number>(96).fill(0);
    for (const token of this.tokenize(value)) {
      const hash = createHash('sha256').update(token).digest();
      const index = hash.readUInt16BE(0) % vector.length;
      vector[index] += hash[2] % 2 === 0 ? 1 : -1;
    }
    const norm = Math.sqrt(vector.reduce((sum, item) => sum + item * item, 0)) || 1;
    return vector.map((item) => item / norm);
  }

  private cosine(a: number[], b: number[]) {
    return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
  }

  private tokenize(value: string) {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, ' ')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
}
