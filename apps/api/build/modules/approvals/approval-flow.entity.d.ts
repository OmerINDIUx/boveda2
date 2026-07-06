import { ApprovalStep } from './approval-step.entity';
export declare class ApprovalFlow {
  id: string;
  projectId: string;
  name: string;
  entityType: 'document' | 'contract' | 'rfi';
  scopeType: 'global' | 'document_specific';
  targetDocumentId?: string;
  requireForPublication: boolean;
  active: boolean;
  createdById?: string;
  steps: ApprovalStep[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
