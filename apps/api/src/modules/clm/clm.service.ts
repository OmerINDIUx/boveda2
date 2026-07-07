import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository, Brackets } from 'typeorm';
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
import { ContractAmendment } from './entities/contract-amendment.entity';
import { ContractClause } from './entities/contract-clause.entity';
import { ContractCustomField } from './entities/contract-custom-field.entity';
import { ContractCustomValue } from './entities/contract-custom-value.entity';
import { ContractImportLog } from './entities/contract-import-log.entity';
import { ContractNegotiation } from './entities/contract-negotiation.entity';
import { ContractPayment } from './entities/contract-payment.entity';
import { ContractSignatureRequest } from './entities/contract-signature-request.entity';
import { ContractTemplate } from './entities/contract-template.entity';
import { Tag } from './entities/tag.entity';
import { SignatureProvider } from './signature/signature-provider.interface';
import { StubSignatureProvider } from './signature/stub-signature.provider';
import { ReportGeneratorService } from './reports/report-generator.service';
import { ReportType } from './reports/report-types';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractAuditLog } from './contract-audit-log.entity';
import { ContractComment } from './contract-comment.entity';
import { ContractMilestone } from './contract-milestone.entity';
import { ContractObligation } from './contract-obligation.entity';
import { ContractVersion } from './contract-version.entity';
import { Contract } from './contract.entity';
import { CreateReportDto } from './dto/create-report.dto';

const CONTRACT_SOON_DAYS = 30;

@Injectable()
export class ClmService {
  private signatureProvider: SignatureProvider;

  constructor(
    @InjectRepository(Contract) private readonly contracts: Repository<Contract>,
    @InjectRepository(ContractVersion) private readonly versions: Repository<ContractVersion>,
    @InjectRepository(ContractAttachment)
    private readonly attachments: Repository<ContractAttachment>,
    @InjectRepository(ContractObligation)
    private readonly obligations: Repository<ContractObligation>,
    @InjectRepository(ContractMilestone) private readonly milestones: Repository<ContractMilestone>,
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
    private readonly scope: AccessScopeService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService,
    private readonly reportGenerator: ReportGeneratorService
  ) {
    this.signatureProvider = new StubSignatureProvider();
  }

  async list(userId: string, search?: ContractSearchDto) {
    const projectIds = search?.projectId
      ? [search.projectId]
      : await this.scope.visibleProjectIdsForUser(userId);
    if (search?.projectId && !(await this.scope.canAccessProject(userId, search.projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
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
    const [
      versions,
      attachments,
      obligations,
      milestones,
      comments,
      audit,
      amendments,
      payments,
      signatures,
      negotiations,
      tags,
      customValues,
      children,
    ] = await Promise.all([
      this.versions.find({
        where: { contractId },
        relations: ['uploadedBy'],
        order: { createdAt: 'DESC' },
      }),
      this.attachments.find({
        where: { contractId },
        relations: ['uploadedBy'],
        order: { createdAt: 'DESC' },
      }),
      this.obligations.find({
        where: { contractId },
        relations: ['responsibleUser', 'evidenceDocument'],
        order: { createdAt: 'DESC' },
      }),
      this.milestones.find({
        where: { contractId },
        relations: ['responsibleUser', 'evidenceDocument'],
        order: { milestoneDate: 'ASC' },
      }),
      this.comments.find({
        where: { contractId },
        relations: ['author'],
        order: { createdAt: 'DESC' },
      }),
      this.auditLogs.find({
        where: { contractId },
        relations: ['actor'],
        order: { createdAt: 'DESC' },
      }),
      this.amendmentsRepo.find({ where: { contractId }, order: { createdAt: 'DESC' } }),
      this.paymentsRepo.find({ where: { contractId }, order: { createdAt: 'DESC' } }),
      this.signaturesRepo.find({
        where: { contractId },
        relations: ['createdBy'],
        order: { createdAt: 'DESC' },
      }),
      this.negotiationsRepo.find({
        where: { contractId },
        relations: ['createdBy'],
        order: { createdAt: 'DESC' },
      }),
      this.tagsRepo
        .createQueryBuilder('t')
        .innerJoin('contract_tags', 'ct', 'ct.tag_id = t.id')
        .where('ct.contract_id = :contractId', { contractId })
        .getMany(),
      this.customValuesRepo.find({ where: { contractId }, relations: ['field'] }),
      this.contracts.find({
        where: { parentContractId: contractId },
        order: { createdAt: 'DESC' },
      }),
    ]);

    if (logView) {
      await this.log(contractId, userId, 'view');
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
        provider: s.provider,
        status: s.status,
        signersJson: s.signersJson,
        signedAt: s.signedAt,
        createdAt: s.createdAt,
        createdBy: s.createdBy ? { id: s.createdBy.id, name: s.createdBy.name } : null,
      })),
      negotiations,
      tags,
      customValues,
      childrenContracts: children.map((c) => ({ id: c.id, name: c.name, status: c.status })),
    };
  }

