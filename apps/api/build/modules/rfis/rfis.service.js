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
var RfisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RfisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const node_crypto_1 = require("node:crypto");
const typeorm_2 = require("typeorm");
const access_scope_service_1 = require("../../common/access-scope.service");
const permissions_1 = require("../../common/permissions");
const storage_service_1 = require("../../storage/storage.service");
const document_entity_1 = require("../documents/document.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const project_member_entity_1 = require("../projects/project-member.entity");
const project_entity_1 = require("../projects/project.entity");
const user_entity_1 = require("../users/user.entity");
const rfi_attachment_entity_1 = require("./rfi-attachment.entity");
const rfi_comment_entity_1 = require("./rfi-comment.entity");
const rfi_history_entity_1 = require("./rfi-history.entity");
const rfi_template_entity_1 = require("./rfi-template.entity");
const rfi_entity_1 = require("./rfi.entity");
let RfisService = RfisService_1 = class RfisService {
    rfis;
    comments;
    attachments;
    history;
    templates;
    projects;
    members;
    documents;
    users;
    config;
    scope;
    storage;
    notifications;
    logger = new common_1.Logger(RfisService_1.name);
    constructor(rfis, comments, attachments, history, templates, projects, members, documents, users, config, scope, storage, notifications) {
        this.rfis = rfis;
        this.comments = comments;
        this.attachments = attachments;
        this.history = history;
        this.templates = templates;
        this.projects = projects;
        this.members = members;
        this.documents = documents;
        this.users = users;
        this.config = config;
        this.scope = scope;
        this.storage = storage;
        this.notifications = notifications;
    }
    async list(user, query) {
        const visibleProjectIds = await this.resolveVisibleProjectIds(user.id, query.projectId);
        if (!visibleProjectIds.length) {
            return [];
        }
        await this.markOverdue(visibleProjectIds);
        const builder = this.rfis
            .createQueryBuilder('rfi')
            .leftJoinAndSelect('rfi.project', 'project')
            .leftJoinAndSelect('rfi.requester', 'requester')
            .leftJoinAndSelect('rfi.assignedTo', 'assignedTo')
            .leftJoinAndSelect('rfi.document', 'document')
            .leftJoinAndSelect('rfi.attachments', 'attachments')
            .leftJoinAndSelect('rfi.comments', 'comments')
            .where('rfi.projectId IN (:...projectIds)', { projectIds: visibleProjectIds })
            .orderBy('rfi.updatedAt', 'DESC');
        if (query.status) {
            builder.andWhere('rfi.status = :status', { status: query.status });
        }
        if (query.priority) {
            builder.andWhere('rfi.priority = :priority', { priority: query.priority });
        }
        if (query.assignedToId) {
            builder.andWhere('rfi.assignedToId = :assignedToId', { assignedToId: query.assignedToId });
        }
        if (query.search) {
            builder.andWhere('(rfi.subject LIKE :search OR rfi.question LIKE :search OR document.name LIKE :search OR project.name LIKE :search)', { search: `%${query.search}%` });
        }
        const items = await builder.getMany();
        return items.map((item) => this.serializeListItem(item, user.permissions.includes(permissions_1.PermissionKey.DocumentsView)));
    }
    async getFormOptions(user, projectId) {
        const visibleProjectIds = await this.resolveVisibleProjectIds(user.id, projectId);
        const projects = visibleProjectIds.length
            ? await this.projects.find({ where: { id: (0, typeorm_2.In)(visibleProjectIds) }, order: { name: 'ASC' } })
            : [];
        if (!projectId) {
            return {
                projects: projects.map((project) => ({
                    id: project.id,
                    name: project.name,
                    code: project.code,
                })),
                projectMembers: [],
                documents: [],
            };
        }
        const [members, documents] = await Promise.all([
            this.members.find({
                where: { projectId },
                relations: ['user'],
                order: { createdAt: 'ASC' },
            }),
            user.permissions.includes(permissions_1.PermissionKey.DocumentsView)
                ? this.documents.find({
                    where: { projectId },
                    order: { updatedAt: 'DESC' },
                })
                : Promise.resolve([]),
        ]);
        return {
            projects: projects.map((project) => ({
                id: project.id,
                name: project.name,
                code: project.code,
            })),
            projectMembers: members
                .filter((member) => member.user)
                .map((member) => ({
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.role,
            })),
            documents: documents.map((document) => ({
                id: document.id,
                name: document.name,
                documentNumber: document.documentNumber,
            })),
        };
    }
    async getDetail(user, id) {
        await this.markOverdue();
        const rfi = await this.loadRfiWithRelations(id);
        if (!rfi) {
            throw new common_1.NotFoundException('RFI no encontrado');
        }
        await this.assertAccess(user.id, rfi.projectId);
        return this.serializeDetail(rfi, user.permissions.includes(permissions_1.PermissionKey.DocumentsView));
    }
    async create(user, dto) {
        await this.assertAccess(user.id, dto.projectId);
        await this.assertAssignment(dto.projectId, dto.assignedToId);
        await this.assertDocument(dto.projectId, dto.documentId);
        let assignedToId = dto.assignedToId;
        const templateId = dto.templateId;
        let dueDate = dto.dueDate;
        const priority = dto.priority ?? 'normal';
        if (dto.templateId && !assignedToId) {
            const template = await this.templates.findOne({
                where: { id: dto.templateId, isActive: true },
            });
            if (template) {
                if (!dueDate && template.defaultDueDays) {
                    dueDate = new Date(Date.now() + template.defaultDueDays * 86_400_000)
                        .toISOString()
                        .slice(0, 10);
                }
                assignedToId = await this.resolveAutoAssign(template, dto.projectId);
            }
        }
        const rfi = await this.rfis.save(this.rfis.create({
            projectId: dto.projectId,
            documentId: dto.documentId,
            title: dto.title,
            description: dto.description,
            priority,
            templateId,
            dueDate,
            assignedToId,
            createdById: user.id,
            status: 'open',
        }));
        rfi.replyToAddress = this.generateReplyToAddress(rfi.id);
        await this.rfis.save(rfi);
        if (dto.attachments?.length) {
            await this.createAttachments(rfi.id, user.id, dto.attachments);
        }
        await this.logHistory(rfi.id, user.id, 'created', undefined, {
            title: rfi.title,
            status: rfi.status,
            assignedToId: rfi.assignedToId,
            dueDate: rfi.dueDate,
        });
        const notifyRecipients = [];
        if (rfi.assignedToId && rfi.assignedToId !== user.id) {
            notifyRecipients.push({ userId: rfi.assignedToId });
        }
        if (notifyRecipients.length) {
            await this.notifications.notify({
                recipients: notifyRecipients,
                notificationType: 'rfi_assigned',
                title: 'Nuevo RFI asignado',
                body: `Se te asignó el RFI "${rfi.title}". Puedes responder desde este correo o en Holocron.`,
                entityType: 'rfi',
                entityId: rfi.id,
                category: 'rfi',
                meta: { route: '/rfis', replyTo: rfi.replyToAddress },
                dedupeKey: `rfi-assigned:${rfi.id}:${notifyRecipients.map((r) => r.userId).join(',')}`,
            });
        }
        return this.getDetail(user, rfi.id);
    }
    async addComment(user, rfiId, dto) {
        const rfi = await this.assertRfiAccess(user.id, rfiId);
        const comment = await this.comments.save(this.comments.create({
            rfiId,
            userId: user.id,
            body: dto.body,
            type: 'comment',
        }));
        if (dto.attachments?.length) {
            await this.createAttachments(rfiId, user.id, dto.attachments, comment.id);
        }
        await this.logHistory(rfiId, user.id, 'comment_added', undefined, { body: dto.body });
        if (rfi.assignedToId && rfi.assignedToId !== user.id) {
            await this.notifications.notify({
                recipients: [{ userId: rfi.assignedToId }],
                notificationType: 'rfi_commented',
                title: 'Nuevo comentario en RFI',
                body: `${user.name} comentó en el RFI "${rfi.title}": ${dto.body}`,
                entityType: 'rfi',
                entityId: rfi.id,
                category: 'rfi',
                meta: {
                    route: '/rfis',
                    replyTo: rfi.replyToAddress,
                },
            });
        }
        return this.getDetail(user, rfiId);
    }
    async respond(user, rfiId, dto) {
        const rfi = await this.assertRfiAccess(user.id, rfiId);
        const before = this.snapshot(rfi);
        rfi.answer = dto.answer;
        rfi.status = dto.status ?? 'answered';
        if (this.shouldBeOverdue(rfi.dueDate, rfi.status)) {
            rfi.status = 'overdue';
        }
        rfi.closedAt = undefined;
        await this.rfis.save(rfi);
        const comment = await this.comments.save(this.comments.create({
            rfiId,
            userId: user.id,
            body: dto.answer,
            type: 'response',
        }));
        if (dto.attachments?.length) {
            await this.createAttachments(rfiId, user.id, dto.attachments, comment.id);
        }
        await this.logHistory(rfiId, user.id, 'responded', before, this.snapshot(rfi));
        if (rfi.createdById !== user.id) {
            await this.notifications.notify({
                recipients: [{ userId: rfi.createdById }],
                notificationType: 'rfi_responded',
                title: 'RFI respondido',
                body: `El RFI "${rfi.title}" recibió una respuesta: ${dto.answer}`,
                entityType: 'rfi',
                entityId: rfi.id,
                category: 'rfi',
                meta: {
                    route: '/rfis',
                    replyTo: rfi.replyToAddress,
                },
            });
        }
        return this.getDetail(user, rfiId);
    }
    async updateStatus(user, rfiId, dto) {
        const rfi = await this.assertRfiAccess(user.id, rfiId);
        const before = this.snapshot(rfi);
        rfi.status = dto.status;
        rfi.closedAt = dto.status === 'closed' ? new Date() : undefined;
        if (this.shouldBeOverdue(rfi.dueDate, rfi.status)) {
            rfi.status = 'overdue';
            rfi.closedAt = undefined;
        }
        await this.rfis.save(rfi);
        if (dto.note?.trim()) {
            await this.comments.save(this.comments.create({
                rfiId,
                userId: user.id,
                body: dto.note,
                type: 'system',
            }));
        }
        await this.logHistory(rfiId, user.id, 'status_changed', before, this.snapshot(rfi));
        await this.notifyAssignedOnActivity(rfi, user.id, `El RFI "${rfi.title}" cambió a estado ${rfi.status}.`);
        return this.getDetail(user, rfiId);
    }
    async close(user, rfiId, note) {
        return this.updateStatus(user, rfiId, { status: 'closed', note });
    }
    async listTemplates(user, projectId) {
        const where = {};
        if (projectId) {
            where.projectId = projectId;
        }
        return this.templates.find({
            where,
            relations: { project: true, createdBy: true },
            order: { name: 'ASC' },
        });
    }
    async getTemplate(user, id) {
        const template = await this.templates.findOne({
            where: { id },
            relations: { project: true, createdBy: true },
        });
        if (!template) {
            throw new common_1.NotFoundException('Plantilla no encontrada');
        }
        return template;
    }
    async createTemplate(user, dto) {
        return this.templates.save(this.templates.create({
            ...dto,
            createdById: user.id,
            autoAssignRule: dto.autoAssignRule,
        }));
    }
    async updateTemplate(user, id, dto) {
        const template = await this.templates.findOne({ where: { id } });
        if (!template) {
            throw new common_1.NotFoundException('Plantilla no encontrada');
        }
        Object.assign(template, dto);
        return this.templates.save(template);
    }
    async deleteTemplate(user, id) {
        const template = await this.templates.findOne({ where: { id } });
        if (!template) {
            throw new common_1.NotFoundException('Plantilla no encontrada');
        }
        await this.templates.softRemove(template);
        return { ok: true };
    }
    async evaluateTemplate(user, templateId, projectId) {
        const template = await this.templates.findOne({ where: { id: templateId, isActive: true } });
        if (!template) {
            throw new common_1.NotFoundException('Plantilla no encontrada');
        }
        const dueDate = template.defaultDueDays
            ? new Date(Date.now() + template.defaultDueDays * 86_400_000).toISOString().slice(0, 10)
            : undefined;
        const assignedToId = await this.resolveAutoAssign(template, projectId);
        const [members, projectDocs] = await Promise.all([
            this.members.find({
                where: { projectId },
                relations: ['user'],
            }),
            this.documents.find({ where: { projectId }, order: { updatedAt: 'DESC' } }),
        ]);
        return {
            template,
            projectId,
            title: template.titleTemplate,
            description: template.descriptionTemplate,
            priority: template.defaultPriority,
            dueDate,
            assignedToId,
            assignedToName: assignedToId
                ? (members.find((m) => m.userId === assignedToId)?.user?.name ?? null)
                : null,
            projectMembers: members
                .filter((m) => m.user)
                .map((m) => ({ id: m.user.id, name: m.user.name, email: m.user.email, role: m.role })),
            documents: projectDocs.map((d) => ({
                id: d.id,
                name: d.name,
                documentNumber: d.documentNumber,
            })),
        };
    }
    async resolveAutoAssign(template, projectId) {
        const rule = template.autoAssignRule;
        if (!rule)
            return undefined;
        if (rule.type === 'specific_user' && rule.userId) {
            return rule.userId;
        }
        if (rule.type === 'project_role' && rule.projectRole) {
            const member = await this.members.findOne({
                where: { projectId, role: rule.projectRole },
                order: { createdAt: 'ASC' },
            });
            if (member)
                return member.userId;
        }
        if (rule.type === 'discipline_lead' && rule.disciplineId) {
            const project = await this.projects.findOne({ where: { id: projectId } });
            if (project?.responsibleUserId)
                return project.responsibleUserId;
        }
        if (rule.type === 'document_uploader') {
            const doc = await this.documents.findOne({
                where: { projectId },
                order: { updatedAt: 'DESC' },
            });
            if (doc?.uploadedById)
                return doc.uploadedById;
        }
        if (rule.fallbackUserId)
            return rule.fallbackUserId;
        return undefined;
    }
    generateReplyToAddress(rfiId) {
        const domain = this.config.get('INBOUND_EMAIL_DOMAIN') ?? 'holocron.local';
        const hash = (0, node_crypto_1.createHash)('sha256')
            .update(rfiId + (0, node_crypto_1.randomBytes)(8).toString('hex'))
            .digest('hex')
            .slice(0, 16);
        return `rfi-${hash}@${domain}`;
    }
    async processInboundEmail(dto) {
        const match = dto.to.match(/rfi-([a-f0-9]+)@/);
        if (!match) {
            this.logger.warn(`Correo entrante no corresponde a ningún RFI: ${dto.to}`);
            return { ok: false, reason: 'Destino no reconocido' };
        }
        const rfi = await this.rfis.findOne({
            where: { replyToAddress: dto.to },
            relations: ['project'],
        });
        if (!rfi) {
            this.logger.warn(`RFI no encontrado para dirección: ${dto.to}`);
            return { ok: false, reason: 'RFI no encontrado' };
        }
        const sender = await this.users.findOne({ where: { email: dto.from } });
        if (!sender) {
            this.logger.warn(`Usuario no encontrado para email: ${dto.from}`);
            return { ok: false, reason: 'Remitente no registrado en Holocron' };
        }
        await this.assertAccess(sender.id, rfi.projectId);
        const comment = await this.comments.save(this.comments.create({
            rfiId: rfi.id,
            userId: sender.id,
            body: dto.body,
            type: 'email',
            emailMessageId: dto.messageId,
            emailInReplyTo: dto.inReplyTo,
        }));
        await this.logHistory(rfi.id, sender.id, 'email_received', undefined, {
            commentId: comment.id,
            subject: dto.subject,
        });
        if (rfi.assignedToId && rfi.assignedToId !== sender.id) {
            await this.notifications.notify({
                recipients: [{ userId: rfi.assignedToId }],
                notificationType: 'rfi_assigned',
                title: 'Respuesta por correo recibida',
                body: `${sender.name} respondió al RFI "${rfi.title}" desde el correo.`,
                entityType: 'rfi',
                entityId: rfi.id,
                category: 'rfi',
                meta: { route: '/rfis' },
            });
        }
        return { ok: true, commentId: comment.id };
    }
    async assertAccess(userId, projectId) {
        if (!(await this.scope.canAccessProject(userId, projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
        }
    }
    async assertRfiAccess(userId, rfiId) {
        const rfi = await this.rfis.findOne({ where: { id: rfiId } });
        if (!rfi) {
            throw new common_1.NotFoundException('RFI no encontrado');
        }
        await this.assertAccess(userId, rfi.projectId);
        if (this.shouldBeOverdue(rfi.dueDate, rfi.status)) {
            rfi.status = 'overdue';
            rfi.closedAt = undefined;
            await this.rfis.save(rfi);
            await this.logHistory(rfi.id, undefined, 'auto_overdue', undefined, { status: 'overdue' });
        }
        return rfi;
    }
    async resolveVisibleProjectIds(userId, projectId) {
        if (projectId) {
            await this.assertAccess(userId, projectId);
            return [projectId];
        }
        return this.scope.visibleProjectIdsForUser(userId);
    }
    async assertAssignment(projectId, assignedToId) {
        if (!assignedToId)
            return;
        const count = await this.members.count({ where: { projectId, userId: assignedToId } });
        if (!count) {
            throw new common_1.NotFoundException('El responsable asignado no pertenece al proyecto');
        }
    }
    async assertDocument(projectId, documentId) {
        if (!documentId)
            return;
        const document = await this.documents.findOne({ where: { id: documentId } });
        if (!document || document.projectId !== projectId) {
            throw new common_1.NotFoundException('El documento relacionado no pertenece al proyecto');
        }
    }
    async loadRfiWithRelations(id) {
        return this.rfis.findOne({
            where: { id },
            relations: {
                project: true,
                document: true,
                requester: true,
                assignedTo: true,
                template: true,
                attachments: { uploadedBy: true },
                comments: { author: true, attachments: { uploadedBy: true } },
                history: { actor: true },
            },
        });
    }
    serializeListItem(rfi, includeDocument) {
        const commentsCount = rfi.comments?.length ?? 0;
        const attachmentsCount = rfi.attachments?.length ?? 0;
        return {
            id: rfi.id,
            projectId: rfi.projectId,
            documentId: rfi.documentId,
            title: rfi.title,
            description: rfi.description,
            answer: rfi.answer,
            priority: rfi.priority,
            dueDate: rfi.dueDate,
            status: rfi.status,
            closedAt: rfi.closedAt,
            createdAt: rfi.createdAt,
            updatedAt: rfi.updatedAt,
            replyToAddress: rfi.replyToAddress,
            requester: rfi.requester
                ? { id: rfi.requester.id, name: rfi.requester.name, email: rfi.requester.email }
                : null,
            assignedTo: rfi.assignedTo
                ? { id: rfi.assignedTo.id, name: rfi.assignedTo.name, email: rfi.assignedTo.email }
                : null,
            project: rfi.project
                ? { id: rfi.project.id, name: rfi.project.name, code: rfi.project.code }
                : null,
            document: includeDocument && rfi.document
                ? {
                    id: rfi.document.id,
                    name: rfi.document.name,
                    documentNumber: rfi.document.documentNumber,
                }
                : null,
            template: rfi.template ? { id: rfi.template.id, name: rfi.template.name } : null,
            commentsCount,
            attachmentsCount,
        };
    }
    serializeDetail(rfi, includeDocument) {
        return {
            ...this.serializeListItem(rfi, includeDocument),
            comments: (rfi.comments ?? [])
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((comment) => ({
                id: comment.id,
                body: comment.body,
                type: comment.type,
                createdAt: comment.createdAt,
                author: comment.author
                    ? { id: comment.author.id, name: comment.author.name, email: comment.author.email }
                    : null,
                emailMessageId: comment.emailMessageId,
                emailInReplyTo: comment.emailInReplyTo,
                attachments: (comment.attachments ?? []).map((attachment) => this.serializeAttachment(attachment)),
            })),
            attachments: (rfi.attachments ?? [])
                .filter((attachment) => !attachment.commentId)
                .map((attachment) => this.serializeAttachment(attachment)),
            history: (rfi.history ?? [])
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((item) => ({
                id: item.id,
                action: item.action,
                beforeState: item.beforeState,
                afterState: item.afterState,
                createdAt: item.createdAt,
                actor: item.actor
                    ? { id: item.actor.id, name: item.actor.name, email: item.actor.email }
                    : null,
            })),
        };
    }
    serializeAttachment(attachment) {
        return {
            id: attachment.id,
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            sizeBytes: Number(attachment.sizeBytes),
            createdAt: attachment.createdAt,
            uploadedBy: attachment.uploadedBy
                ? {
                    id: attachment.uploadedBy.id,
                    name: attachment.uploadedBy.name,
                    email: attachment.uploadedBy.email,
                }
                : null,
        };
    }
    async createAttachments(rfiId, userId, files, commentId) {
        for (const file of files) {
            const cleanBase64 = file.base64Content.includes(',')
                ? file.base64Content.split(',')[1]
                : file.base64Content;
            const buffer = Buffer.from(cleanBase64, 'base64');
            const stored = await this.storage.put(buffer, file.fileName, file.mimeType);
            await this.attachments.save(this.attachments.create({
                rfiId,
                commentId,
                fileKey: stored.fileKey,
                fileName: stored.fileName,
                mimeType: stored.mimeType,
                sizeBytes: stored.sizeBytes,
                uploadedById: userId,
            }));
        }
    }
    async logHistory(rfiId, actorId, action, beforeState, afterState) {
        await this.history.save(this.history.create({
            rfiId,
            actorId,
            action,
            beforeState,
            afterState,
        }));
    }
    snapshot(rfi) {
        return {
            title: rfi.title,
            description: rfi.description,
            answer: rfi.answer,
            priority: rfi.priority,
            dueDate: rfi.dueDate,
            status: rfi.status,
            assignedToId: rfi.assignedToId,
            documentId: rfi.documentId,
            closedAt: rfi.closedAt?.toISOString() ?? null,
        };
    }
    shouldBeOverdue(dueDate, status) {
        if (!dueDate || status === 'closed' || status === 'overdue') {
            return false;
        }
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const due = new Date(`${dueDate}T00:00:00`);
        return due.getTime() < start.getTime();
    }
    async markOverdue(projectIds) {
        const today = new Date();
        const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const overdue = await this.rfis.find({
            where: {
                dueDate: (0, typeorm_2.LessThan)(start.toISOString().slice(0, 10)),
                status: (0, typeorm_2.Not)((0, typeorm_2.In)(['closed', 'overdue'])),
                ...(projectIds?.length ? { projectId: (0, typeorm_2.In)(projectIds) } : {}),
            },
        });
        for (const rfi of overdue) {
            rfi.status = 'overdue';
            rfi.closedAt = undefined;
            await this.rfis.save(rfi);
            await this.logHistory(rfi.id, undefined, 'auto_overdue', undefined, { status: 'overdue' });
        }
    }
    async notifyAssignedOnActivity(rfi, actorId, body) {
        if (!rfi.assignedToId || rfi.assignedToId === actorId) {
            return;
        }
        await this.notifications.notify({
            recipients: [{ userId: rfi.assignedToId }],
            notificationType: 'rfi_assigned',
            title: 'Actualización de RFI',
            body,
            entityType: 'rfi',
            entityId: rfi.id,
            category: 'rfi',
            meta: { route: '/rfis' },
        });
    }
};
exports.RfisService = RfisService;
exports.RfisService = RfisService = RfisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(rfi_entity_1.Rfi)),
    __param(1, (0, typeorm_1.InjectRepository)(rfi_comment_entity_1.RfiComment)),
    __param(2, (0, typeorm_1.InjectRepository)(rfi_attachment_entity_1.RfiAttachment)),
    __param(3, (0, typeorm_1.InjectRepository)(rfi_history_entity_1.RfiHistory)),
    __param(4, (0, typeorm_1.InjectRepository)(rfi_template_entity_1.RfiTemplate)),
    __param(5, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(6, (0, typeorm_1.InjectRepository)(project_member_entity_1.ProjectMember)),
    __param(7, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __param(8, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        access_scope_service_1.AccessScopeService,
        storage_service_1.StorageService,
        notifications_service_1.NotificationsService])
], RfisService);
//# sourceMappingURL=rfis.service.js.map