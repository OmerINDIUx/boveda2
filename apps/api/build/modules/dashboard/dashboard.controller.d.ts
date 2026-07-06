import { RequestUser } from '../../common/interfaces/request-user.interface';
import { DashboardService } from './dashboard.service';
export declare class DashboardController {
  private readonly dashboard;
  constructor(dashboard: DashboardService);
  summary(user: RequestUser): Promise<{
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
    global: {
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
    projects: {
      id: string;
      name: string;
      code: string;
      status: string;
      isActive: boolean;
      metrics: {
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
    }[];
    charts: {
      documentStatusDistribution: {
        key: string;
        label: string;
        value: number;
      }[];
      documentsByDiscipline: {
        key: string;
        label: string;
        value: number;
      }[];
      upcomingRenewals: {
        key: string;
        label: string;
        value: number;
      }[];
      rfisByStatus: {
        key: string;
        label: string;
        value: number;
      }[];
      contractsByStatus: {
        key: string;
        label: string;
        value: number;
      }[];
    };
    signals: {
      key: string;
      label: string;
      priority: 'critical' | 'high' | 'medium';
      count: number;
      description: string;
    }[];
  }>;
}