  async update(userId: string, contractId: string, dto: UpdateContractDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    await this.assertDocumentBelongsToProject(contract.projectId, dto.mainDocumentId);
    const before = { ...contract };

    Object.assign(contract, {
      ...dto,
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
    const stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);
    const version = await this.versions.save(
      this.versions.create({
        contractId,
        versionLabel: dto.versionLabel,
        fileKey: stored.key,
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
      { previousVersionId: contract.currentVersionId },
      { versionId: version.id }
    );
    return this.getDetail(userId, contractId, false);
  }

  async addAttachment(userId: string, contractId: string, dto: CreateContractAttachmentDto) {
    await this.assertContractAccess(userId, contractId);
    const stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);
    const attachment = await this.attachments.save(
      this.attachments.create({
        contractId,
        name: dto.name,
        fileKey: stored.key,
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
    return this.getDetail(userId, contractId, false);
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
    await this.assertContractAccess(userId, contractId);
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
    const payment = await this.paymentsRepo.save(
      this.paymentsRepo.create({ contractId, ...dto, createdById: userId })
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
    Object.assign(payment, dto);
    await this.paymentsRepo.save(payment);
    await this.log(contractId, userId, 'edit_payment', undefined, { paymentId });
    return this.getDetail(userId, contractId, false);
  }

  async sendForSignature(userId: string, contractId: string, dto: CreateSignatureRequestDto) {
    await this.assertContractAccess(userId, contractId);
    const version = dto.versionId
      ? await this.versions.findOne({ where: { id: dto.versionId, contractId } })
      : await this.versions.findOne({ where: { contractId }, order: { createdAt: 'DESC' } });

    if (!version) throw new NotFoundException('No hay version del contrato para firmar');

    const fileBuffer = await this.storage.read(version.fileKey);
    const base64Content = fileBuffer.toString('base64');

    const result = await this.signatureProvider.send({
      contractId,
      versionId: version.id,
      documentBase64: base64Content,
      fileName: version.fileName,
      signers: dto.signers,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });

    const signature = await this.signaturesRepo.save(
      this.signaturesRepo.create({
        contractId,
        versionId: version.id,
        provider: 'stub',
        providerRequestId: result.providerRequestId,
        status: result.status,
        signersJson: dto.signers as unknown as Record<string, unknown>,
        createdById: userId,
      })
    );

    await this.log(contractId, userId, 'send_for_signature', undefined, {
      signatureId: signature.id,
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
      if (status.status === 'completed' && signature.status !== 'completed') {
        signature.status = 'completed';
        signature.signedAt = status.signedAt ?? new Date();
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
      throw new ForbiddenException('No tienes acceso a este proyecto');
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
      throw new ForbiddenException('No tienes acceso a este proyecto');
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

  private async listContractsForAlerts(userId: string, projectId?: string) {
    const projectIds = projectId ? [projectId] : await this.scope.visibleProjectIdsForUser(userId);
    if (projectId && !(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
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
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
  }

  private async assertDocumentBelongsToProject(projectId: string, documentId?: string) {
    if (!documentId) return;
    const document = await this.documents.findOne({ where: { id: documentId } });
    if (!document || document.projectId !== projectId) {
      throw new ForbiddenException('El documento indicado no pertenece al proyecto del contrato');
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
