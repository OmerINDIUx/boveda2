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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const access_scope_service_1 = require("../../common/access-scope.service");
const permissions_1 = require("../../common/permissions");
const approval_request_entity_1 = require("../approvals/approval-request.entity");
const contract_obligation_entity_1 = require("../clm/contract-obligation.entity");
const contract_entity_1 = require("../clm/contract.entity");
const document_entity_1 = require("../documents/document.entity");
const project_entity_1 = require("../projects/project.entity");
const rfi_entity_1 = require("../rfis/rfi.entity");
const DOCUMENT_SOON_DAYS = 7;
const RENEWAL_SOON_DAYS = 30;
const RFI_SOON_DAYS = 7;
const OBLIGATION_SOON_DAYS = 14;
let DashboardService = class DashboardService {
    projects;
    documents;
    approvalRequests;
    rfis;
    contracts;
    obligations;
    scope;
    constructor(projects, documents, approvalRequests, rfis, contracts, obligations, scope) {
        this.projects = projects;
        this.documents = documents;
        this.approvalRequests = approvalRequests;
        this.rfis = rfis;
        this.contracts = contracts;
        this.obligations = obligations;
        this.scope = scope;
    }
    async summary(userId) {
        const visibleProjectIds = await this.scope.visibleProjectIdsForUser(userId);
        if (!visibleProjectIds.length) {
            return {
                projects: 0,
                documents: 0,
                pendingApprovals: 0,
                openRfis: 0,
                expiringContracts: 0
            };
        }
        const projects = await this.projects.find({
            where: { id: (0, typeorm_2.In)(visibleProjectIds) }
        });
        const documents = projects.length
            ? await this.documents.find({ where: { projectId: (0, typeorm_2.In)(projects.map((project) => project.id)) } })
            : [];
        return {
            projects: projects.length,
            documents: documents.length,
            pendingApprovals: 0,
            openRfis: 0,
            expiringContracts: 0
        };
    }
    async executive(user) {
        const visibleProjectIds = await this.scope.visibleProjectIdsForUser(user.id);
        if (!visibleProjectIds.length) {
            return {
                generatedAt: new Date().toISOString(),
                permissions: this.serializePermissions(user.permissions),
                global: this.emptyMetrics(),
                projects: [],
                charts: {
                    documentStatusDistribution: [],
                    documentsByDiscipline: [],
                    upcomingRenewals: [],
                    rfisByStatus: [],
                    contractsByStatus: []
                },
                signals: []
            };
        }
        const [projects, documents, flows, rfis, contracts] = await Promise.all([
            this.projects.find({
                where: { id: (0, typeorm_2.In)(visibleProjectIds) },
                order: { name: 'ASC' }
            }),
            this.hasPermission(user.permissions, permissions_1.PermissionKey.DocumentsView)
                ? this.documents.find({
                    where: { projectId: (0, typeorm_2.In)(visibleProjectIds) },
                    relations: ['discipline'],
                    order: { updatedAt: 'DESC' }
                })
                : Promise.resolve([]),
            this.hasPermission(user.permissions, permissions_1.PermissionKey.DocumentsApprove)
                ? this.approvalRequests.find({
                    where: { projectId: (0, typeorm_2.In)(visibleProjectIds) },
                    order: { updatedAt: 'DESC' }
                })
                : Promise.resolve([]),
            this.rfis.find({
                where: { projectId: (0, typeorm_2.In)(visibleProjectIds) },
                order: { createdAt: 'DESC' }
            }),
            this.hasPermission(user.permissions, permissions_1.PermissionKey.ContractsManage)
                ? this.contracts.find({
                    where: { projectId: (0, typeorm_2.In)(visibleProjectIds) },
                    order: { updatedAt: 'DESC' }
                })
                : Promise.resolve([])
        ]);
        const obligations = this.hasPermission(user.permissions, permissions_1.PermissionKey.ContractsManage) && contracts.length
            ? await this.obligations.find({
                where: { contractId: (0, typeorm_2.In)(contracts.map((contract) => contract.id)) },
                relations: ['contract']
            })
            : [];
        const contractsById = new Map(contracts.map((contract) => [contract.id, contract]));
        const relevantObligations = obligations.filter((obligation) => obligation.contractId ? contractsById.has(obligation.contractId) : false);
        const metricsByProject = new Map();
        for (const project of projects) {
            metricsByProject.set(project.id, this.emptyMetrics(project.isActive ? 1 : 0));
        }
        for (const project of projects) {
            const metrics = metricsByProject.get(project.id);
            metrics.activeProjects = project.isActive ? 1 : 0;
        }
        if (documents.length) {
            for (const document of documents) {
                const metrics = metricsByProject.get(document.projectId);
                if (!metrics)
                    continue;
                metrics.controlledDocuments = (metrics.controlledDocuments ?? 0) + 1;
                if (document.status === 'approved' || document.status === 'published') {
                    metrics.approvedDocuments = (metrics.approvedDocuments ?? 0) + 1;
                }
                if (document.status === 'in_review' || document.status === 'pending_approval') {
                    metrics.documentsInReview = (metrics.documentsInReview ?? 0) + 1;
                }
                if (document.status === 'draft') {
                    metrics.draftDocuments = (metrics.draftDocuments ?? 0) + 1;
                }
                if (this.isDocumentExpired(document)) {
                    metrics.expiredDocuments = (metrics.expiredDocuments ?? 0) + 1;
                }
                if (this.isDocumentExpiringSoon(document)) {
                    metrics.documentsExpiringSoon = (metrics.documentsExpiringSoon ?? 0) + 1;
                }
            }
        }
        else {
            for (const metrics of metricsByProject.values()) {
                metrics.controlledDocuments = null;
                metrics.approvedDocuments = null;
                metrics.documentsInReview = null;
                metrics.draftDocuments = null;
                metrics.expiredDocuments = null;
                metrics.documentsExpiringSoon = null;
            }
        }
        if (flows.length) {
            for (const flow of flows) {
                const metrics = metricsByProject.get(flow.projectId);
                if (!metrics)
                    continue;
                if (flow.status === 'pending' || flow.status === 'in_process') {
                    metrics.activeFlows = (metrics.activeFlows ?? 0) + 1;
                }
                if (flow.status === 'stopped') {
                    metrics.stoppedFlows = (metrics.stoppedFlows ?? 0) + 1;
                }
            }
        }
        else {
            for (const metrics of metricsByProject.values()) {
                metrics.activeFlows = null;
                metrics.stoppedFlows = null;
            }
        }
        for (const rfi of rfis) {
            const metrics = metricsByProject.get(rfi.projectId);
            if (!metrics)
                continue;
            if (rfi.status === 'open') {
                metrics.openRfis = (metrics.openRfis ?? 0) + 1;
            }
        }
        if (contracts.length) {
            for (const contract of contracts) {
                const metrics = metricsByProject.get(contract.projectId);
                if (!metrics)
                    continue;
                if (contract.status === 'active' || contract.status === 'approved' || contract.status === 'expiring_soon') {
                    metrics.activeContracts = (metrics.activeContracts ?? 0) + 1;
                }
                if (this.isContractExpiringSoon(contract)) {
                    metrics.contractsExpiringSoon = (metrics.contractsExpiringSoon ?? 0) + 1;
                }
                if (this.isContractExpired(contract)) {
                    metrics.expiredContracts = (metrics.expiredContracts ?? 0) + 1;
                }
            }
        }
        else {
            for (const metrics of metricsByProject.values()) {
                metrics.activeContracts = null;
                metrics.contractsExpiringSoon = null;
                metrics.expiredContracts = null;
            }
        }
        const obligationsByProject = new Map();
        for (const obligation of relevantObligations) {
            const projectId = obligation.contract?.projectId;
            if (!projectId)
                continue;
            obligationsByProject.set(projectId, (obligationsByProject.get(projectId) ?? 0) + (this.isPendingObligation(obligation) ? 1 : 0));
        }
        for (const project of projects) {
            const metrics = metricsByProject.get(project.id);
            const earlyAlerts = [
                metrics.expiredDocuments,
                metrics.documentsExpiringSoon,
                metrics.stoppedFlows,
                this.countExpiredRfis(rfis.filter((rfi) => rfi.projectId === project.id)),
                metrics.contractsExpiringSoon,
                obligationsByProject.get(project.id) ?? 0
            ].reduce((sum, value) => sum + (value ?? 0), 0);
            metrics.earlyAlerts = earlyAlerts;
        }
        const global = [...metricsByProject.values()].reduce((acc, item) => ({
            activeProjects: (acc.activeProjects ?? 0) + (item.activeProjects ?? 0),
            controlledDocuments: this.mergeNullable(acc.controlledDocuments, item.controlledDocuments),
            approvedDocuments: this.mergeNullable(acc.approvedDocuments, item.approvedDocuments),
            documentsInReview: this.mergeNullable(acc.documentsInReview, item.documentsInReview),
            draftDocuments: this.mergeNullable(acc.draftDocuments, item.draftDocuments),
            expiredDocuments: this.mergeNullable(acc.expiredDocuments, item.expiredDocuments),
            documentsExpiringSoon: this.mergeNullable(acc.documentsExpiringSoon, item.documentsExpiringSoon),
            activeFlows: this.mergeNullable(acc.activeFlows, item.activeFlows),
            stoppedFlows: this.mergeNullable(acc.stoppedFlows, item.stoppedFlows),
            openRfis: (acc.openRfis ?? 0) + (item.openRfis ?? 0),
            activeContracts: this.mergeNullable(acc.activeContracts, item.activeContracts),
            contractsExpiringSoon: this.mergeNullable(acc.contractsExpiringSoon, item.contractsExpiringSoon),
            expiredContracts: this.mergeNullable(acc.expiredContracts, item.expiredContracts),
            earlyAlerts: this.mergeNullable(acc.earlyAlerts, item.earlyAlerts)
        }), this.emptyMetrics(0));
        const upcomingRenewals = this.buildUpcomingRenewals(projects, documents, contracts);
        const totalUpcomingRenewals = upcomingRenewals.reduce((sum, item) => sum + item.value, 0);
        return {
            generatedAt: new Date().toISOString(),
            permissions: this.serializePermissions(user.permissions),
            global,
            projects: projects.map((project) => ({
                id: project.id,
                name: project.name,
                code: project.code,
                status: project.status,
                isActive: project.isActive,
                metrics: metricsByProject.get(project.id) ?? this.emptyMetrics(project.isActive ? 1 : 0)
            })),
            charts: {
                documentStatusDistribution: documents.length
                    ? this.buildDocumentStatusDistribution(documents)
                    : [],
                documentsByDiscipline: documents.length ? this.buildDocumentsByDiscipline(documents) : [],
                upcomingRenewals,
                rfisByStatus: this.buildRfisByStatus(rfis),
                contractsByStatus: contracts.length ? this.buildContractsByStatus(contracts) : []
            },
            signals: this.buildSignals(global, rfis, relevantObligations, totalUpcomingRenewals)
        };
    }
    buildDocumentStatusDistribution(documents) {
        const labels = {
            draft: 'Borrador',
            pending_approval: 'Por aprobar',
            in_review: 'En revision',
            approved: 'Aprobado',
            published: 'Publicado',
            expired: 'Vencido',
            superseded: 'Sustituido',
            archived: 'Archivado'
        };
        return this.countByLabel(documents.map((document) => document.status), labels);
    }
    buildDocumentsByDiscipline(documents) {
        const counts = new Map();
        for (const document of documents) {
            const key = document.disciplineId ?? 'general';
            const label = document.discipline?.name ?? 'General';
            counts.set(`${key}:::${label}`, (counts.get(`${key}:::${label}`) ?? 0) + 1);
        }
        return [...counts.entries()]
            .map(([entry, value]) => {
            const [key, label] = entry.split(':::');
            return { key, label, value };
        })
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    }
    buildUpcomingRenewals(projects, documents, contracts) {
        const counts = new Map();
        const projectMap = new Map(projects.map((project) => [project.id, project]));
        for (const document of documents) {
            if (document.renewable && this.isWithinDays(document.dueDate, RENEWAL_SOON_DAYS, false)) {
                counts.set(document.projectId, (counts.get(document.projectId) ?? 0) + 1);
            }
        }
        for (const contract of contracts) {
            if (contract.renewable && this.isWithinDays(contract.endDate, RENEWAL_SOON_DAYS, false)) {
                counts.set(contract.projectId, (counts.get(contract.projectId) ?? 0) + 1);
            }
        }
        return [...counts.entries()]
            .map(([projectId, value]) => ({
            key: projectId,
            label: projectMap.get(projectId)?.name ?? 'Proyecto',
            value
        }))
            .sort((a, b) => b.value - a.value);
    }
    buildRfisByStatus(rfis) {
        const labels = {
            open: 'Abierto',
            answered: 'Respondido',
            closed: 'Cerrado'
        };
        return this.countByLabel(rfis.map((rfi) => rfi.status), labels);
    }
    buildContractsByStatus(contracts) {
        const labels = {
            draft: 'Borrador',
            in_review: 'En revision',
            approved: 'Aprobado',
            active: 'Vigente',
            expiring_soon: 'Proximo a vencer',
            expired: 'Vencido',
            renewed: 'Renovado',
            closed: 'Cerrado'
        };
        return this.countByLabel(contracts.map((contract) => contract.status), labels);
    }
    buildSignals(global, rfis, obligations, upcomingRenewals) {
        const expiredRfis = this.countExpiredRfis(rfis);
        const pendingObligations = obligations.filter((obligation) => this.isPendingObligation(obligation)).length;
        const signals = [
            {
                key: 'expiredDocuments',
                label: 'Documentos vencidos',
                priority: 'critical',
                count: global.expiredDocuments ?? 0,
                description: 'Documentos fuera de fecha objetivo y aun no cerrados.'
            },
            {
                key: 'upcomingRenewals',
                label: 'Renovaciones proximas',
                priority: 'high',
                count: upcomingRenewals,
                description: 'Documentos y contratos renovables con ventana de renovacion cercana.'
            },
            {
                key: 'stoppedFlows',
                label: 'Flujos detenidos',
                priority: 'critical',
                count: global.stoppedFlows ?? 0,
                description: 'Solicitudes de aprobacion detenidas por cambios o inactividad.'
            },
            {
                key: 'expiredRfis',
                label: 'RFIs vencidos',
                priority: 'critical',
                count: expiredRfis,
                description: 'RFIs abiertos cuya fecha compromiso ya se vencio.'
            },
            {
                key: 'contractsExpiringSoon',
                label: 'Contratos proximos a vencer',
                priority: 'high',
                count: global.contractsExpiringSoon ?? 0,
                description: 'Contratos vigentes o en renovacion con vencimiento cercano.'
            },
            {
                key: 'pendingObligations',
                label: 'Obligaciones contractuales pendientes',
                priority: 'medium',
                count: pendingObligations,
                description: 'Obligaciones en curso, vencidas o cercanas al vencimiento.'
            }
        ];
        return signals.sort((a, b) => b.count - a.count);
    }
    countByLabel(values, labels) {
        const counts = new Map();
        for (const value of values) {
            counts.set(value, (counts.get(value) ?? 0) + 1);
        }
        return [...counts.entries()]
            .map(([key, value]) => ({
            key,
            label: labels[key] ?? this.toLabel(key),
            value
        }))
            .sort((a, b) => b.value - a.value);
    }
    emptyMetrics(activeProjects = null) {
        return {
            activeProjects,
            controlledDocuments: 0,
            approvedDocuments: 0,
            documentsInReview: 0,
            draftDocuments: 0,
            expiredDocuments: 0,
            documentsExpiringSoon: 0,
            activeFlows: 0,
            stoppedFlows: 0,
            openRfis: 0,
            activeContracts: 0,
            contractsExpiringSoon: 0,
            expiredContracts: 0,
            earlyAlerts: 0
        };
    }
    serializePermissions(permissions) {
        return {
            documents: this.hasPermission(permissions, permissions_1.PermissionKey.DocumentsView),
            approvals: this.hasPermission(permissions, permissions_1.PermissionKey.DocumentsApprove),
            contracts: this.hasPermission(permissions, permissions_1.PermissionKey.ContractsManage),
            projects: this.hasPermission(permissions, permissions_1.PermissionKey.ProjectsView)
        };
    }
    hasPermission(permissions, permission) {
        return permissions.includes(permission);
    }
    isDocumentExpired(document) {
        return document.status === 'expired' || this.isWithinDays(document.dueDate, 0, true);
    }
    isDocumentExpiringSoon(document) {
        if (this.isDocumentExpired(document)) {
            return false;
        }
        return this.isWithinDays(document.dueDate, DOCUMENT_SOON_DAYS, false);
    }
    isContractExpired(contract) {
        return contract.status === 'expired' || this.isWithinDays(contract.endDate, 0, true);
    }
    isContractExpiringSoon(contract) {
        if (this.isContractExpired(contract)) {
            return false;
        }
        return this.isWithinDays(contract.endDate, RENEWAL_SOON_DAYS, false);
    }
    isPendingObligation(obligation) {
        if (obligation.status === 'completed' || obligation.status === 'waived') {
            return false;
        }
        return obligation.status === 'overdue' || this.isWithinDays(obligation.commitmentDate, OBLIGATION_SOON_DAYS, false);
    }
    countExpiredRfis(rfis) {
        return rfis.filter((rfi) => rfi.status === 'open' && this.isWithinDays(rfi.dueDate, 0, true)).length;
    }
    isWithinDays(dateValue, limitDays, overdue) {
        if (!dateValue) {
            return false;
        }
        const today = this.startOfDay(new Date());
        const target = this.startOfDay(new Date(`${dateValue}T00:00:00`));
        const diffDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (overdue) {
            return diffDays < 0;
        }
        return diffDays >= 0 && diffDays <= limitDays;
    }
    startOfDay(date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
    toLabel(value) {
        return value
            .replaceAll('_', ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    }
    mergeNullable(current, next) {
        if (current === null || next === null) {
            return current === null && next === null ? null : (current ?? 0) + (next ?? 0);
        }
        return current + next;
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(project_entity_1.Project)),
    __param(1, (0, typeorm_1.InjectRepository)(document_entity_1.DocumentRecord)),
    __param(2, (0, typeorm_1.InjectRepository)(approval_request_entity_1.ApprovalRequest)),
    __param(3, (0, typeorm_1.InjectRepository)(rfi_entity_1.Rfi)),
    __param(4, (0, typeorm_1.InjectRepository)(contract_entity_1.Contract)),
    __param(5, (0, typeorm_1.InjectRepository)(contract_obligation_entity_1.ContractObligation)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        access_scope_service_1.AccessScopeService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map