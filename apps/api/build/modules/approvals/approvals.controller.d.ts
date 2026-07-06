import { RequestUser } from '../../common/interfaces/request-user.interface';
import { ApprovalActionDto } from './dto/approval-action.dto';
import { CreateApprovalFlowDto } from './dto/create-approval-flow.dto';
import { CreateApprovalRequestDto } from './dto/create-approval-request.dto';
import { ApprovalsService } from './approvals.service';
export declare class ApprovalsController {
    private readonly approvals;
    constructor(approvals: ApprovalsService);
    listFlows(user: RequestUser, projectId: string): Promise<{
        id: string;
        projectId: string;
        name: string;
        entityType: "document" | "contract" | "rfi";
        scopeType: "global" | "document_specific";
        targetDocumentId: string | undefined;
        requireForPublication: boolean;
        active: boolean;
        steps: {
            id: string;
            stepOrder: number;
            name: string;
            approverUserId: string | undefined;
            approverRoleId: string | undefined;
            required: boolean;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    createFlow(user: RequestUser, dto: CreateApprovalFlowDto): Promise<{
        id: string;
        projectId: string;
        name: string;
        entityType: "document" | "contract" | "rfi";
        scopeType: "global" | "document_specific";
        targetDocumentId: string | undefined;
        requireForPublication: boolean;
        active: boolean;
        steps: {
            id: string;
            stepOrder: number;
            name: string;
            approverUserId: string | undefined;
            approverRoleId: string | undefined;
            required: boolean;
        }[];
        createdAt: Date;
        updatedAt: Date;
    }>;
    startRequest(user: RequestUser, dto: CreateApprovalRequestDto): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "document" | "contract" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverRoleId: string | undefined;
                required: boolean;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: import("./approval-step.entity").ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "pending_approval" | "in_review" | "approved" | "published" | "expired" | "superseded" | "archived";
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
    pending(user: RequestUser): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        currentStep: {
            id: string;
            name: string;
            stepOrder: number;
        } | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "pending_approval" | "in_review" | "approved" | "published" | "expired" | "superseded" | "archived";
        } | null;
    }[]>;
    history(user: RequestUser, documentId?: string): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "document" | "contract" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverRoleId: string | undefined;
                required: boolean;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: import("./approval-step.entity").ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "pending_approval" | "in_review" | "approved" | "published" | "expired" | "superseded" | "archived";
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
    detail(user: RequestUser, id: string): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "document" | "contract" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverRoleId: string | undefined;
                required: boolean;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: import("./approval-step.entity").ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "pending_approval" | "in_review" | "approved" | "published" | "expired" | "superseded" | "archived";
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
    approve(user: RequestUser, id: string, dto: ApprovalActionDto): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "document" | "contract" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverRoleId: string | undefined;
                required: boolean;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: import("./approval-step.entity").ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "pending_approval" | "in_review" | "approved" | "published" | "expired" | "superseded" | "archived";
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
    reject(user: RequestUser, id: string, dto: ApprovalActionDto): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "document" | "contract" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverRoleId: string | undefined;
                required: boolean;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: import("./approval-step.entity").ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "pending_approval" | "in_review" | "approved" | "published" | "expired" | "superseded" | "archived";
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
    requestChanges(user: RequestUser, id: string, dto: ApprovalActionDto): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "document" | "contract" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverRoleId: string | undefined;
                required: boolean;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: import("./approval-step.entity").ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "pending_approval" | "in_review" | "approved" | "published" | "expired" | "superseded" | "archived";
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
    comment(user: RequestUser, id: string, dto: ApprovalActionDto): Promise<{
        id: string;
        status: "approved" | "expired" | "pending" | "in_process" | "rejected" | "stopped";
        requestedAt: Date;
        lastActionAt: Date | undefined;
        completedAt: Date | undefined;
        workflow: {
            id: string;
            projectId: string;
            name: string;
            entityType: "document" | "contract" | "rfi";
            scopeType: "global" | "document_specific";
            targetDocumentId: string | undefined;
            requireForPublication: boolean;
            active: boolean;
            steps: {
                id: string;
                stepOrder: number;
                name: string;
                approverUserId: string | undefined;
                approverRoleId: string | undefined;
                required: boolean;
            }[];
            createdAt: Date;
            updatedAt: Date;
        };
        currentStepId: string | undefined;
        currentStep: import("./approval-step.entity").ApprovalStep | null;
        document: {
            id: string;
            documentNumber: string;
            name: string;
            status: "draft" | "pending_approval" | "in_review" | "approved" | "published" | "expired" | "superseded" | "archived";
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
}
