"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClmService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const crypto_1 = require("crypto");
const typeorm_2 = require("typeorm");
const access_scope_service_1 = require("../../common/access-scope.service");
const storage_service_1 = require("../../storage/storage.service");
const notifications_service_1 = require("../notifications/notifications.service");
const document_entity_1 = require("../documents/document.entity");
const document_version_entity_1 = require("../versions/document-version.entity");
const contract_attachment_entity_1 = require("./contract-attachment.entity");
const contract_audit_log_entity_1 = require("./contract-audit-log.entity");
const contract_comment_entity_1 = require("./contract-comment.entity");
const contract_milestone_entity_1 = require("./contract-milestone.entity");
const contract_obligation_entity_1 = require("./contract-obligation.entity");
const contract_version_entity_1 = require("./contract-version.entity");
const contract_entity_1 = require("./contract.entity");
const CONTRACT_SOON_DAYS = 30;
let ClmService = class ClmService {
    contracts;
    versions;
    attachments;
    obligations;
    milestones;
    comments;
    auditLogs;
    documents;
    documentVersions;
    scope;
    storage;
    notifications;
    constructor(contracts, versions, attachments, obligations, milestones, comments, auditLogs, documents, documentVersions, scope, storage, notifications) {
        this.contracts = contracts;
        this.versions = versions;
        this.attachments = attachments;
        this.obligations = obligations;
        this.milestones = milestones;
        this.comments = comments;
        this.auditLogs = auditLogs;
        this.documents = documents;
        this.documentVersions = documentVersions;
        this.scope = scope;
        this.storage = storage;
        this.notifications = notifications;
    }
    async list(userId, projectId) {
        const projectIds = projectId ? [projectId] : await this.scope.visibleProjectIdsForUser(userId);
        if (projectId && !(await this.scope.canAccessProject(userId, projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
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
    async create(userId, dto) {
        await this.assertProjectAccess(userId, dto.projectId);
        await this.assertDocumentBelongsToProject(dto.projectId, dto.mainDocumentId);
        const contract = await this.contracts.save(this.contracts.create({
            ...dto,
            endDate: dto.endDate,
            renewalDate: dto.renewalDate,
            renewalNoticeDays: dto.renewalNoticeDays ? Number(dto.renewalNoticeDays) : 30,
            createdById: userId,
            status: this.normalizeStatus(dto.status, dto.endDate)
        }));
        await this.log(contract.id, userId, 'create', undefined, {
            name: contract.name,
            status: contract.status
        });
        await this.syncAlerts(contract);
        return this.getDetail(userId, contract.id, false);
    }
    async getDetail(userId, contractId, logView = true) {
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
    async update(userId, contractId, dto) {
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
    async createVersion(userId, contractId, dto) {
        const contract = await this.assertContractAccess(userId, contractId);
        const stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);
        const version = await this.versions.save(this.versions.create({
            contractId,
            versionLabel: dto.versionLabel,
            fileKey: stored.key,
            fileName: dto.fileName,
            fileExtension: this.getExtension(dto.fileName),
            mimeType: dto.mimeType,
            sizeBytes: Number(dto.sizeBytes ?? stored.sizeBytes),
            uploadedById: userId,
            changeSummary: dto.changeSummary
        }));
        contract.currentVersionId = version.id;
        if (!contract.status || contract.status === 'draft') {
            contract.status = 'in_review';
        }
        await this.contracts.save(contract);
        await this.log(contractId, userId, 'upload_new_version', { previousVersionId: contract.currentVersionId }, { versionId: version.id });
        return this.getDetail(userId, contractId, false);
    }
    async addAttachment(userId, contractId, dto) {
        await this.assertContractAccess(userId, contractId);
        const stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);
        const attachment = await this.attachments.save(this.attachments.create({
            contractId,
            name: dto.name,
            fileKey: stored.key,
            fileName: dto.fileName,
            fileExtension: this.getExtension(dto.fileName),
            mimeType: dto.mimeType,
            sizeBytes: Number(dto.sizeBytes ?? stored.sizeBytes),
            uploadedById: userId,
            notes: dto.notes
        }));
        await this.log(contractId, userId, 'add_attachment', undefined, { attachmentId: attachment.id, fileName: attachment.fileName });
        return this.getDetail(userId, contractId, false);
    }
    async addObligation(userId, contractId, dto) {
        const contract = await this.assertContractAccess(userId, contractId);
        await this.assertDocumentBelongsToProject(contract.projectId, dto.evidenceDocumentId);
        const obligation = await this.obligations.save(this.obligations.create({
            contractId,
            description: dto.description,
            responsibleUserId: dto.responsibleUserId,
            commitmentDate: dto.commitmentDate,
            status: this.normalizeObligationStatus(dto.status, dto.commitmentDate),
            evidenceDocumentId: dto.evidenceDocumentId,
            comments: dto.comments
        }));
        await this.log(contractId, userId, 'add_obligation', undefined, { obligationId: obligation.id, description: obligation.description });
        await this.syncAlerts(contract);
        return this.getDetail(userId, contractId, false);
    }
    async updateObligation(userId, contractId, obligationId, dto) {
        const contract = await this.assertContractAccess(userId, contractId);
        const obligation = await this.obligations.findOne({ where: { id: obligationId, contractId } });
        if (!obligation) {
            throw new common_1.NotFoundException('Obligacion no encontrada');
        }
        await this.assertDocumentBelongsToProject(contract.projectId, dto.evidenceDocumentId);
        const before = { ...obligation };
        Object.assign(obligation, dto);
        obligation.status = this.normalizeObligationStatus(dto.status ?? obligation.status, dto.commitmentDate ?? obligation.commitmentDate);
        await this.obligations.save(obligation);
        await this.log(contractId, userId, 'edit_obligation', before, obligation);
        await this.syncAlerts(contract);
        return this.getDetail(userId, contractId, false);
    }
    async addMilestone(userId, contractId, dto) {
        const contract = await this.assertContractAccess(userId, contractId);
        await this.assertDocumentBelongsToProject(contract.projectId, dto.evidenceDocumentId);
        const milestone = await this.milestones.save(this.milestones.create({
            contractId,
            name: dto.name,
            milestoneDate: dto.milestoneDate,
            responsibleUserId: dto.responsibleUserId,
            status: dto.status ?? 'pending',
            evidenceDocumentId: dto.evidenceDocumentId,
            notes: dto.notes
        }));
        await this.log(contractId, userId, 'add_milestone', undefined, { milestoneId: milestone.id, name: milestone.name });
        await this.syncAlerts(contract);
        return this.getDetail(userId, contractId, false);
    }
    async updateMilestone(userId, contractId, milestoneId, dto) {
        const contract = await this.assertContractAccess(userId, contractId);
        const milestone = await this.milestones.findOne({ where: { id: milestoneId, contractId } });
        if (!milestone) {
            throw new common_1.NotFoundException('Hito no encontrado');
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
        await this.log(contractId, userId, 'edit_milestone', before, milestone);
        await this.syncAlerts(contract);
        return this.getDetail(userId, contractId, false);
    }
    async addComment(userId, contractId, dto) {
        await this.assertContractAccess(userId, contractId);
        const comment = await this.comments.save(this.comments.create({
            contractId,
            authorId: userId,
            body: dto.body
        }));
        await this.log(contractId, userId, 'comment', undefined, { commentId: comment.id });
        return this.getDetail(userId, contractId, false);
    }
    async close(userId, contractId, dto) {
        const contract = await this.assertContractAccess(userId, contractId);
        const before = this.snapshotContract(contract);
        contract.status = 'closed';
        contract.closedAt = new Date();
        contract.closeReason = dto.closeReason;
        await this.contracts.save(contract);
        await this.log(contractId, userId, 'close', before, this.snapshotContract(contract));
        return this.getDetail(userId, contractId, false);
    }
    async renew(userId, contractId, dto) {
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
    async synchronizeAlerts(userId, projectId) {
        const contracts = await this.listContractsForAlerts(userId, projectId);
        let created = 0;
        for (const contract of contracts) {
            created += await this.syncAlerts(contract);
        }
        return { ok: true, alertsCreated: created, contractsProcessed: contracts.length };
    }
    async ask(userId, contractId, dto) {
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
    async listContractsForAlerts(userId, projectId) {
        const projectIds = projectId ? [projectId] : await this.scope.visibleProjectIdsForUser(userId);
        if (projectId && !(await this.scope.canAccessProject(userId, projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
        }
        if (!projectIds.length) {
            return [];
        }
        return this.contracts.find({ where: projectIds.map((id) => ({ projectId: id })), relations: ['responsibleUser'] });
    }
    async assertContractAccess(userId, contractId) {
        const contract = await this.contracts.findOne({
            where: { id: contractId },
            relations: ['project', 'responsibleUser', 'mainDocument']
        });
        if (!contract) {
            throw new common_1.NotFoundException('Contrato no encontrado');
        }
        await this.assertProjectAccess(userId, contract.projectId);
        return contract;
    }
    async assertProjectAccess(userId, projectId) {
        if (!(await this.scope.canAccessProject(userId, projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
        }
    }
    async assertDocumentBelongsToProject(projectId, documentId) {
        if (!documentId) {
            return;
        }
        const document = await this.documents.findOne({ where: { id: documentId } });
        if (!document || document.projectId !== projectId) {
            throw new common_1.ForbiddenException('El documento indicado no pertenece al proyecto del contrato');
        }
    }
    async toListItem(contract) {
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
    normalizeStatus(status, endDate) {
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
    normalizeObligationStatus(status, commitmentDate) {
        if (status === 'completed' || status === 'waived') {
            return status;
        }
        if (this.isExpired(commitmentDate)) {
            return 'overdue';
        }
        return status ?? 'pending';
    }
    isExpired(dateValue) {
        if (!dateValue) {
            return false;
        }
        return this.diffDays(dateValue) < 0;
    }
    isExpiringSoon(dateValue) {
        if (!dateValue || this.isExpired(dateValue)) {
            return false;
        }
        return this.diffDays(dateValue) <= CONTRACT_SOON_DAYS;
    }
    diffDays(dateValue) {
        const today = new Date();
        const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const b = new Date(`${dateValue}T00:00:00`);
        return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
    }
    async syncAlerts(contract) {
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
    async storeBase64File(base64Content, fileName, mimeType) {
        const cleanBase64 = base64Content.includes(',') ? base64Content.split(',')[1] : base64Content;
        const buffer = Buffer.from(cleanBase64, 'base64');
        return this.storage.put(buffer, fileName, mimeType);
    }
    getExtension(fileName) {
        const parts = fileName.split('.');
        return parts.length > 1 ? parts.at(-1)?.toLowerCase() : undefined;
    }
    async log(contractId, actorId, action, beforeState, afterState) {
        await this.auditLogs.save(this.auditLogs.create({
            contractId,
            actorId,
            action,
            beforeState,
            afterState
        }));
    }
    snapshotContract(contract) {
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
    buildKnowledgeChunks(detail) {
        const chunks = [];
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
    scoreChunk(question, text) {
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
    embedding(value) {
        const vector = new Array(96).fill(0);
        for (const token of this.tokenize(value)) {
            const hash = (0, crypto_1.createHash)('sha256').update(token).digest();
            const index = hash.readUInt16BE(0) % vector.length;
            vector[index] += hash[2] % 2 === 0 ? 1 : -1;
        }
        const norm = Math.sqrt(vector.reduce((sum, item) => sum + item * item, 0)) || 1;
        return vector.map((item) => item / norm);
    }
    cosine(a, b) {
        return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
    }
    tokenize(value) {
        return value
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
            .split(/\s+/)
            .filter((token) => token.length > 2);
    }
    today() {
        return new Date().toISOString().slice(0, 10);
    }
};
exports.ClmService = ClmService;
exports.ClmService = ClmService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __param(1, (0, typeorm_1.InjectRepository)(contract_version_entity_1.ContractVersion)),
    __param(2, (0, typeorm_1.InjectRepository)(contract_attachment_entity_1.ContractAttachment)),
    __param(3, (0, typeorm_1.InjectRepository)(contract_obligation_entity_1.ContractObligation)),
    __param(4, (0, typeorm_1.InjectRepository)(contract_milestone_entity_1.ContractMilestone)),
    __param(5, (0, typeorm_1.InjectRepository)(contract_comment_entity_1.ContractComment)),
    __param(6, (0, typeorm_1.InjectRepository)(contract_audit_log_entity_1.ContractAuditLog)),
    __param(7, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __param(8, (0, typeorm_1.InjectRepository)(document_version_entity_1.DocumentVersion)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        access_scope_service_1.AccessScopeService,
        storage_service_1.StorageService,
        notifications_service_1.NotificationsService])
], ClmService);
//# sourceMappingURL=clm.service.js.map