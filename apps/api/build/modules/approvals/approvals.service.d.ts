import { Repository } from 'typeorm';
import { AccessScopeService } from '../../common/access-scope.service';
import { DocumentAuditLog } from '../documents/document-audit-log.entity';
import { DocumentRecord } from '../documents/document.entity';
import { Project } from '../projects/project.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateApprovalFlowDto } from './dto/create-approval-flow.dto';
import { CreateApprovalRequestDto } from './dto/create-approval-request.dto';
import { ApprovalActionDto } from './dto/approval-action.dto';
import { UpdateApprovalFlowDto } from './dto/update-approval-flow.dto';
import { ApprovalFlow } from './approval-flow.entity';
import { ApprovalRequestAction } from './approval-request-action.entity';
import { ApprovalRequest } from './approval-request.entity';
import { ApprovalStep } from './approval-step.entity';
export declare class ApprovalsService {
    private readonly flows;
    private readonly steps;
    private readonly requests;
    private readonly actions;
    private readonly documents;
    private readonly auditLogs;
    private readonly projectsRepo;
    private readonly scope;
    private readonly notifications;
    constructor(flows: Repository<ApprovalFlow>, steps: Repository<ApprovalStep>, requests: Repository<ApprovalRequest>, actions: Repository<ApprovalRequestAction>, documents: Repository<DocumentRecord>, auditLogs: Repository<DocumentAuditLog>, projectsRepo: Repository<Project>, scope: AccessScopeService, notifications: NotificationsService);
    listFlows(userId: string, projectId: string): Promise<{
        id: string;
        projectId: string;
        name: string;
        entityType: "contract" | "document" | "rfi";
        scopeType: "global" | "document_specific";
        targetDocumentId: string | undefined;
        requireForPublication: boolean;
        active: boolean;
        steps: {
            id: string;
            stepOrder: number;
            name: string;
            approverUserId: string | undefined;
            approverUserIds: any;
            approverRoleId: string | undefined;
            required: boolean;
            dueDays: number | undefined;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createFlow(userId: string, dto: CreateApprovalFlowDto): Promise<{
        id: string;
        projectId: string;
        name: string;
        entityType: "contract" | "document" | "rfi";
        scopeType: "global" | "document_specific";
        targetDocumentId: string | undefined;
        requireForPublication: boolean;
        active: boolean;
        steps: {
            id: string;
            stepOrder: number;
            name: string;
            approverUserId: string | undefined;
            approverUserIds: any;
            approverRoleId: string | undefined;
            required: boolean;
            dueDays: number | undefined;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateFlow(userId: string, flowId: string, dto: UpdateApprovalFlowDto): Promise<{
        id: string;
        projectId: string;
        name: string;
        entityType: "contract" | "document" | "rfi";
        scopeType: "global" | "document_specific";
        targetDocumentId: string | undefined;
        requireForPublication: boolean;
        active: boolean;
        steps: {
            id: string;
            stepOrder: number;
            name: string;
            approverUserId: string | undefined;
            approverUserIds: any;
            approverRoleId: string | undefined;
            required: boolean;
            dueDays: number | undefined;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    deactivateFlow(userId: string, flowId: string): Promise<{
        ok: boolean;
        id: string;
    }>;
    getFlowDetail(userId: string, flowId: string): Promise<{
        id: string;
        projectId: string;
        name: string;
        entityType: "contract" | "document" | "rfi";
        scopeType: "global" | "document_specific";
        targetDocumentId: string | undefined;
        requireForPublication: boolean;
        active: boolean;
        steps: {
            id: string;
            stepOrder: number;
            name: string;
            approverUserId: string | undefined;
            approverUserIds: any;
            approverRoleId: string | undefined;
            required: boolean;
            dueDays: number | undefined;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    startDocumentApproval(userId: string, dto: CreateApprovalRequestDto): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "contract" | "document" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverUserIds: any;
                approverRoleId: string | undefined;
                required: boolean;
                dueDays: number | undefined;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        } | null;
        actions: {
            id: string;
            action: "approved" | "expired" | "rejected" | "stopped" | "comment" | "submitted" | "changes_requested";
            comment: string | undefined;
            stepOrder: number | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
            step: {
                id: string;
                name: string;
                stepOrder: number;
            } | null;
        }[];
    }>;
    listPendingForUser(userId: string, roles: string[]): Promise<{
        id: string;
        projectId: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        currentStep: {
            id: string;
            name: string;
            stepOrder: number;
            dueDays: number | undefined;
        } | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
            discipline: {
                id: string;
                code: string;
                name: string;
            } | null;
        } | null;
        project: {
            id: string;
            name: string;
            code: string;
        } | null;
    }[]>;
    listHistory(userId: string, documentId?: string): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "contract" | "document" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverUserIds: any;
                approverRoleId: string | undefined;
                required: boolean;
                dueDays: number | undefined;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        } | null;
        actions: {
            id: string;
            action: "approved" | "expired" | "rejected" | "stopped" | "comment" | "submitted" | "changes_requested";
            comment: string | undefined;
            stepOrder: number | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
            step: {
                id: string;
                name: string;
                stepOrder: number;
            } | null;
        }[];
    }[]>;
    getRequestDetail(userId: string, requestId: string): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "contract" | "document" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverUserIds: any;
                approverRoleId: string | undefined;
                required: boolean;
                dueDays: number | undefined;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        } | null;
        actions: {
            id: string;
            action: "approved" | "expired" | "rejected" | "stopped" | "comment" | "submitted" | "changes_requested";
            comment: string | undefined;
            stepOrder: number | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
            step: {
                id: string;
                name: string;
                stepOrder: number;
            } | null;
        }[];
    }>;
    approve(userId: string, roles: string[], requestId: string, dto: ApprovalActionDto): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "contract" | "document" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverUserIds: any;
                approverRoleId: string | undefined;
                required: boolean;
                dueDays: number | undefined;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        } | null;
        actions: {
            id: string;
            action: "approved" | "expired" | "rejected" | "stopped" | "comment" | "submitted" | "changes_requested";
            comment: string | undefined;
            stepOrder: number | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
            step: {
                id: string;
                name: string;
                stepOrder: number;
            } | null;
        }[];
    }>;
    reject(userId: string, roles: string[], requestId: string, dto: ApprovalActionDto): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "contract" | "document" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverUserIds: any;
                approverRoleId: string | undefined;
                required: boolean;
                dueDays: number | undefined;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        } | null;
        actions: {
            id: string;
            action: "approved" | "expired" | "rejected" | "stopped" | "comment" | "submitted" | "changes_requested";
            comment: string | undefined;
            stepOrder: number | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
            step: {
                id: string;
                name: string;
                stepOrder: number;
            } | null;
        }[];
    }>;
    requestChanges(userId: string, roles: string[], requestId: string, dto: ApprovalActionDto): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "contract" | "document" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverUserIds: any;
                approverRoleId: string | undefined;
                required: boolean;
                dueDays: number | undefined;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        } | null;
        actions: {
            id: string;
            action: "approved" | "expired" | "rejected" | "stopped" | "comment" | "submitted" | "changes_requested";
            comment: string | undefined;
            stepOrder: number | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
            step: {
                id: string;
                name: string;
                stepOrder: number;
            } | null;
        }[];
    }>;
    comment(userId: string, requestId: string, dto: ApprovalActionDto): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "contract" | "document" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverUserIds: any;
                approverRoleId: string | undefined;
                required: boolean;
                dueDays: number | undefined;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "in_review" | "approved" | "expired" | "pending_approval" | "published" | "superseded" | "archived";
        } | null;
        actions: {
            id: string;
            action: "approved" | "expired" | "rejected" | "stopped" | "comment" | "submitted" | "changes_requested";
            comment: string | undefined;
            stepOrder: number | undefined;
            createdAt: Date;
            actor: {
                id: string;
                name: string;
                email: string;
            } | null;
            step: {
                id: string;
                name: string;
                stepOrder: number;
            } | null;
        }[];
    }>;
    canPublishDocument(documentId: string): Promise<boolean>;
    private loadRequestContext;
    private registerAction;
    private loadActiveRequest;
    private loadWorkflowForDocument;
    private findApplicableWorkflow;
    private parseApproverUserIds;
    private matchesCurrentApprover;
    private autoApproveDelayedSteps;
    private markStoppedRequests;
    private notifyRequestSubmitted;
    private notifyApproverAssigned;
    private notifyStopped;
    private notifyApprovalResult;
    private serializeFlow;
    private syncFlowSteps;
    private assertStepsCanBeRemoved;
    private serializeRequest;
    private assertDocumentAccess;
    private logDocumentAudit;
}
