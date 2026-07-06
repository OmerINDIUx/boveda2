import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { StorageService } from '../../storage/storage.service';
import { NotificationsService } from '../notifications/notifications.service';
import { DocumentRecord } from '../documents/document.entity';
import { DocumentVersion } from '../versions/document-version.entity';
import { AskContractQueryDto } from './dto/ask-contract-query.dto';
import { CloseContractDto } from './dto/close-contract.dto';
import { CreateContractAttachmentDto } from './dto/create-contract-attachment.dto';
import { CreateContractCommentDto } from './dto/create-contract-comment.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateContractMilestoneDto } from './dto/create-contract-milestone.dto';
import { CreateContractObligationDto } from './dto/create-contract-obligation.dto';
import { CreateContractVersionDto } from './dto/create-contract-version.dto';
import { RenewContractDto } from './dto/renew-contract.dto';
import { UpdateContractMilestoneDto } from './dto/update-contract-milestone.dto';
import { UpdateContractObligationDto } from './dto/update-contract-obligation.dto';
import { UpdateContractDto } from './dto/update-contract.dto';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractAuditLog } from './contract-audit-log.entity';
import { ContractComment } from './contract-comment.entity';
import { ContractMilestone } from './contract-milestone.entity';
import { ContractObligation } from './contract-obligation.entity';
import { ContractVersion } from './contract-version.entity';
import { Contract } from './contract.entity';

const CONTRACT_SOON_DAYS = 30;

@Injectable()
export class ClmService {
  constructor(
    @InjectRepository(Contract) private readonly contracts: Repository<Contract>,
    @InjectRepository(ContractVersion) private readonly versions: Repository<ContractVersion>,
    @InjectRepository(ContractAttachment) private readonly attachments: Repository<ContractAttachment>,
    @InjectRepository(ContractObligation) private readonly obligations: Repository<ContractObligation>,
    @InjectRepository(ContractMilestone) private readonly milestones: Repository<ContractMilestone>,
    @InjectRepository(ContractComment) private readonly comments: Repository<ContractComment>,
    @InjectRepository(ContractAuditLog) private readonly auditLogs: Repository<ContractAuditLog>,
    @InjectRepository(DocumentRecord) private readonly documents: Repository<DocumentRecord>,
    @InjectRepository(DocumentVersion) private readonly documentVersions: Repository<DocumentVersion>,
    private readonly scope: AccessScopeService,
    private readonly storage: StorageService,
    private readonly notifications: NotificationsService
  ) {}

  async list(userId: string, projectId?: string) {
    const projectIds = projectId ? [projectId] : await this.scope.visibleProjectIdsForUser(userId);
    if (projectId && !(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    if (!projectIds.length) {
      return [];
    }

    const items = await this.contracts.find({
      where: projectId ? { projectId } : projectIds.map((id) => ({ projectId: id })),
      relations: ['project', 'responsibleUser', 'mainDocument'],
      order: { updatedAt: 'DESC' }
    });

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
        createdById: userId,
        status: this.normalizeStatus(dto.status, dto.endDate)
      })
    );

    await this.log(contract.id, userId, 'create', undefined, {
      name: contract.name,
      status: contract.status
    });

