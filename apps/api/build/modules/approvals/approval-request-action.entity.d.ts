import { User } from '../users/user.entity';
import { ApprovalRequest } from './approval-request.entity';
import { ApprovalStep } from './approval-step.entity';
export declare class ApprovalRequestAction {
    id: string;
    requestId: string;
    request: ApprovalRequest;
    stepId?: string;
    step?: ApprovalStep;
    actorId: string;
    actor: User;
    action: 'submitted' | 'approved' | 'rejected' | 'changes_requested' | 'comment' | 'stopped' | 'expired';
    comment?: string;
    stepOrder?: number;
    createdAt: Date;
}
