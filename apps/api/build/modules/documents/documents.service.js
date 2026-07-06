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
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const access_scope_service_1 = require("../../common/access-scope.service");
const storage_service_1 = require("../../storage/storage.service");
const notifications_service_1 = require("../notifications/notifications.service");
const approval_flow_entity_1 = require("../approvals/approval-flow.entity");
const approval_request_entity_1 = require("../approvals/approval-request.entity");
const document_version_entity_1 = require("../versions/document-version.entity");
const document_audit_log_entity_1 = require("./document-audit-log.entity");
const document_comment_entity_1 = require("./document-comment.entity");
const document_metadata_entity_1 = require("./document-metadata.entity");
const document_entity_1 = require("./document.entity");
const previewableMimeTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'text/plain'
];
let DocumentsService = class DocumentsService {
    documents;
    versions;
    approvalFlows;
    approvalRequests;
    metadata;
    auditLogs;
    comments;
    scope;
    storage;
    notifications;
    constructor(documents, versions, approvalFlows, approvalRequests, metadata, auditLogs, comments, scope, storage, notifications) {
        this.documents = documents;
        this.versions = versions;
        this.approvalFlows = approvalFlows;
        this.approvalRequests = approvalRequests;
        this.metadata = metadata;
        this.auditLogs = auditLogs;
        this.comments = comments;
        this.scope = scope;
        this.storage = storage;
        this.notifications = notifications;
    }
    async listVisible(userId, query) {
        const visibleProjectIds = query.projectId ? [] : await this.scope.visibleProjectIdsForUser(userId);
        if (query.projectId) {
            if (!(await this.scope.canAccessProject(userId, query.projectId))) {
                throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
            }
        }
        else if (!visibleProjectIds.length) {
            return [];
        }
        const builder = this.documents
            .createQueryBuilder('document')
            .leftJoinAndSelect('document.project', 'project')
            .leftJoinAndSelect('document.folder', 'folder')
            .leftJoinAndSelect('document.discipline', 'discipline')
            .leftJoinAndSelect('document.responsibleUser', 'responsibleUser')
            .where(query.projectId ? 'document.projectId = :projectId' : 'document.projectId IN (:...projectIds)', {
            projectId: query.projectId,
            projectIds: query.projectId ? undefined : visibleProjectIds
        })
            .orderBy('document.updatedAt', 'DESC');
        if (query.search) {
            builder.andWhere('(document.name LIKE :search OR document.documentNumber LIKE :search OR discipline.name LIKE :search OR project.name LIKE :search)', { search: `%${query.search}%` });
        }
        const items = await builder.getMany();
        return items.map((item) => this.toListItem(item));
    }
    async create(userId, dto) {
        if (!(await this.scope.canAccessProject(userId, dto.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
        }
        const stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);
        const document = await this.documents.save(this.documents.create({
            projectId: dto.projectId,
            folderId: dto.folderId,
            disciplineId: dto.disciplineId,
            responsibleUserId: dto.responsibleUserId,
            documentNumber: dto.documentNumber,
            name: dto.name ?? dto.title ?? dto.fileName,
            status: dto.status ?? 'draft',
            confidentialityLevel: dto.confidentialityLevel ?? 'internal',
            renewable: dto.renewable ?? false,
            dueDate: dto.dueDate,
            originalFileKey: stored.key,
            fileExtension: this.getExtension(dto.fileName),
            sizeBytes: dto.sizeBytes ?? stored.sizeBytes,
            uploadedById: userId
        }));
        const version = await this.versions.save(this.versions.create({
            documentId: document.id,
            revision: dto.revision ?? 'A',
            fileKey: stored.key,
            fileName: dto.fileName,
            fileExtension: this.getExtension(dto.fileName),
            mimeType: dto.mimeType,
            sizeBytes: dto.sizeBytes ?? stored.sizeBytes,
            uploadedById: userId,
            notes: dto.notes
        }));
        document.currentVersionId = version.id;
        await this.documents.save(document);
        if (dto.metadata?.length) {
            await this.metadata.save(dto.metadata.map((item) => this.metadata.create({
                documentId: document.id,
                metaKey: item.key,
                metaValue: item.value,
                valueType: item.type ?? 'string'
            })));
        }
        await this.log(document.id, userId, 'upload_new_version', undefined, {
            versionId: version.id,
            revision: version.revision,
            fileName: version.fileName
        });
        await this.notifyDocumentVersion(document.id, document.name, document.documentNumber, version.revision, [
            document.responsibleUserId,
            document.uploadedById
        ]);
        return this.getDetail(userId, document.id, false);
    }
    async getDetail(userId, documentId, logView = true) {
        const document = await this.documents.findOne({
            where: { id: documentId },
            relations: ['project', 'folder', 'discipline', 'responsibleUser', 'uploadedBy']
        });
        if (!document) {
            throw new common_1.NotFoundException('Documento no encontrado');
        }
        if (!(await this.scope.canAccessProject(userId, document.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este documento');
        }
        const [versions, metadata, comments, audit] = await Promise.all([
            this.versions.find({ where: { documentId }, relations: ['uploadedBy'], order: { createdAt: 'DESC' } }),
            this.metadata.find({ where: { documentId } }),
            this.comments.find({ where: { documentId }, relations: ['author'], order: { createdAt: 'DESC' } }),
            this.auditLogs.find({ where: { documentId }, order: { createdAt: 'DESC' } })
        ]);
        if (logView) {
            await this.log(document.id, userId, 'visualization');
        }
        const currentVersion = versions.find((version) => version.id === document.currentVersionId) ?? versions[0] ?? null;
        return {
            ...this.toListItem(document),
            project: document.project,
            folder: document.folder,
            discipline: document.discipline,
            responsibleUser: document.responsibleUser,
            uploadedBy: document.uploadedBy,
            currentVersion,
            preview: currentVersion
                ? {
                    available: previewableMimeTypes.includes(currentVersion.mimeType),
                    mimeType: currentVersion.mimeType,
                    url: `/api/documents/${document.id}/content`
                }
                : { available: false, mimeType: null, url: null },
            metadata,
            versions,
            comments: comments.map((comment) => ({
                id: comment.id,
                body: comment.body,
                createdAt: comment.createdAt,
                author: comment.author ? { id: comment.author.id, name: comment.author.name, email: comment.author.email } : null
            })),
            audit
        };
    }
    async update(userId, documentId, dto) {
        const document = await this.assertDocumentAccess(userId, documentId);
        const beforeState = {
            name: document.name,
            folderId: document.folderId,
            disciplineId: document.disciplineId,
            responsibleUserId: document.responsibleUserId,
            confidentialityLevel: document.confidentialityLevel,
            renewable: document.renewable,
            dueDate: document.dueDate,
            status: document.status
        };
        Object.assign(document, dto);
        if (dto.status === 'published' && !(await this.canPublish(document.id, document.projectId))) {
            throw new common_1.ForbiddenException('Este documento requiere aprobación antes de publicarse');
        }
        if (document.dueDate && new Date(`${document.dueDate}T00:00:00`).getTime() < new Date(new Date().toDateString()).getTime()) {
            document.status = 'expired';
        }
        await this.documents.save(document);
        await this.log(document.id, userId, 'edit', beforeState, dto);
        return this.getDetail(userId, documentId, false);
    }
    async createVersion(userId, documentId, dto) {
        const document = await this.assertDocumentAccess(userId, documentId);
        const stored = await this.storeBase64File(dto.base64Content, dto.fileName, dto.mimeType);
        const version = await this.versions.save(this.versions.create({
            documentId,
            revision: dto.revision,
            fileKey: stored.key,
            fileName: dto.fileName,
            fileExtension: this.getExtension(dto.fileName),
            mimeType: dto.mimeType,
            sizeBytes: dto.sizeBytes ?? stored.sizeBytes,
            uploadedById: userId,
            notes: dto.notes
        }));
        const previousVersionId = document.currentVersionId;
        document.currentVersionId = version.id;
        document.originalFileKey = stored.key;
        document.fileExtension = this.getExtension(dto.fileName);
        document.sizeBytes = dto.sizeBytes ?? stored.sizeBytes;
        document.uploadedById = userId;
        await this.documents.save(document);
        await this.log(document.id, userId, 'upload_new_version', { previousVersionId }, { versionId: version.id, revision: dto.revision });
        await this.notifyDocumentVersion(document.id, document.name, document.documentNumber, version.revision, [
            document.responsibleUserId,
            document.uploadedById
        ]);
        return this.getDetail(userId, documentId, false);
    }
    async addComment(userId, documentId, dto) {
        await this.assertDocumentAccess(userId, documentId);
        const comment = await this.comments.save(this.comments.create({
            documentId,
            authorId: userId,
            body: dto.body
        }));
        await this.log(documentId, userId, 'comment', undefined, { commentId: comment.id });
        return this.getDetail(userId, documentId, false);
    }
    async requestApproval(userId, documentId) {
        const document = await this.assertDocumentAccess(userId, documentId);
        const beforeStatus = document.status;
        document.status = 'pending_approval';
        await this.documents.save(document);
        await this.log(documentId, userId, 'request_approval', { status: beforeStatus }, { status: document.status });
        return this.getDetail(userId, documentId, false);
    }
    async approve(userId, documentId) {
        const document = await this.assertDocumentAccess(userId, documentId);
        const beforeStatus = document.status;
        document.status = 'approved';
        await this.documents.save(document);
        await this.log(documentId, userId, 'approval', { status: beforeStatus }, { status: document.status });
        await this.notifyDocumentDecision(document.id, document.name, document.documentNumber, 'approved', [
            document.responsibleUserId,
            document.uploadedById
        ]);
        return this.getDetail(userId, documentId, false);
    }
    async reject(userId, documentId) {
        const document = await this.assertDocumentAccess(userId, documentId);
        const beforeStatus = document.status;
        document.status = 'in_review';
        await this.documents.save(document);
        await this.log(documentId, userId, 'rejection', { status: beforeStatus }, { status: document.status });
        await this.notifyDocumentDecision(document.id, document.name, document.documentNumber, 'rejected', [
            document.responsibleUserId,
            document.uploadedById
        ]);
        return this.getDetail(userId, documentId, false);
    }
    async getCurrentContent(userId, documentId) {
        const document = await this.assertDocumentAccess(userId, documentId);
        const version = await this.versions.findOne({ where: { id: document.currentVersionId ?? '' } });
        if (!version) {
            throw new common_1.NotFoundException('No hay versión actual para este documento');
        }
        return this.readCurrentVersion(document, version);
    }
    async download(userId, documentId) {
        const document = await this.assertDocumentAccess(userId, documentId);
        const version = await this.versions.findOne({ where: { id: document.currentVersionId ?? '' } });
        if (!version) {
            throw new common_1.NotFoundException('No hay versión actual para este documento');
        }
        const content = await this.readCurrentVersion(document, version);
        await this.log(documentId, userId, 'download');
        return content;
    }
    async print(userId, documentId) {
        const document = await this.assertDocumentAccess(userId, documentId);
        await this.log(document.id, userId, 'print');
        return { ok: true, documentId, action: 'print' };
    }
    async assertDocumentAccess(userId, documentId) {
        const document = await this.documents.findOne({ where: { id: documentId } });
        if (!document) {
            throw new common_1.NotFoundException('Documento no encontrado');
        }
        if (!(await this.scope.canAccessProject(userId, document.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este documento');
        }
        return document;
    }
    async storeBase64File(base64Content, fileName, mimeType) {
        const cleanBase64 = base64Content.includes(',') ? base64Content.split(',')[1] : base64Content;
        const buffer = Buffer.from(cleanBase64, 'base64');
        return this.storage.put(buffer, fileName, mimeType);
    }
    async readCurrentVersion(document, version) {
        const buffer = await this.storage.read(version.fileKey);
        return { buffer, fileName: version.fileName, mimeType: version.mimeType, documentId: document.id };
    }
    getExtension(fileName) {
        const parts = fileName.split('.');
        return parts.length > 1 ? parts.at(-1)?.toLowerCase() : undefined;
    }
    async canPublish(documentId, projectId) {
        const applicableFlow = await this.approvalFlows.findOne({
            where: [
                { projectId, entityType: 'document', scopeType: 'document_specific', targetDocumentId: documentId, active: true },
                { projectId, entityType: 'document', scopeType: 'global', targetDocumentId: (0, typeorm_2.IsNull)(), active: true }
            ],
            order: { createdAt: 'DESC' }
        });
        if (!applicableFlow || !applicableFlow.requireForPublication) {
            return true;
        }
        const approvedRequest = await this.approvalRequests.findOne({
            where: {
                entityId: documentId,
                entityType: 'document',
                workflowId: applicableFlow.id,
                status: 'approved'
            },
            order: { completedAt: 'DESC' }
        });
        return Boolean(approvedRequest);
    }
    toListItem(document) {
        return {
            id: document.id,
            name: document.name,
            documentNumber: document.documentNumber,
            status: document.status,
            confidentialityLevel: document.confidentialityLevel,
            renewable: document.renewable,
            dueDate: document.dueDate,
            fileExtension: document.fileExtension,
            sizeBytes: document.sizeBytes,
            projectId: document.projectId,
            folderId: document.folderId,
            disciplineId: document.disciplineId,
            responsibleUserId: document.responsibleUserId,
            currentVersionId: document.currentVersionId,
            updatedAt: document.updatedAt,
            createdAt: document.createdAt,
            project: document.project,
            folder: document.folder,
            discipline: document.discipline,
            responsibleUser: document.responsibleUser
        };
    }
    async log(documentId, actorId, action, beforeState, afterState) {
        await this.auditLogs.save(this.auditLogs.create({
            documentId,
            actorId,
            action,
            beforeState,
            afterState
        }));
    }
    async notifyDocumentVersion(documentId, name, documentNumber, revision, userIds) {
        await this.notifications.notify({
            recipients: userIds.filter((userId) => Boolean(userId)).map((userId) => ({ userId })),
            notificationType: 'document_new_version',
            title: `Nueva versión de documento: ${name}`,
            body: `Se publicó la revisión ${revision} del documento ${documentNumber}.`,
            entityType: 'document',
            entityId: documentId,
            category: 'document',
            meta: { route: '/documents' }
        });
    }
    async notifyDocumentDecision(documentId, name, documentNumber, result, userIds) {
        const label = result === 'approved' ? 'aprobado' : 'rechazado';
        await this.notifications.notify({
            recipients: userIds.filter((userId) => Boolean(userId)).map((userId) => ({ userId })),
            notificationType: 'document_approval_result',
            title: `Documento ${label}: ${name}`,
            body: `El documento ${documentNumber} fue ${label}.`,
            entityType: 'document',
            entityId: documentId,
            category: 'approval',
            meta: { route: '/documents' }
        });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(document_version_entity_1.DocumentVersion)),
    __param(2, (0, typeorm_1.InjectRepository)(approval_flow_entity_1.ApprovalFlow)),
    __param(3, (0, typeorm_1.InjectRepository)(approval_request_entity_1.ApprovalRequest)),
    __param(4, (0, typeorm_1.InjectRepository)(document_metadata_entity_1.DocumentMetadata)),
    __param(5, (0, typeorm_1.InjectRepository)(document_audit_log_entity_1.DocumentAuditLog)),
    __param(6, (0, typeorm_1.InjectRepository)(document_comment_entity_1.DocumentComment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        access_scope_service_1.AccessScopeService,
        storage_service_1.StorageService,
        notifications_service_1.NotificationsService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map