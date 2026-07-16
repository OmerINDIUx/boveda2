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
exports.ApprovalsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const access_scope_service_1 = require("../../common/access-scope.service");
const document_audit_log_entity_1 = require("../documents/document-audit-log.entity");
const document_entity_1 = require("../documents/document.entity");
const project_entity_1 = require("../projects/project.entity");
const notifications_service_1 = require("../notifications/notifications.service");
const approval_flow_entity_1 = require("./approval-flow.entity");
const approval_request_action_entity_1 = require("./approval-request-action.entity");
const approval_request_entity_1 = require("./approval-request.entity");
const approval_step_entity_1 = require("./approval-step.entity");
const STALE_DAYS = 7;
let ApprovalsService = class ApprovalsService {
    flows;
    steps;
    requests;
    actions;
    documents;
    auditLogs;
    projectsRepo;
    scope;
    notifications;
    constructor(flows, steps, requests, actions, documents, auditLogs, projectsRepo, scope, notifications) {
        this.flows = flows;
        this.steps = steps;
        this.requests = requests;
        this.actions = actions;
        this.documents = documents;
        this.auditLogs = auditLogs;
        this.projectsRepo = projectsRepo;
        this.scope = scope;
        this.notifications = notifications;
    }
    async listFlows(userId, projectId) {
        if (!(await this.scope.canAccessProject(userId, projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
        }
        const flows = await this.flows.find({
            where: { projectId },
            relations: ['steps'],
            order: { updatedAt: 'DESC' },
        });
        return flows.map((flow) => this.serializeFlow(flow));
    }
    async createFlow(userId, dto) {
        if (!(await this.scope.canAccessProject(userId, dto.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este proyecto');
        }
        if (dto.scopeType === 'document_specific' && dto.targetDocumentId) {
            const document = await this.documents.findOne({ where: { id: dto.targetDocumentId } });
            if (!document || document.projectId !== dto.projectId) {
                throw new common_1.NotFoundException('Documento objetivo no encontrado para este flujo');
            }
        }
        const workflow = await this.flows.save(this.flows.create({
            projectId: dto.projectId,
            name: dto.name,
            entityType: dto.entityType,
            scopeType: dto.scopeType ?? 'global',
            targetDocumentId: dto.targetDocumentId,
            requireForPublication: dto.requireForPublication ?? true,
            createdById: userId,
        }));
        if (dto.steps.length) {
            await this.steps.save(dto.steps.map((step) => this.steps.create({
                workflowId: workflow.id,
                stepOrder: step.stepOrder,
                name: step.name,
                approverUserId: step.approverUserIds?.[0] ?? undefined,
                approverUserIds: step.approverUserIds?.length
                    ? JSON.stringify(step.approverUserIds)
                    : undefined,
                approverRoleId: step.approverRoleId,
                required: step.required ?? true,
                dueDays: step.dueDays,
            })));
        }
        return this.getFlowDetail(userId, workflow.id);
    }
    async updateFlow(userId, flowId, dto) {
        const flow = await this.flows.findOne({ where: { id: flowId }, relations: ['steps'] });
        if (!flow) {
            throw new common_1.NotFoundException('Flujo no encontrado');
        }
        if (!(await this.scope.canAccessProject(userId, flow.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este flujo');
        }
        const nextProjectId = flow.projectId;
        const nextScopeType = dto.scopeType ?? flow.scopeType;
        const nextTargetDocumentId = dto.targetDocumentId !== undefined
            ? dto.targetDocumentId || undefined
            : flow.targetDocumentId;
        if (nextScopeType === 'document_specific' && nextTargetDocumentId) {
            const document = await this.documents.findOne({ where: { id: nextTargetDocumentId } });
            if (!document || document.projectId !== nextProjectId) {
                throw new common_1.NotFoundException('Documento objetivo no encontrado para este flujo');
            }
        }
        Object.assign(flow, {
            name: dto.name ?? flow.name,
            entityType: dto.entityType ?? flow.entityType,
            scopeType: nextScopeType,
            targetDocumentId: nextScopeType === 'document_specific' ? nextTargetDocumentId : undefined,
            requireForPublication: dto.requireForPublication ?? flow.requireForPublication,
        });
        await this.flows.save(flow);
        if (dto.steps) {
            await this.syncFlowSteps(flow.id, flow.steps ?? [], dto.steps);
        }
        return this.getFlowDetail(userId, flow.id);
    }
    async deactivateFlow(userId, flowId) {
        const flow = await this.flows.findOne({ where: { id: flowId } });
        if (!flow) {
            throw new common_1.NotFoundException('Flujo no encontrado');
        }
        if (!(await this.scope.canAccessProject(userId, flow.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este flujo');
        }
        flow.active = false;
        await this.flows.save(flow);
        await this.flows.softDelete(flowId);
        return { ok: true, id: flowId };
    }
    async getFlowDetail(userId, flowId) {
        const flow = await this.flows.findOne({ where: { id: flowId }, relations: ['steps'] });
        if (!flow) {
            throw new common_1.NotFoundException('Flujo no encontrado');
        }
        if (!(await this.scope.canAccessProject(userId, flow.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este flujo');
        }
        return this.serializeFlow(flow);
    }
    async startDocumentApproval(userId, dto) {
        const document = await this.assertDocumentAccess(userId, dto.documentId);
        const workflow = dto.workflowId
            ? await this.loadWorkflowForDocument(userId, dto.workflowId, document.id)
            : await this.findApplicableWorkflow(document.projectId, document.id);
        if (!workflow) {
            throw new common_1.NotFoundException('No existe un flujo de aprobación aplicable para este documento');
        }
        const openRequest = await this.requests.findOne({
            where: {
                entityId: document.id,
                entityType: 'document',
                status: (0, typeorm_2.In)(['pending', 'in_process']),
            },
        });
        if (openRequest) {
            const existingWorkflow = await this.flows.findOne({
                where: { id: openRequest.workflowId },
                withDeleted: true,
            });
            if (existingWorkflow && existingWorkflow.active && !existingWorkflow.deletedAt) {
                return this.getRequestDetail(userId, openRequest.id);
            }
            openRequest.status = 'stopped';
            openRequest.completedAt = new Date();
            openRequest.lastActionAt = new Date();
            await this.requests.save(openRequest);
            await this.actions.save(this.actions.create({
                requestId: openRequest.id,
                actorId: userId,
                action: 'stopped',
                comment: 'La solicitud anterior se cerró automáticamente porque su flujo ya no estaba disponible.',
            }));
        }
        const orderedSteps = [...(workflow.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder);
        if (!orderedSteps.length) {
            throw new common_1.NotFoundException('El flujo no tiene pasos configurados');
        }
        const now = new Date();
        const request = await this.requests.save(this.requests.create({
            workflowId: workflow.id,
            currentStepId: orderedSteps[0].id,
            requesterId: userId,
            projectId: document.projectId,
            entityType: 'document',
            entityId: document.id,
            status: 'in_process',
            requestedAt: now,
            lastActionAt: now,
        }));
        document.status = 'pending_approval';
        await this.documents.save(document);
        await this.actions.save(this.actions.create({
            requestId: request.id,
            stepId: orderedSteps[0].id,
            actorId: userId,
            action: 'submitted',
            comment: dto.comment,
            stepOrder: orderedSteps[0].stepOrder,
        }));
        await this.logDocumentAudit(document.id, userId, 'request_approval', undefined, {
            requestId: request.id,
            workflowId: workflow.id,
            currentStepId: orderedSteps[0].id,
        });
        await this.notifyApproverAssigned(request, orderedSteps[0], document);
        await this.notifyRequestSubmitted(request, orderedSteps[0], document);
        return this.getRequestDetail(userId, request.id);
    }
    async listPendingForUser(userId, roles) {
        await this.autoApproveDelayedSteps();
        await this.markStoppedRequests();
        const visibleProjectIds = await this.scope.visibleProjectIdsForUser(userId);
        if (!visibleProjectIds.length) {
            return [];
        }
        const requests = await this.requests.find({
            where: {
                projectId: (0, typeorm_2.In)(visibleProjectIds),
                status: (0, typeorm_2.In)(['pending', 'in_process', 'stopped']),
            },
            order: { updatedAt: 'DESC' },
        });
        const stepIds = requests.map((request) => request.currentStepId).filter(Boolean);
        const steps = stepIds.length ? await this.steps.find({ where: { id: (0, typeorm_2.In)(stepIds) } }) : [];
        const stepsById = new Map(steps.map((step) => [step.id, step]));
        const documents = await this.documents.find({
            where: { id: (0, typeorm_2.In)(requests.map((request) => request.entityId)) },
            relations: ['discipline'],
        });
        const documentsById = new Map(documents.map((document) => [document.id, document]));
        const projectIds = [...new Set(requests.map((r) => r.projectId))];
        const projects = projectIds.length
            ? await this.projectsRepo.find({ where: { id: (0, typeorm_2.In)(projectIds) } })
            : [];
        const projectsById = new Map(projects.map((p) => [p.id, p]));
        return requests
            .filter((request) => this.matchesCurrentApprover(stepsById.get(request.currentStepId ?? ''), userId, roles))
            .map((request) => this.serializeRequest(request, stepsById.get(request.currentStepId ?? ''), documentsById.get(request.entityId), projectsById.get(request.projectId)));
    }
    async listHistory(userId, documentId) {
        await this.autoApproveDelayedSteps();
        await this.markStoppedRequests();
        if (documentId) {
            await this.assertDocumentAccess(userId, documentId);
            const requests = await this.requests.find({
                where: { entityId: documentId, entityType: 'document' },
                order: { createdAt: 'DESC' },
            });
            return Promise.all(requests.map((request) => this.getRequestDetail(userId, request.id)));
        }
        const visibleProjectIds = await this.scope.visibleProjectIdsForUser(userId);
        const requests = await this.requests.find({
            where: { projectId: (0, typeorm_2.In)(visibleProjectIds) },
            order: { createdAt: 'DESC' },
        });
        return Promise.all(requests.map((request) => this.getRequestDetail(userId, request.id)));
    }
    async getRequestDetail(userId, requestId) {
        await this.autoApproveDelayedSteps();
        await this.markStoppedRequests();
        const request = await this.requests.findOne({ where: { id: requestId } });
        if (!request) {
            throw new common_1.NotFoundException('Solicitud no encontrada');
        }
        if (!(await this.scope.canAccessProject(userId, request.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a esta solicitud');
        }
        const [workflow, steps, actions, document] = await Promise.all([
            this.flows.findOne({ where: { id: request.workflowId } }),
            this.steps.find({ where: { workflowId: request.workflowId }, order: { stepOrder: 'ASC' } }),
            this.actions.find({
                where: { requestId },
                relations: ['actor', 'step'],
                order: { createdAt: 'ASC' },
            }),
            this.documents.findOne({ where: { id: request.entityId } }),
        ]);
        if (!workflow) {
            throw new common_1.NotFoundException('Flujo no encontrado para la solicitud');
        }
        return {
            id: request.id,
            status: request.status,
            requestedAt: request.requestedAt,
            lastActionAt: request.lastActionAt,
            completedAt: request.completedAt,
            workflow: this.serializeFlow({ ...workflow, steps }),
            currentStepId: request.currentStepId,
            currentStep: steps.find((step) => step.id === request.currentStepId) ?? null,
            document: document
                ? {
                    id: document.id,
                    documentNumber: document.documentNumber,
                    name: document.name,
                    status: document.status,
                }
                : null,
            actions: actions.map((action) => ({
                id: action.id,
                action: action.action,
                comment: action.comment,
                stepOrder: action.stepOrder,
                createdAt: action.createdAt,
                actor: action.actor
                    ? { id: action.actor.id, name: action.actor.name, email: action.actor.email }
                    : null,
                step: action.step
                    ? { id: action.step.id, name: action.step.name, stepOrder: action.step.stepOrder }
                    : null,
            })),
        };
    }
    async approve(userId, roles, requestId, dto) {
        const request = await this.loadActiveRequest(userId, requestId);
        const { steps, document } = await this.loadRequestContext(request);
        const currentStep = steps.find((step) => step.id === request.currentStepId);
        if (!currentStep || !this.matchesCurrentApprover(currentStep, userId, roles)) {
            throw new common_1.ForbiddenException('No eres el aprobador actual de este paso');
        }
        await this.registerAction(request, currentStep, userId, 'approved', dto.comment);
        const nextStep = steps.find((step) => step.stepOrder > currentStep.stepOrder);
        request.lastActionAt = new Date();
        if (nextStep) {
            request.currentStepId = nextStep.id;
            request.status = 'in_process';
            document.status = 'pending_approval';
        }
        else {
            request.currentStepId = currentStep.id;
            request.status = 'approved';
            request.completedAt = new Date();
            document.status = 'approved';
        }
        await this.requests.save(request);
        await this.documents.save(document);
        await this.logDocumentAudit(document.id, userId, 'approval', { requestStatus: 'in_process' }, { requestStatus: request.status });
        if (nextStep) {
            await this.notifyApproverAssigned(request, nextStep, document);
        }
        else {
            await this.notifyApprovalResult(request, document, 'approved');
        }
        return this.getRequestDetail(userId, request.id);
    }
    async reject(userId, roles, requestId, dto) {
        const request = await this.loadActiveRequest(userId, requestId);
        const { steps, document } = await this.loadRequestContext(request);
        const currentStep = steps.find((step) => step.id === request.currentStepId);
        if (!currentStep || !this.matchesCurrentApprover(currentStep, userId, roles)) {
            throw new common_1.ForbiddenException('No eres el aprobador actual de este paso');
        }
        request.status = 'rejected';
        request.completedAt = new Date();
        request.lastActionAt = new Date();
        document.status = 'in_review';
        await this.requests.save(request);
        await this.documents.save(document);
        await this.registerAction(request, currentStep, userId, 'rejected', dto.comment);
        await this.logDocumentAudit(document.id, userId, 'rejection', { requestStatus: 'in_process' }, { requestStatus: request.status });
        await this.notifyApprovalResult(request, document, 'rejected');
        return this.getRequestDetail(userId, request.id);
    }
    async requestChanges(userId, roles, requestId, dto) {
        const request = await this.loadActiveRequest(userId, requestId);
        const { steps, document } = await this.loadRequestContext(request);
        const currentStep = steps.find((step) => step.id === request.currentStepId);
        if (!currentStep || !this.matchesCurrentApprover(currentStep, userId, roles)) {
            throw new common_1.ForbiddenException('No eres el aprobador actual de este paso');
        }
        request.status = 'stopped';
        request.completedAt = new Date();
        request.lastActionAt = new Date();
        document.status = 'in_review';
        await this.requests.save(request);
        await this.documents.save(document);
        await this.registerAction(request, currentStep, userId, 'changes_requested', dto.comment);
        await this.logDocumentAudit(document.id, userId, 'request_changes', { requestStatus: 'in_process' }, { requestStatus: request.status });
        await this.notifyStopped(request, document);
        return this.getRequestDetail(userId, request.id);
    }
    async comment(userId, requestId, dto) {
        const request = await this.requests.findOne({ where: { id: requestId } });
        if (!request) {
            throw new common_1.NotFoundException('Solicitud no encontrada');
        }
        if (!(await this.scope.canAccessProject(userId, request.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a esta solicitud');
        }
        const step = request.currentStepId
            ? await this.steps.findOne({ where: { id: request.currentStepId } })
            : null;
        request.lastActionAt = new Date();
        await this.requests.save(request);
        await this.registerAction(request, step ?? undefined, userId, 'comment', dto.comment);
        await this.logDocumentAudit(request.entityId, userId, 'approval_comment', undefined, {
            requestId: request.id,
        });
        return this.getRequestDetail(userId, request.id);
    }
    async canPublishDocument(documentId) {
        const document = await this.documents.findOne({ where: { id: documentId } });
        if (!document) {
            throw new common_1.NotFoundException('Documento no encontrado');
        }
        const applicableFlow = await this.findApplicableWorkflow(document.projectId, document.id);
        if (!applicableFlow || !applicableFlow.requireForPublication) {
            return true;
        }
        const latestApproved = await this.requests.findOne({
            where: {
                entityId: document.id,
                entityType: 'document',
                workflowId: applicableFlow.id,
                status: 'approved',
            },
            order: { completedAt: 'DESC' },
        });
        return Boolean(latestApproved);
    }
    async loadRequestContext(request) {
        const [workflow, steps, document] = await Promise.all([
            this.flows.findOne({ where: { id: request.workflowId } }),
            this.steps.find({ where: { workflowId: request.workflowId }, order: { stepOrder: 'ASC' } }),
            this.documents.findOne({ where: { id: request.entityId } }),
        ]);
        if (!workflow || !document) {
            throw new common_1.NotFoundException('No fue posible cargar el contexto del flujo');
        }
        return { workflow, steps, document };
    }
    async registerAction(request, step, actorId, action, comment) {
        await this.actions.save(this.actions.create({
            requestId: request.id,
            stepId: step?.id,
            actorId,
            action,
            comment,
            stepOrder: step?.stepOrder,
        }));
    }
    async loadActiveRequest(userId, requestId) {
        const request = await this.requests.findOne({ where: { id: requestId } });
        if (!request) {
            throw new common_1.NotFoundException('Solicitud no encontrada');
        }
        if (!(await this.scope.canAccessProject(userId, request.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a esta solicitud');
        }
        return request;
    }
    async loadWorkflowForDocument(userId, workflowId, documentId) {
        const workflow = await this.flows.findOne({ where: { id: workflowId }, relations: ['steps'] });
        if (!workflow) {
            throw new common_1.NotFoundException('Flujo no encontrado');
        }
        if (!(await this.scope.canAccessProject(userId, workflow.projectId))) {
            throw new common_1.ForbiddenException('No tienes acceso a este flujo');
        }
        if (workflow.scopeType === 'document_specific' &&
            workflow.targetDocumentId &&
            workflow.targetDocumentId !== documentId) {
            throw new common_1.ForbiddenException('El flujo no aplica a este documento');
        }
        return workflow;
    }
    async findApplicableWorkflow(projectId, documentId) {
        const workflows = await this.flows.find({
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
            relations: ['steps'],
            order: { createdAt: 'DESC' },
        });
        const specific = workflows.find((workflow) => workflow.scopeType === 'document_specific');
        return specific ?? workflows[0] ?? null;
    }
    parseApproverUserIds(step) {
        if (step.approverUserIds) {
            try {
                const parsed = JSON.parse(step.approverUserIds);
                if (Array.isArray(parsed))
                    return parsed;
            }
            catch {
            }
        }
        if (step.approverUserId)
            return [step.approverUserId];
        return [];
    }
    matchesCurrentApprover(step, userId, roles) {
        if (!step)
            return false;
        if (step.approverRoleId && roles.includes(step.approverRoleId)) {
            return true;
        }
        const userIds = this.parseApproverUserIds(step);
        return userIds.includes(userId);
    }
    async autoApproveDelayedSteps() {
        const inProcess = await this.requests.find({
            where: { status: 'in_process' },
        });
        if (!inProcess.length)
            return;
        const stepIds = inProcess.map((r) => r.currentStepId).filter(Boolean);
        if (!stepIds.length)
            return;
        const steps = await this.steps.find({ where: { id: (0, typeorm_2.In)(stepIds) } });
        const stepsById = new Map(steps.map((s) => [s.id, s]));
        for (const request of inProcess) {
            const step = request.currentStepId ? stepsById.get(request.currentStepId) : undefined;
            if (!step || !step.dueDays)
                continue;
            const deadline = new Date((request.lastActionAt ?? request.requestedAt).getTime() + step.dueDays * 24 * 60 * 60 * 1000);
            if (new Date() <= deadline)
                continue;
            const document = await this.documents.findOne({ where: { id: request.entityId } });
            if (!document)
                continue;
            const actionPayload = {
                requestId: request.id,
                stepId: step.id,
                actorId: request.requesterId,
                action: 'approved',
                comment: 'Aprobado automáticamente por vencimiento de plazo.',
                stepOrder: step.stepOrder,
            };
            const nextStep = steps.find((s) => s.stepOrder > step.stepOrder);
            request.lastActionAt = new Date();
            if (nextStep) {
                request.currentStepId = nextStep.id;
                request.status = 'in_process';
                document.status = 'pending_approval';
            }
            else {
                request.currentStepId = step.id;
                request.status = 'approved';
                request.completedAt = new Date();
                document.status = 'approved';
            }
            await this.requests.save(request);
            await this.documents.save(document);
            await this.actions.save(this.actions.create(actionPayload));
            await this.logDocumentAudit(document.id, request.requesterId, 'approval', { requestStatus: 'in_process' }, { requestStatus: request.status });
            if (nextStep) {
                await this.notifyApproverAssigned(request, nextStep, document);
            }
            else {
                await this.notifyApprovalResult(request, document, 'approved');
            }
        }
    }
    async markStoppedRequests() {
        const threshold = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
        const stale = await this.requests.find({
            where: {
                status: (0, typeorm_2.In)(['pending', 'in_process']),
                lastActionAt: (0, typeorm_2.LessThan)(threshold),
            },
        });
        for (const request of stale) {
            request.status = 'stopped';
            request.completedAt = request.completedAt ?? new Date();
            await this.requests.save(request);
            await this.actions.save(this.actions.create({
                requestId: request.id,
                actorId: request.requesterId,
                action: 'stopped',
                comment: 'Flujo detenido automáticamente por inactividad mayor a 7 días.',
            }));
            const document = await this.documents.findOne({ where: { id: request.entityId } });
            if (document && document.status === 'pending_approval') {
                document.status = 'in_review';
                await this.documents.save(document);
                await this.logDocumentAudit(document.id, request.requesterId, 'approval_stopped', { requestStatus: 'in_process' }, { requestStatus: 'stopped' });
                await this.notifyStopped(request, document);
            }
        }
    }
    async notifyRequestSubmitted(request, step, document) {
        await this.notifications.notify({
            recipients: [{ userId: request.requesterId }],
            notificationType: 'approval_request_submitted',
            title: `Solicitud de aprobación enviada: ${document.name}`,
            body: `El documento ${document.documentNumber} fue enviado para aprobación al paso "${step.name}".`,
            entityType: 'document',
            entityId: document.id,
            category: 'approval',
            meta: { route: '/approvals', requestId: request.id },
            dedupeKey: `approval-request-submitted:${request.id}`,
        });
    }
    async notifyApproverAssigned(request, step, document) {
        const roleRecipients = await this.notifications.resolveApprovalRecipients(step);
        const userIds = this.parseApproverUserIds(step);
        const userRecipients = userIds.map((userId) => ({ userId }));
        const allRecipients = [...roleRecipients, ...userRecipients].filter((recipient, index, self) => recipient.userId && self.findIndex((r) => r.userId === recipient.userId) === index);
        await this.notifications.notify({
            recipients: allRecipients,
            notificationType: 'approval_assigned',
            title: `Aprobación asignada: ${document.name}`,
            body: `Tienes asignado el paso "${step.name}" del documento ${document.documentNumber}.`,
            entityType: 'document',
            entityId: document.id,
            category: 'approval',
            meta: { route: '/approvals', requestId: request.id, stepId: step.id },
            dedupeKey: `approval-assigned:${request.id}:${step.id}`,
        });
    }
    async notifyStopped(request, document) {
        await this.notifications.notify({
            recipients: [{ userId: request.requesterId }],
            notificationType: 'approval_stopped',
            title: `Flujo detenido: ${document.name}`,
            body: `El flujo de aprobación del documento ${document.documentNumber} se detuvo y requiere seguimiento.`,
            entityType: 'document',
            entityId: document.id,
            category: 'approval',
            meta: { route: '/approvals', requestId: request.id },
            dedupeKey: `approval-stopped:${request.id}`,
        });
    }
    async notifyApprovalResult(request, document, result) {
        const label = result === 'approved' ? 'aprobado' : 'rechazado';
        await this.notifications.notify({
            recipients: [
                { userId: request.requesterId },
                document.responsibleUserId ? { userId: document.responsibleUserId } : null,
            ].filter((item) => Boolean(item?.userId)),
            notificationType: 'document_approval_result',
            title: `Documento ${label}: ${document.name}`,
            body: `El documento ${document.documentNumber} fue ${label} en el flujo de aprobación.`,
            entityType: 'document',
            entityId: document.id,
            category: 'approval',
            meta: { route: '/approvals', requestId: request.id },
        });
    }
    serializeFlow(flow) {
        return {
            id: flow.id,
            projectId: flow.projectId,
            name: flow.name,
            entityType: flow.entityType,
            scopeType: flow.scopeType,
            targetDocumentId: flow.targetDocumentId,
            requireForPublication: flow.requireForPublication,
            active: flow.active,
            steps: (flow.steps ?? []).map((step) => ({
                id: step.id,
                stepOrder: step.stepOrder,
                name: step.name,
                approverUserId: step.approverUserId,
                approverUserIds: step.approverUserIds
                    ? (() => {
                        try {
                            return JSON.parse(step.approverUserIds);
                        }
                        catch {
                            return [];
                        }
                    })()
                    : step.approverUserId
                        ? [step.approverUserId]
                        : [],
                approverRoleId: step.approverRoleId,
                required: step.required,
                dueDays: step.dueDays,
            })),
            createdAt: flow.createdAt,
            updatedAt: flow.updatedAt,
        };
    }
    async syncFlowSteps(flowId, existingSteps, nextSteps) {
        const orderedExisting = [...existingSteps].sort((a, b) => a.stepOrder - b.stepOrder);
        const existingById = new Map(orderedExisting.map((step) => [step.id, step]));
        const matchedIds = new Set();
        const stepsToPersist = nextSteps.map((step, index) => {
            let current = step.id && existingById.has(step.id) && !matchedIds.has(step.id)
                ? existingById.get(step.id)
                : undefined;
            if (!current) {
                current = orderedExisting.find((candidate) => !matchedIds.has(candidate.id));
            }
            if (step.id && !current) {
                throw new common_1.BadRequestException('Uno de los pasos enviados ya no existe en este flujo.');
            }
            if (current) {
                matchedIds.add(current.id);
            }
            return this.steps.create({
                ...current,
                workflowId: flowId,
                stepOrder: index + 1,
                name: step.name,
                approverUserId: step.approverUserIds?.[0] ?? undefined,
                approverUserIds: step.approverUserIds?.length
                    ? JSON.stringify(step.approverUserIds)
                    : undefined,
                approverRoleId: step.approverRoleId,
                required: step.required ?? true,
                dueDays: step.dueDays,
            });
        });
        const stepsToRemove = orderedExisting.filter((step) => !matchedIds.has(step.id));
        if (stepsToRemove.length) {
            await this.assertStepsCanBeRemoved(stepsToRemove.map((step) => step.id));
        }
        if (orderedExisting.length) {
            await this.steps.save(orderedExisting.map((step, index) => this.steps.create({
                ...step,
                stepOrder: nextSteps.length + index + 1,
            })));
        }
        if (stepsToPersist.length) {
            await this.steps.save(stepsToPersist);
        }
        if (stepsToRemove.length) {
            await this.steps.delete({ id: (0, typeorm_2.In)(stepsToRemove.map((step) => step.id)) });
        }
    }
    async assertStepsCanBeRemoved(stepIds) {
        const [requestRefs, actionRefs] = await Promise.all([
            this.requests.count({ where: { currentStepId: (0, typeorm_2.In)(stepIds) } }),
            this.actions.count({ where: { stepId: (0, typeorm_2.In)(stepIds) } }),
        ]);
        if (requestRefs || actionRefs) {
            throw new common_1.BadRequestException('Este flujo ya tiene solicitudes o historial ligados a pasos existentes. Puedes editar sus datos, pero no eliminar pasos usados.');
        }
    }
    serializeRequest(request, currentStep, document, project) {
        return {
            id: request.id,
            projectId: request.projectId,
            status: request.status,
            requestedAt: request.requestedAt,
            lastActionAt: request.lastActionAt,
            currentStep: currentStep
                ? {
                    id: currentStep.id,
                    name: currentStep.name,
                    stepOrder: currentStep.stepOrder,
                    dueDays: currentStep.dueDays,
                }
                : null,
            document: document
                ? {
                    id: document.id,
                    documentNumber: document.documentNumber,
                    name: document.name,
                    status: document.status,
                    discipline: document.discipline
                        ? {
                            id: document.discipline.id,
                            code: document.discipline.code,
                            name: document.discipline.name,
                        }
                        : null,
                }
                : null,
            project: project
                ? {
                    id: project.id,
                    name: project.name,
                    code: project.code,
                }
                : null,
        };
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
    async logDocumentAudit(documentId, actorId, action, beforeState, afterState) {
        await this.auditLogs.save(this.auditLogs.create({
            documentId,
            actorId,
            action,
            beforeState,
            afterState,
        }));
    }
};
exports.ApprovalsService = ApprovalsService;
exports.ApprovalsService = ApprovalsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(approval_flow_entity_1.ApprovalFlow)),
    __param(1, (0, typeorm_1.InjectRepository)(approval_step_entity_1.ApprovalStep)),
    __param(2, (0, typeorm_1.InjectRepository)(approval_request_entity_1.ApprovalRequest)),
    __param(3, (0, typeorm_1.InjectRepository)(approval_request_action_entity_1.ApprovalRequestAction)),
    __param(4, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __param(5, (0, typeorm_1.InjectRepository)(document_audit_log_entity_1.DocumentAuditLog)),
    __param(6, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        access_scope_service_1.AccessScopeService,
        notifications_service_1.NotificationsService])
], ApprovalsService);
//# sourceMappingURL=approvals.service.js.map