    await this.syncAlerts(contract);
    return this.getDetail(userId, contract.id, false);
  }

  async getDetail(userId: string, contractId: string, logView = true) {
    const contract = await this.assertContractAccess(userId, contractId);
    const [versions, attachments, obligations, milestones, comments, audit] = await Promise.all([
      this.versions.find({ where: { contractId }, relations: ['uploadedBy'], order: { createdAt: 'DESC' } }),
      this.attachments.find({ where: { contractId }, relations: ['uploadedBy'], order: { createdAt: 'DESC' } }),
      this.obligations.find({ where: { contractId }, relations: ['responsibleUser', 'evidenceDocument'], order: { createdAt: 'DESC' } }),
      this.milestones.find({ where: { contractId }, relations: ['responsibleUser', 'evidenceDocument'], order: { milestoneDate: 'ASC' } }),
      this.comments.find({ where: { contractId }, relations: ['author'], order: { createdAt: 'DESC' } }),
      this.auditLogs.find({ where: { contractId }, order: { createdAt: 'DESC' } })
    ]);

    if (logView) {
      await this.log(contractId, userId, 'view');
    }

    const currentVersion = versions.find((item) => item.id === contract.currentVersionId) ?? versions[0] ?? null;

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
        author: comment.author ? { id: comment.author.id, name: comment.author.name, email: comment.author.email } : null
      })),
      audit
    };
  }

  async update(userId: string, contractId: string, dto: UpdateContractDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    await this.assertDocumentBelongsToProject(contract.projectId, dto.mainDocumentId);
    const before = { ...contract };

    Object.assign(contract, {
      ...dto,
      renewalNoticeDays: dto.renewalNoticeDays ? Number(dto.renewalNoticeDays) : contract.renewalNoticeDays
    });
    contract.status = this.normalizeStatus(dto.status ?? contract.status, dto.endDate ?? contract.endDate);

    await this.contracts.save(contract);
    await this.log(contractId, userId, 'edit', this.snapshotContract(before), this.snapshotContract(contract));
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
        changeSummary: dto.changeSummary
      })
    );

    contract.currentVersionId = version.id;
    if (!contract.status || contract.status === 'draft') {
      contract.status = 'in_review';
    }
    await this.contracts.save(contract);
    await this.log(contractId, userId, 'upload_new_version', { previousVersionId: contract.currentVersionId }, { versionId: version.id });
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
        notes: dto.notes
      })
    );
    await this.log(contractId, userId, 'add_attachment', undefined, { attachmentId: attachment.id, fileName: attachment.fileName });
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
        comments: dto.comments
      })
    );
    await this.log(contractId, userId, 'add_obligation', undefined, { obligationId: obligation.id, description: obligation.description });
    await this.syncAlerts(contract);
    return this.getDetail(userId, contractId, false);
  }

  async updateObligation(userId: string, contractId: string, obligationId: string, dto: UpdateContractObligationDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    const obligation = await this.obligations.findOne({ where: { id: obligationId, contractId } });
    if (!obligation) {
      throw new NotFoundException('Obligacion no encontrada');
    }
    await this.assertDocumentBelongsToProject(contract.projectId, dto.evidenceDocumentId);
    const before = { ...obligation };
    Object.assign(obligation, dto);
    obligation.status = this.normalizeObligationStatus(dto.status ?? obligation.status, dto.commitmentDate ?? obligation.commitmentDate);
    await this.obligations.save(obligation);
    await this.log(contractId, userId, 'edit_obligation', before as Record<string, unknown>, obligation as unknown as Record<string, unknown>);
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
        notes: dto.notes
      })
    );
    await this.log(contractId, userId, 'add_milestone', undefined, { milestoneId: milestone.id, name: milestone.name });
    await this.syncAlerts(contract);
    return this.getDetail(userId, contractId, false);
  }

  async updateMilestone(userId: string, contractId: string, milestoneId: string, dto: UpdateContractMilestoneDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    const milestone = await this.milestones.findOne({ where: { id: milestoneId, contractId } });
    if (!milestone) {
      throw new NotFoundException('Hito no encontrado');
    }
    await this.assertDocumentBelongsToProject(contract.projectId, dto.evidenceDocumentId);
    const before = { ...milestone };
    Object.assign(milestone, dto);
    if (milestone.status === 'completed' && !milestone.completedAt) {
      milestone.completedAt = new Date();
    }
    if (milestone.status !== 'completed') {
      milestone.completedAt = undefined;
    }
    await this.milestones.save(milestone);
    await this.log(contractId, userId, 'edit_milestone', before as Record<string, unknown>, milestone as unknown as Record<string, unknown>);
    await this.syncAlerts(contract);
    return this.getDetail(userId, contractId, false);
  }

  async addComment(userId: string, contractId: string, dto: CreateContractCommentDto) {
    await this.assertContractAccess(userId, contractId);
    const comment = await this.comments.save(
      this.comments.create({
        contractId,
        authorId: userId,
        body: dto.body
      })
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

  async ask(userId: string, contractId: string, dto: AskContractQueryDto) {
    const contract = await this.assertContractAccess(userId, contractId);
    const detail = await this.getDetail(userId, contractId, false);
    const chunks = this.buildKnowledgeChunks(detail);
    const scored = chunks
      .map((chunk) => ({
        ...chunk,
        score: this.scoreChunk(dto.question, chunk.text)
      }))
      .filter((chunk) => chunk.score > 0.12)
      .sort((left, right) => right.score - left.score)
      .slice(0, 6);

    await this.log(contractId, userId, 'ask_ai', undefined, { question: dto.question, citations: scored.length });

    if (!scored.length) {
      return {
        answer: 'No encontre informacion suficiente en este contrato para responder con seguridad.',
        status: 'insufficient_information',
        citations: []
      };
    }

    return {
      answer: scored.map((item, index) => `${index + 1}. ${item.text}`).join('\n'),
      status: 'answered',
      citations: scored.map((item) => ({
        sourceType: item.sourceType,
        label: item.label,
        fragment: item.text
      }))
    };
  }

  private async listContractsForAlerts(userId: string, projectId?: string) {
    const projectIds = projectId ? [projectId] : await this.scope.visibleProjectIdsForUser(userId);
    if (projectId && !(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
    if (!projectIds.length) {
      return [];
    }
    return this.contracts.find({ where: projectIds.map((id) => ({ projectId: id })), relations: ['responsibleUser'] });
  }

  private async assertContractAccess(userId: string, contractId: string) {
    const contract = await this.contracts.findOne({
      where: { id: contractId },
      relations: ['project', 'responsibleUser', 'mainDocument']
    });
    if (!contract) {
      throw new NotFoundException('Contrato no encontrado');
    }
    await this.assertProjectAccess(userId, contract.projectId);
    return contract;
  }

  private async assertProjectAccess(userId: string, projectId: string) {
    if (!(await this.scope.canAccessProject(userId, projectId))) {
      throw new ForbiddenException('No tienes acceso a este proyecto');
    }
  }

  private async assertDocumentBelongsToProject(projectId: string, documentId?: string) {
    if (!documentId) {
      return;
    }
    const document = await this.documents.findOne({ where: { id: documentId } });
    if (!document || document.projectId !== projectId) {
      throw new ForbiddenException('El documento indicado no pertenece al proyecto del contrato');
    }
  }

  private async toListItem(contract: Contract) {
    const obligationRows = await this.obligations.find({ where: { contractId: contract.id } });
    const pendingObligations = obligationRows.filter((item) => this.normalizeObligationStatus(item.status, item.commitmentDate) !== 'completed').length;
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
            documentNumber: contract.mainDocument.documentNumber
          }
        : null,
      pendingObligations
    };
  }

  private normalizeStatus(status: Contract['status'] | undefined, endDate?: string) {
    if (status === 'closed' || status === 'renewed') {
      return status;
    }

    if (this.isExpired(endDate)) {
      return 'expired';
    }
    if (this.isExpiringSoon(endDate)) {
      return 'expiring_soon';
    }

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

  private normalizeObligationStatus(status: ContractObligation['status'] | undefined, commitmentDate?: string) {
    if (status === 'completed' || status === 'waived') {
      return status;
    }
    if (this.isExpired(commitmentDate)) {
      return 'overdue';
    }
    return status ?? 'pending';
  }

  private isExpired(dateValue?: string) {
    if (!dateValue) {
      return false;
    }
    return this.diffDays(dateValue) < 0;
  }

  private isExpiringSoon(dateValue?: string) {
    if (!dateValue || this.isExpired(dateValue)) {
      return false;
    }
    return this.diffDays(dateValue) <= CONTRACT_SOON_DAYS;
  }

  private diffDays(dateValue: string) {
    const today = new Date();
    const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const b = new Date(`${dateValue}T00:00:00`);
    return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
  }

  private async syncAlerts(contract: Contract) {
    if (!contract.responsibleUserId) {
      return 0;
    }
    let created = 0;
    if (this.isExpiringSoon(contract.endDate) || contract.status === 'expiring_soon') {
      await this.notifications.notify({
        recipients: [{ userId: contract.responsibleUserId }],
        notificationType: 'contract_expiring_soon',
        title: `Contrato proximo a vencer: ${contract.name}`,
        body: `El contrato ${contract.name} vence el ${contract.endDate ?? 'sin fecha definida'}.`,
        entityType: 'contract',
        entityId: contract.id,
        category: 'contract',
        meta: { route: '/clm' },
        dedupeKey: `contract-soon:${contract.id}:${this.today()}`
      });
      created += 1;
    }
    return created;
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
      this.auditLogs.create({
        contractId,
        actorId,
        action,
        beforeState,
        afterState
      })
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
      closedAt: contract.closedAt
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
        detail.amount ? `Monto: ${detail.amount} ${detail.currency}.` : undefined
      ]
        .filter(Boolean)
        .join(' ')
    });

    for (const obligation of detail.obligations) {
      chunks.push({
        sourceType: 'obligation',
        label: 'Obligacion contractual',
        text: `Obligacion: ${obligation.description}. Responsable: ${obligation.responsibleUser?.name ?? 'Sin asignar'}. Fecha compromiso: ${obligation.commitmentDate ?? 'Sin fecha'}. Estado: ${obligation.status}. Comentarios: ${obligation.comments ?? 'Sin comentarios'}.`
      });
    }

    for (const milestone of detail.milestones) {
      chunks.push({
        sourceType: 'milestone',
        label: 'Hito contractual',
        text: `Hito: ${milestone.name}. Fecha: ${milestone.milestoneDate}. Responsable: ${milestone.responsibleUser?.name ?? 'Sin asignar'}. Estado: ${milestone.status}. Notas: ${milestone.notes ?? 'Sin notas'}.`
      });
    }

    for (const comment of detail.comments) {
      chunks.push({
        sourceType: 'comment',
        label: 'Comentario',
        text: `Comentario de ${comment.author?.name ?? 'usuario'}: ${comment.body}`
      });
    }

    for (const version of detail.versions) {
      chunks.push({
        sourceType: 'version',
        label: `Version ${version.versionLabel}`,
        text: `Version ${version.versionLabel} del archivo ${version.fileName}. Resumen de cambios: ${version.changeSummary ?? 'Sin resumen de cambios'}.`
      });
    }

    return chunks;
  }

  private scoreChunk(question: string, text: string) {
    const left = this.tokenize(question);
    const right = this.tokenize(text);
    if (!left.length || !right.length) {
      return 0;
    }

    const set = new Set(right);
    let matches = 0;
    for (const token of left) {
      if (set.has(token)) {
        matches += 1;
      }
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
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2);
  }

  private today() {
    return new Date().toISOString().slice(0, 10);
  }
}
