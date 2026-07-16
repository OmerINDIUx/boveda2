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
var DocumentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const access_scope_service_1 = require("../../common/access-scope.service");
const storage_service_1 = require("../../storage/storage.service");
const notifications_service_1 = require("../notifications/notifications.service");
const document_converter_service_1 = require("./document-converter.service");
const approval_flow_entity_1 = require("../approvals/approval-flow.entity");
const approval_request_entity_1 = require("../approvals/approval-request.entity");
const folder_entity_1 = require("../folders/folder.entity");
const project_member_entity_1 = require("../projects/project-member.entity");
const user_entity_1 = require("../users/user.entity");
const document_version_entity_1 = require("../versions/document-version.entity");
const document_audit_log_entity_1 = require("./document-audit-log.entity");
const document_comment_entity_1 = require("./document-comment.entity");
const document_metadata_entity_1 = require("./document-metadata.entity");
const document_permission_entity_1 = require("./document-permission.entity");
const document_entity_1 = require("./document.entity");
const previewableMimeTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'text/plain',
];
const officeMimeTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
let DocumentsService = DocumentsService_1 = class DocumentsService {
    documents;
    versions;
    approvalFlows;
    approvalRequests;
    metadata;
    auditLogs;
    comments;
    permissions;
    users;
    members;
    folders;
    scope;
    storage;
    notifications;
    converter;
    logger = new common_1.Logger(DocumentsService_1.name);
    constructor(documents, versions, approvalFlows, approvalRequests, metadata, auditLogs, comments, permissions, users, members, folders, scope, storage, notifications, converter) {
        this.documents = documents;
        this.versions = versions;
        this.approvalFlows = approvalFlows;
        this.approvalRequests = approvalRequests;
        this.metadata = metadata;
        this.auditLogs = auditLogs;
        this.comments = comments;
        this.permissions = permissions;
        this.users = users;
        this.members = members;
        this.folders = folders;
        this.scope = scope;
        this.storage = storage;
        this.notifications = notifications;
        this.converter = converter;
    }
    async listVisible(userId, query) {
        const visibleProjectIds = query.projectId
            ? []
            : await this.scope.visibleProjectIdsForUser(userId);
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
            .where(query.projectId
            ? 'document.projectId = :projectId'
            : 'document.projectId IN (:...projectIds)', {
            projectId: query.projectId,
            projectIds: query.projectId ? undefined : visibleProjectIds,
        })
            .orderBy('document.updatedAt', 'DESC');
        if (query.search) {
            builder.andWhere('(document.name LIKE :search OR document.documentNumber LIKE :search OR discipline.name LIKE :search OR project.name LIKE :search)', { search: `%${query.search}%` });
        }
        const rawItems = await builder.getMany();
        const items = await this.filterDocumentsByPermissions(userId, query.projectId ? [query.projectId] : visibleProjectIds, rawItems);
        return items.map((item) => this.toListItem(item));
    }
    async create(userId, dto) {
        try {
            if (!(await this.scope.canAccessProject(userId, dto.projectId))) {
                throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
            }
            const folder = await this.resolveProjectFolder(dto.projectId, dto.folderId);
            const disciplineId = this.optionalValue(dto.disciplineId);
            const responsibleUserId = this.optionalValue(dto.responsibleUserId);
            const dueDate = this.optionalValue(dto.dueDate);
            const notes = this.optionalValue(dto.notes);
            const renewalFrequency = dto.renewable && this.optionalValue(dto.renewalFrequency)
                ? this.optionalValue(dto.renewalFrequency)
                : null;
            const document = await this.documents.save(this.documents.create({
                projectId: dto.projectId,
                folderId: folder.id,
                disciplineId,
                responsibleUserId,
                documentNumber: dto.documentNumber,
                name: dto.name ?? dto.title ?? dto.fileName,
                status: dto.status ?? 'draft',
                confidentialityLevel: dto.confidentialityLevel ?? 'internal',
                renewable: dto.renewable ?? false,
                renewalFrequency,
                dueDate,
                originalFileKey: dto.fileKey,
                fileExtension: this.getExtension(dto.fileName),
                sizeBytes: dto.sizeBytes ?? 0,
                uploadedById: userId,
            }));
            const version = await this.versions.save(this.versions.create({
                documentId: document.id,
                revision: dto.revision ?? 'A',
                fileKey: dto.fileKey,
                fileName: dto.fileName,
                fileExtension: this.getExtension(dto.fileName),
                mimeType: dto.mimeType,
                sizeBytes: dto.sizeBytes ?? 0,
                uploadedById: userId,
                notes,
            }));
            document.currentVersionId = version.id;
            await this.documents.save(document);
            if (dto.metadata?.length) {
                await this.metadata.save(dto.metadata.map((item) => this.metadata.create({
                    documentId: document.id,
                    metaKey: item.key,
                    metaValue: item.value,
                    valueType: item.type ?? 'string',
                })));
            }
            await this.log(document.id, userId, 'upload_new_version', undefined, {
                versionId: version.id,
                revision: version.revision,
                fileName: version.fileName,
            });
            await this.notifyDocumentVersion(document.id, document.name, document.documentNumber, version.revision, [document.responsibleUserId, document.uploadedById]);
            return this.getDetail(userId, document.id, false);
        }
        catch (error) {
            throw this.handleDocumentMutationError(error, 'No fue posible crear el documento.');
        }
    }
    async getDetail(userId, documentId, logView = true) {
        const document = await this.documents.findOne({
            where: { id: documentId },
            relations: ['project', 'folder', 'discipline', 'responsibleUser', 'uploadedBy'],
        });
        if (!document) {
            throw new common_1.NotFoundException('Documento no encontrado');
        }
        if (!(await this.scope.canAccessProject(userId, document.projectId)) ||
            !(await this.canAccessDocument(userId, document))) {
            throw new common_1.ForbiddenException('No tienes acceso a este documento');
        }
        const [versions, metadata, comments, audit] = await Promise.all([
            this.versions.find({
                where: { documentId },
                relations: ['uploadedBy'],
                order: { createdAt: 'DESC' },
            }),
            this.metadata.find({ where: { documentId } }),
            this.comments.find({
                where: { documentId },
                relations: ['author'],
                order: { createdAt: 'DESC' },
            }),
            this.auditLogs.find({
                where: { documentId },
                relations: ['actor'],
                order: { createdAt: 'DESC' },
            }),
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
                    url: `/api/documents/${document.id}/content`,
                }
                : { available: false, mimeType: null, url: null },
            metadata,
            versions,
            comments: comments.map((comment) => ({
                id: comment.id,
                body: comment.body,
                createdAt: comment.createdAt,
                author: comment.author
                    ? { id: comment.author.id, name: comment.author.name, email: comment.author.email }
                    : null,
            })),
            audit,
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
            renewalFrequency: document.renewalFrequency,
            dueDate: document.dueDate,
            status: document.status,
        };
        if (dto.folderId !== undefined) {
            const folder = await this.resolveProjectFolder(document.projectId, dto.folderId);
            document.folderId = folder.id;
        }
        Object.assign(document, { ...dto, folderId: document.folderId });
        if (!document.renewable) {
            document.renewalFrequency = null;
        }
        if (dto.status === 'published' && !(await this.canPublish(document.id, document.projectId))) {
            throw new common_1.ForbiddenException('Este documento requiere aprobación antes de publicarse');
        }
        if (document.dueDate &&
            new Date(`${document.dueDate}T00:00:00`).getTime() <
                new Date(new Date().toDateString()).getTime()) {
            document.status = 'expired';
        }
        await this.documents.save(document);
        await this.log(document.id, userId, 'edit', beforeState, dto);
        return this.getDetail(userId, documentId, false);
    }
    async createVersion(userId, documentId, dto) {
        try {
            const document = await this.assertDocumentAccess(userId, documentId);
            const version = await this.versions.save(this.versions.create({
                documentId,
                revision: dto.revision,
                fileKey: dto.fileKey,
                fileName: dto.fileName,
                fileExtension: this.getExtension(dto.fileName),
                mimeType: dto.mimeType,
                sizeBytes: dto.sizeBytes ?? 0,
                uploadedById: userId,
                notes: dto.notes,
            }));
            const previousVersionId = document.currentVersionId;
            document.currentVersionId = version.id;
            document.originalFileKey = dto.fileKey;
            document.fileExtension = this.getExtension(dto.fileName);
            document.sizeBytes = dto.sizeBytes ?? 0;
            document.uploadedById = userId;
            await this.documents.save(document);
            await this.log(document.id, userId, 'upload_new_version', { previousVersionId }, { versionId: version.id, revision: dto.revision });
            await this.notifyDocumentVersion(document.id, document.name, document.documentNumber, version.revision, [document.responsibleUserId, document.uploadedById]);
            return this.getDetail(userId, documentId, false);
        }
        catch (error) {
            throw this.handleDocumentMutationError(error, 'No fue posible subir la nueva versión.');
        }
    }
    async addComment(userId, documentId, dto) {
        await this.assertDocumentAccess(userId, documentId);
        const comment = await this.comments.save(this.comments.create({
            documentId,
            authorId: userId,
            body: dto.body,
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
        await this.notifyDocumentDecision(document.id, document.name, document.documentNumber, 'approved', [document.responsibleUserId, document.uploadedById]);
        return this.getDetail(userId, documentId, false);
    }
    async reject(userId, documentId) {
        const document = await this.assertDocumentAccess(userId, documentId);
        const beforeStatus = document.status;
        document.status = 'in_review';
        await this.documents.save(document);
        await this.log(documentId, userId, 'rejection', { status: beforeStatus }, { status: document.status });
        await this.notifyDocumentDecision(document.id, document.name, document.documentNumber, 'rejected', [document.responsibleUserId, document.uploadedById]);
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
    async getCurrentContentAsHtml(userId, documentId) {
        const document = await this.assertDocumentAccess(userId, documentId);
        const version = await this.versions.findOne({ where: { id: document.currentVersionId ?? '' } });
        if (!version) {
            throw new common_1.NotFoundException('No hay versión actual para este documento');
        }
        if (!officeMimeTypes.includes(version.mimeType)) {
            return this.readCurrentVersion(document, version);
        }
        const { buffer } = await this.readCurrentVersion(document, version);
        const { html } = await this.converter.docxToHtml(buffer);
        const styledHtml = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body {
    font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
    line-height: 1.6;
    color: #1a1a1a;
    margin: 0;
    padding: 0;
    background: #f5f5f5;
  }
  .document-wrapper {
    max-width: 900px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  .document-content {
    background: #fff;
    box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    padding: 60px 80px;
    min-height: 100vh;
  }
  .document-content p { margin: 0 0 1em; }
  .document-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
  .document-content td, .document-content th {
    border: 1px solid #ccc;
    padding: 8px 12px;
    text-align: left;
  }
  .document-content img { max-width: 100%; height: auto; }
</style>
</head>
<body>
<div class="document-wrapper">
<div class="document-content">
${html}
</div>
</div>
</body>
</html>`;
        return {
            buffer: Buffer.from(styledHtml, 'utf-8'),
            fileName: version.fileName,
            mimeType: 'text/html',
            documentId: document.id,
        };
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
        if (!(await this.scope.canAccessProject(userId, document.projectId)) ||
            !(await this.canAccessDocument(userId, document))) {
            throw new common_1.ForbiddenException('No tienes acceso a este documento');
        }
        return document;
    }
    async canAccessDocument(userId, document) {
        const visible = await this.filterDocumentsByPermissions(userId, [document.projectId], [document]);
        return visible.length > 0;
    }
    async filterDocumentsByPermissions(userId, projectIds, rawDocuments) {
        if (!rawDocuments.length) {
            return [];
        }
        const user = await this.users.findOne({ where: { id: userId }, relations: ['roles'] });
        if (!user) {
            return [];
        }
        const memberships = await this.members.find({
            where: { userId, projectId: (0, typeorm_2.In)(projectIds) },
        });
        const roleIds = user.roles?.map((role) => role.id) ?? [];
        const projectUserIds = memberships.map((membership) => membership.id);
        const permissionRows = await this.permissions.find({
            where: { documentId: (0, typeorm_2.In)(rawDocuments.map((document) => document.id)), deletedAt: (0, typeorm_2.IsNull)() },
        });
        return rawDocuments.filter((document) => {
            const rows = permissionRows.filter((row) => row.documentId === document.id);
            if (!rows.length) {
                return true;
            }
            return rows.some((row) => {
                if (row.expiresAt && row.expiresAt.getTime() < Date.now()) {
                    return false;
                }
                return (row.userId === userId ||
                    (row.roleId ? roleIds.includes(row.roleId) : false) ||
                    (row.projectUserId ? projectUserIds.includes(row.projectUserId) : false));
            });
        });
    }
    async storeBase64File(base64Content, fileName, mimeType) {
        const cleanBase64 = base64Content.includes(',') ? base64Content.split(',')[1] : base64Content;
        const buffer = Buffer.from(cleanBase64, 'base64');
        return this.storage.put(buffer, fileName, mimeType);
    }
    async resolveProjectFolder(projectId, folderId) {
        if (!folderId) {
            throw new common_1.BadRequestException('Selecciona una carpeta para el documento');
        }
        const folder = await this.folders.findOne({ where: { id: folderId, projectId } });
        if (!folder) {
            throw new common_1.BadRequestException('La carpeta seleccionada no pertenece al proyecto');
        }
        return folder;
    }
    async readCurrentVersion(document, version) {
        const buffer = await this.storage.read(version.fileKey);
        return {
            buffer,
            fileName: version.fileName,
            mimeType: version.mimeType,
            documentId: document.id,
        };
    }
    getExtension(fileName) {
        const parts = fileName.split('.');
        return parts.length > 1 ? parts.at(-1)?.toLowerCase() : undefined;
    }
    optionalValue(value) {
        const normalized = value?.trim();
        return normalized ? normalized : undefined;
    }
    handleDocumentMutationError(error, fallback) {
        if (error instanceof common_1.HttpException) {
            return error;
        }
        if (error instanceof typeorm_2.QueryFailedError) {
            const dbError = error.driverError;
            const message = dbError?.sqlMessage ?? dbError?.message ?? error.message;
            this.logger.error(`Document mutation failed: ${message}`, error.stack);
            if (dbError?.code === 'ER_DUP_ENTRY' ||
                message.includes('uq_documents_project_number') ||
                message.includes('Duplicate entry')) {
                return new common_1.BadRequestException('Ya existe un documento con ese numero documental dentro del proyecto.');
            }
            if (dbError?.code === 'ER_NO_REFERENCED_ROW_2' ||
                dbError?.code === 'ER_ROW_IS_REFERENCED_2') {
                return new common_1.BadRequestException('Alguno de los datos relacionados ya no es valido. Recarga proyecto, carpeta y responsable e intenta de nuevo.');
            }
        }
        else if (error instanceof Error) {
            this.logger.error(`Document mutation failed: ${error.message}`, error.stack);
        }
        return new common_1.BadRequestException(fallback);
    }
    async canPublish(documentId, projectId) {
        const applicableFlow = await this.approvalFlows.findOne({
            where: [
                {
                    projectId,
                    entityType: 'document',
                    scopeType: 'document_specific',
                    targetDocumentId: documentId,
                    active: true,
                },
                {
                    projectId,
                    entityType: 'document',
                    scopeType: 'global',
                    targetDocumentId: (0, typeorm_2.IsNull)(),
                    active: true,
                },
            ],
            order: { createdAt: 'DESC' },
        });
        if (!applicableFlow || !applicableFlow.requireForPublication) {
            return true;
        }
        const approvedRequest = await this.approvalRequests.findOne({
            where: {
                entityId: documentId,
                entityType: 'document',
                workflowId: applicableFlow.id,
                status: 'approved',
            },
            order: { completedAt: 'DESC' },
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
            renewalFrequency: document.renewalFrequency,
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
            responsibleUser: document.responsibleUser,
        };
    }
    async log(documentId, actorId, action, beforeState, afterState) {
        await this.auditLogs.save(this.auditLogs.create({
            documentId,
            actorId,
            action,
            beforeState,
            afterState,
        }));
    }
    async notifyDocumentVersion(documentId, name, documentNumber, revision, userIds) {
        await this.notifications.notify({
            recipients: userIds
                .filter((userId) => Boolean(userId))
                .map((userId) => ({ userId })),
            notificationType: 'document_new_version',
            title: `Nueva versión de documento: ${name}`,
            body: `Se publicó la revisión ${revision} del documento ${documentNumber}.`,
            entityType: 'document',
            entityId: documentId,
            category: 'document',
            meta: { route: '/documents' },
        });
    }
    async notifyDocumentDecision(documentId, name, documentNumber, result, userIds) {
        const label = result === 'approved' ? 'aprobado' : 'rechazado';
        await this.notifications.notify({
            recipients: userIds
                .filter((userId) => Boolean(userId))
                .map((userId) => ({ userId })),
            notificationType: 'document_approval_result',
            title: `Documento ${label}: ${name}`,
            body: `El documento ${documentNumber} fue ${label}.`,
            entityType: 'document',
            entityId: documentId,
            category: 'approval',
            meta: { route: '/documents' },
        });
    }
};
exports.DocumentsService = DocumentsService;
exports.DocumentsService = DocumentsService = DocumentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __param(1, (0, typeorm_1.InjectRepository)(document_version_entity_1.DocumentVersion)),
    __param(2, (0, typeorm_1.InjectRepository)(approval_flow_entity_1.ApprovalFlow)),
    __param(3, (0, typeorm_1.InjectRepository)(approval_request_entity_1.ApprovalRequest)),
    __param(4, (0, typeorm_1.InjectRepository)(document_metadata_entity_1.DocumentMetadata)),
    __param(5, (0, typeorm_1.InjectRepository)(document_audit_log_entity_1.DocumentAuditLog)),
    __param(6, (0, typeorm_1.InjectRepository)(document_comment_entity_1.DocumentComment)),
    __param(7, (0, typeorm_1.InjectRepository)(document_permission_entity_1.DocumentPermission)),
    __param(8, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(9, (0, typeorm_1.InjectRepository)(project_member_entity_1.ProjectMember)),
    __param(10, (0, typeorm_1.InjectRepository)(folder_entity_1.Folder)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
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
        notifications_service_1.NotificationsService,
        document_converter_service_1.DocumentConverterService])
], DocumentsService);
//# sourceMappingURL=documents.service.js.map