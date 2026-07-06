import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { ApprovalRequest } from '../approvals/approval-request.entity';
import { ContractObligation } from '../clm/contract-obligation.entity';
import { Contract } from '../clm/contract.entity';
import { DocumentRecord } from '../documents/document.entity';
import { Project } from '../projects/project.entity';
import { Rfi } from '../rfis/rfi.entity';
import { RequestUser } from '../../common/interfaces/request-user.interface';
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
export declare class DashboardService {
  private readonly projects;
  private readonly documents;
  private readonly approvalRequests;
  private readonly rfis;
  private readonly contracts;
  private readonly obligations;
  private readonly scope;
  constructor(
    projects: Repository<Project>,
    documents: Repository<DocumentRecord>,
    approvalRequests: Repository<ApprovalRequest>,
    rfis: Repository<Rfi>,
    contracts: Repository<Contract>,
    obligations: Repository<ContractObligation>,
    scope: AccessScopeService
  );
  summary(userId: string): Promise<{
    projects: number;
    documents: number;
    pendingApprovals: number;
    openRfis: number;
    expiringContracts: number;
  }>;
  executive(user: RequestUser): Promise<{
    generatedAt: string;
    permissions: {
      documents: boolean;
      approvals: boolean;
      contracts: boolean;
      projects: boolean;
    };
    global: MetricSet;
    projects: {
      id: string;
      name: string;
      code: string;
      status: string;
      isActive: boolean;
      metrics: MetricSet;
    }[];
    charts: {
      documentStatusDistribution: ChartPoint[];
      documentsByDiscipline: ChartPoint[];
      upcomingRenewals: ChartPoint[];
      rfisByStatus: ChartPoint[];
      contractsByStatus: ChartPoint[];
    };
    signals: ExecutiveSignal[];
  }>;
  private buildDocumentStatusDistribution;
  private buildDocumentsByDiscipline;
  private buildUpcomingRenewals;
  private buildRfisByStatus;
  private buildContractsByStatus;
  private buildSignals;
  private countByLabel;
  private emptyMetrics;
  private serializePermissions;
  private hasPermission;
  private isDocumentExpired;
  private isDocumentExpiringSoon;
  private isContractExpired;
  private isContractExpiringSoon;
  private isPendingObligation;
  private countExpiredRfis;
  private isWithinDays;
  private startOfDay;
  private toLabel;
  private mergeNullable;
}
export {};
