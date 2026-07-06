import { ApprovalFlow } from './approval-flow.entity';
export declare class ApprovalStep {
    id: string;
    workflowId: string;
    workflow: ApprovalFlow;
    stepOrder: number;
    name: string;
    approverRoleId?: string;
    approverUserId?: string;
    required: boolean;
    createdAt: Date;
    updatedAt: Date;
}
