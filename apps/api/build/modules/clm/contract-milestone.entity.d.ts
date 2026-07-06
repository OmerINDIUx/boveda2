import { DocumentRecord } from '../documents/document.entity';
import { User } from '../users/user.entity';
import { Contract } from './contract.entity';
export declare class ContractMilestone {
  id: string;
  contractId: string;
  contract: Contract;
  name: string;
  milestoneDate: string;
  responsibleUserId?: string;
  responsibleUser?: User;
  status: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  completedAt?: Date;
  evidenceDocumentId?: string;
  evidenceDocument?: DocumentRecord;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
