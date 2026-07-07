import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { PermissionKey } from '../../common/permissions';
import { ApprovalRequest } from '../approvals/approval-request.entity';
import { ContractObligation } from '../clm/contract-obligation.entity';
import { Contract } from '../clm/contract.entity';
import { DocumentRecord } from '../documents/document.entity';
import { Project } from '../projects/project.entity';
import { Rfi } from '../rfis/rfi.entity';
import { RequestUser } from '../../common/interfaces/request-user.interface';

const DOCUMENT_SOON_DAYS = 7;
const RENEWAL_SOON_DAYS = 30;
const OBLIGATION_SOON_DAYS = 14;

type MetricSet = {
  activeProjects: number | null;
  controlledDocuments: number | null;
  approvedDocuments: number | null;
  documentsInReview: number | null;
  draftDocuments: number | null;
  expiredDocuments: number | null;
  documentsExpiringSoon: number | null;
  activeFlows: number | null;
  stoppedFlows: number | null;
  openRfis: number | null;
  activeContracts: number | null;
  contractsExpiringSoon: number | null;
  expiredContracts: number | null;
  earlyAlerts: number | null;
};

type ChartPoint = {
  key: string;
  label: string;
  value: number;
};

type ExecutiveSignal = {
  key: string;
  label: string;
  priority: 'critical' | 'high' | 'medium';
  count: number;
  description: string;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
    @InjectRepository(DocumentRecord)
    private readonly documents: Repository<DocumentRecord>,
    @InjectRepository(ApprovalRequest)
    private readonly approvalRequests: Repository<ApprovalRequest>,
    @InjectRepository(Rfi)
    private readonly rfis: Repository<Rfi>,
    @InjectRepository(Contract)
    private readonly contracts: Repository<Contract>,
    @InjectRepository(ContractObligation)
    private readonly obligations: Repository<ContractObligation>,
    private readonly scope: AccessScopeService
  ) {}

  async summary(userId: string) {
    const visibleProjectIds = await this.scope.visibleProjectIdsForUser(userId);
    if (!visibleProjectIds.length) {
      return {
        projects: 0,
        documents: 0,
        pendingApprovals: 0,
        openRfis: 0,
        expiringContracts: 0,
      };
    }
    const projects = await this.projects.find({
      where: { id: In(visibleProjectIds) },
    });
    const documents = projects.length
      ? await this.documents.find({
          where: { projectId: In(projects.map((project) => project.id)) },
        })
      : [];
    return {
      projects: projects.length,
      documents: documents.length,
      pendingApprovals: 0,
      openRfis: 0,
      expiringContracts: 0,
    };
  }

  async executive(user: RequestUser) {
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
          contractsByStatus: [],
        },
        signals: [],
      };
    }

    const [projects, documents, flows, rfis, contracts] = await Promise.all([
      this.projects.find({
        where: { id: In(visibleProjectIds) },
        order: { name: 'ASC' },
      }),
      this.hasPermission(user.permissions, PermissionKey.DocumentsView)
        ? this.documents.find({
            where: { projectId: In(visibleProjectIds) },
            relations: ['discipline'],
            order: { updatedAt: 'DESC' },
          })
        : Promise.resolve([]),
      this.hasPermission(user.permissions, PermissionKey.DocumentsApprove)
        ? this.approvalRequests.find({
            where: { projectId: In(visibleProjectIds) },
            order: { updatedAt: 'DESC' },
          })
        : Promise.resolve([]),
      this.rfis.find({
        where: { projectId: In(visibleProjectIds) },
        order: { createdAt: 'DESC' },
      }),
      this.hasPermission(user.permissions, PermissionKey.ContractsManage)
        ? this.contracts.find({
            where: { projectId: In(visibleProjectIds) },
            order: { updatedAt: 'DESC' },
          })
        : Promise.resolve([]),
    ]);

    const obligations =
      this.hasPermission(user.permissions, PermissionKey.ContractsManage) && contracts.length
        ? await this.obligations.find({
            where: { contractId: In(contracts.map((contract) => contract.id)) },
            relations: ['contract'],
          })
        : [];

    const contractsById = new Map(contracts.map((contract) => [contract.id, contract]));
    const relevantObligations = obligations.filter((obligation) =>
      obligation.contractId ? contractsById.has(obligation.contractId) : false
    );

    const metricsByProject = new Map<string, MetricSet>();
    for (const project of projects) {
      metricsByProject.set(project.id, this.emptyMetrics(project.isActive ? 1 : 0));
    }

    for (const project of projects) {
      const metrics = metricsByProject.get(project.id)!;
      metrics.activeProjects = project.isActive ? 1 : 0;
    }

    if (documents.length) {
      for (const document of documents) {
        const metrics = metricsByProject.get(document.projectId);
        if (!metrics) continue;
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
    } else {
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
        if (!metrics) continue;
        if (flow.status === 'pending' || flow.status === 'in_process') {
          metrics.activeFlows = (metrics.activeFlows ?? 0) + 1;
        }
        if (flow.status === 'stopped') {
          metrics.stoppedFlows = (metrics.stoppedFlows ?? 0) + 1;
        }
      }
    } else {
      for (const metrics of metricsByProject.values()) {
        metrics.activeFlows = null;
        metrics.stoppedFlows = null;
      }
    }

    for (const rfi of rfis) {
      const metrics = metricsByProject.get(rfi.projectId);
      if (!metrics) continue;
      if (rfi.status === 'open') {
        metrics.openRfis = (metrics.openRfis ?? 0) + 1;
      }
    }

    if (contracts.length) {
      for (const contract of contracts) {
        const metrics = metricsByProject.get(contract.projectId);
        if (!metrics) continue;
        if (
          contract.status === 'active' ||
          contract.status === 'approved' ||
          contract.status === 'expiring_soon'
        ) {
          metrics.activeContracts = (metrics.activeContracts ?? 0) + 1;
        }
        if (this.isContractExpiringSoon(contract)) {
          metrics.contractsExpiringSoon = (metrics.contractsExpiringSoon ?? 0) + 1;
        }
        if (this.isContractExpired(contract)) {
          metrics.expiredContracts = (metrics.expiredContracts ?? 0) + 1;
        }
      }
    } else {
      for (const metrics of metricsByProject.values()) {
        metrics.activeContracts = null;
        metrics.contractsExpiringSoon = null;
        metrics.expiredContracts = null;
      }
    }

    const obligationsByProject = new Map<string, number>();
    for (const obligation of relevantObligations) {
      const projectId = obligation.contract?.projectId;
      if (!projectId) continue;
      obligationsByProject.set(
        projectId,
        (obligationsByProject.get(projectId) ?? 0) + (this.isPendingObligation(obligation) ? 1 : 0)
      );
    }

    for (const project of projects) {
      const metrics = metricsByProject.get(project.id)!;
      const earlyAlerts = [
        metrics.expiredDocuments,
        metrics.documentsExpiringSoon,
        metrics.stoppedFlows,
        this.countExpiredRfis(rfis.filter((rfi) => rfi.projectId === project.id)),
        metrics.contractsExpiringSoon,
        obligationsByProject.get(project.id) ?? 0,
      ].reduce<number>((sum, value) => sum + (value ?? 0), 0);
      metrics.earlyAlerts = earlyAlerts;
    }

    const global = [...metricsByProject.values()].reduce<MetricSet>(
      (acc, item) => ({
        activeProjects: (acc.activeProjects ?? 0) + (item.activeProjects ?? 0),
        controlledDocuments: this.mergeNullable(acc.controlledDocuments, item.controlledDocuments),
        approvedDocuments: this.mergeNullable(acc.approvedDocuments, item.approvedDocuments),
        documentsInReview: this.mergeNullable(acc.documentsInReview, item.documentsInReview),
        draftDocuments: this.mergeNullable(acc.draftDocuments, item.draftDocuments),
        expiredDocuments: this.mergeNullable(acc.expiredDocuments, item.expiredDocuments),
        documentsExpiringSoon: this.mergeNullable(
          acc.documentsExpiringSoon,
          item.documentsExpiringSoon
        ),
        activeFlows: this.mergeNullable(acc.activeFlows, item.activeFlows),
        stoppedFlows: this.mergeNullable(acc.stoppedFlows, item.stoppedFlows),
        openRfis: (acc.openRfis ?? 0) + (item.openRfis ?? 0),
        activeContracts: this.mergeNullable(acc.activeContracts, item.activeContracts),
        contractsExpiringSoon: this.mergeNullable(
          acc.contractsExpiringSoon,
          item.contractsExpiringSoon
        ),
        expiredContracts: this.mergeNullable(acc.expiredContracts, item.expiredContracts),
        earlyAlerts: this.mergeNullable(acc.earlyAlerts, item.earlyAlerts),
      }),
      this.emptyMetrics(0)
    );

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
        metrics: metricsByProject.get(project.id) ?? this.emptyMetrics(project.isActive ? 1 : 0),
      })),
      charts: {
        documentStatusDistribution: documents.length
          ? this.buildDocumentStatusDistribution(documents)
          : [],
        documentsByDiscipline: documents.length ? this.buildDocumentsByDiscipline(documents) : [],
        upcomingRenewals,
        rfisByStatus: this.buildRfisByStatus(rfis),
        contractsByStatus: contracts.length ? this.buildContractsByStatus(contracts) : [],
      },
      signals: this.buildSignals(global, rfis, relevantObligations, totalUpcomingRenewals),
    };
  }

  private buildDocumentStatusDistribution(documents: DocumentRecord[]): ChartPoint[] {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      pending_approval: 'Por aprobar',
      in_review: 'En revisión',
      approved: 'Aprobado',
      published: 'Publicado',
      expired: 'Vencido',
      superseded: 'Sustituido',
      archived: 'Archivado',
    };

    return this.countByLabel(
      documents.map((document) => document.status),
      labels
    );
  }

  private buildDocumentsByDiscipline(documents: DocumentRecord[]): ChartPoint[] {
    const counts = new Map<string, number>();
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

  private buildUpcomingRenewals(
    projects: Project[],
    documents: DocumentRecord[],
    contracts: Contract[]
  ): ChartPoint[] {
    const counts = new Map<string, number>();
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
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }

  private buildRfisByStatus(rfis: Rfi[]): ChartPoint[] {
    const labels: Record<string, string> = {
      open: 'Abierto',
      in_progress: 'En proceso',
      answered: 'Respondido',
      closed: 'Cerrado',
      overdue: 'Vencido',
    };

    return this.countByLabel(
      rfis.map((rfi) => rfi.status),
      labels
    );
  }

  private buildContractsByStatus(contracts: Contract[]): ChartPoint[] {
    const labels: Record<string, string> = {
      draft: 'Borrador',
      in_review: 'En revisión',
      approved: 'Aprobado',
      active: 'Vigente',
      expiring_soon: 'Próximo a vencer',
      expired: 'Vencido',
      renewed: 'Renovado',
      closed: 'Cerrado',
    };

    return this.countByLabel(
      contracts.map((contract) => contract.status),
      labels
    );
  }

  private buildSignals(
    global: MetricSet,
    rfis: Rfi[],
    obligations: ContractObligation[],
    upcomingRenewals: number
  ): ExecutiveSignal[] {
    const expiredRfis = this.countExpiredRfis(rfis);
    const pendingObligations = obligations.filter((obligation) =>
      this.isPendingObligation(obligation)
    ).length;

    const signals: ExecutiveSignal[] = [
      {
        key: 'expiredDocuments',
        label: 'Documentos vencidos',
        priority: 'critical',
        count: global.expiredDocuments ?? 0,
        description: 'Documentos fuera de fecha objetivo y aun no cerrados.',
      },
      {
        key: 'upcomingRenewals',
        label: 'Renovaciones proximas',
        priority: 'high',
        count: upcomingRenewals,
        description: 'Documentos y contratos renovables con ventana de renovacion cercana.',
      },
      {
        key: 'stoppedFlows',
        label: 'Flujos detenidos',
        priority: 'critical',
        count: global.stoppedFlows ?? 0,
        description: 'Solicitudes de aprobacion detenidas por cambios o inactividad.',
      },
      {
        key: 'expiredRfis',
        label: 'RFIs vencidos',
        priority: 'critical',
        count: expiredRfis,
        description: 'RFIs abiertos cuya fecha compromiso ya se vencio.',
      },
      {
        key: 'contractsExpiringSoon',
        label: 'Contratos proximos a vencer',
        priority: 'high',
        count: global.contractsExpiringSoon ?? 0,
        description: 'Contratos vigentes o en renovacion con vencimiento cercano.',
      },
      {
        key: 'pendingObligations',
        label: 'Obligaciones contractuales pendientes',
        priority: 'medium',
        count: pendingObligations,
        description: 'Obligaciones en curso, vencidas o cercanas al vencimiento.',
      },
    ];

    return signals.sort((a, b) => b.count - a.count);
  }

  private countByLabel(values: string[], labels: Record<string, string>): ChartPoint[] {
    const counts = new Map<string, number>();
    for (const value of values) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([key, value]) => ({
        key,
        label: labels[key] ?? this.toLabel(key),
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }

  private emptyMetrics(activeProjects: number | null = null): MetricSet {
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
      earlyAlerts: 0,
    };
  }

  private serializePermissions(permissions: string[]) {
    return {
      documents: this.hasPermission(permissions, PermissionKey.DocumentsView),
      approvals: this.hasPermission(permissions, PermissionKey.DocumentsApprove),
      contracts: this.hasPermission(permissions, PermissionKey.ContractsManage),
      projects: this.hasPermission(permissions, PermissionKey.ProjectsView),
    };
  }

  private hasPermission(permissions: string[], permission: string) {
    return permissions.includes(permission);
  }

  private isDocumentExpired(document: DocumentRecord) {
    return document.status === 'expired' || this.isWithinDays(document.dueDate, 0, true);
  }

  private isDocumentExpiringSoon(document: DocumentRecord) {
    if (this.isDocumentExpired(document)) {
      return false;
    }
    return this.isWithinDays(document.dueDate, DOCUMENT_SOON_DAYS, false);
  }

  private isContractExpired(contract: Contract) {
    return contract.status === 'expired' || this.isWithinDays(contract.endDate, 0, true);
  }

  private isContractExpiringSoon(contract: Contract) {
    if (this.isContractExpired(contract)) {
      return false;
    }
    return this.isWithinDays(contract.endDate, RENEWAL_SOON_DAYS, false);
  }

  private isPendingObligation(obligation: ContractObligation) {
    if (obligation.status === 'completed' || obligation.status === 'waived') {
      return false;
    }
    return (
      obligation.status === 'overdue' ||
      this.isWithinDays(obligation.commitmentDate, OBLIGATION_SOON_DAYS, false)
    );
  }

  private countExpiredRfis(rfis: Rfi[]) {
    return rfis.filter((rfi) => rfi.status === 'open' && this.isWithinDays(rfi.dueDate, 0, true))
      .length;
  }

  private isWithinDays(dateValue: string | undefined, limitDays: number, overdue: boolean) {
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

  private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  private toLabel(value: string) {
    const map: Record<string, string> = {
      draft: 'Borrador',
      in_review: 'En revisión',
      pending_approval: 'Pendiente de aprobación',
      approved: 'Aprobado',
      rejected: 'Rechazado',
      published: 'Publicado',
      expired: 'Vencido',
      expiring_soon: 'Por vencer',
      active: 'Vigente',
      closed: 'Cerrado',
      renewed: 'Renovado',
      open: 'Abierto',
      in_progress: 'En proceso',
      answered: 'Respondido',
      overdue: 'Vencido',
      stopped: 'Detenido',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
      terminated: 'Terminado',
      superseded: 'Reemplazado',
      archived: 'Archivado',
      signed: 'Firmado',
      low: 'Baja',
      normal: 'Normal',
      high: 'Alta',
      urgent: 'Urgente',
    };
    return (
      map[value] ?? value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
  }

  private mergeNullable(current: number | null, next: number | null) {
    if (current === null || next === null) {
      return current === null && next === null ? null : (current ?? 0) + (next ?? 0);
    }
    return current + next;
  }
}
