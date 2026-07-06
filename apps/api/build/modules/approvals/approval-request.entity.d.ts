export declare class ApprovalRequest {
  id: string;
  workflowId: string;
  currentStepId?: string;
  requesterId: string;
  projectId: string;
  entityType: 'document' | 'contract' | 'rfi';
  entityId: string;
  status: 'pending' | 'in_process' | 'approved' | 'rejected' | 'stopped' | 'expired';
  requestedAt: Date;
  lastActionAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
