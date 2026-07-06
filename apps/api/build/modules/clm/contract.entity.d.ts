import { DocumentRecord } from '../documents/document.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { ContractAttachment } from './contract-attachment.entity';
import { ContractAuditLog } from './contract-audit-log.entity';
import { ContractComment } from './contract-comment.entity';
import { ContractMilestone } from './contract-milestone.entity';
import { ContractObligation } from './contract-obligation.entity';
import { ContractVersion } from './contract-version.entity';
export declare class Contract {
  id: string;
  projectId: string;
  project: Project;
  name: string;
  supplierName?: string;
  clientName?: string;
  responsibleArea?: string;
  contractType?: string;
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  amount?: string;
  currency: string;
  status:
    | 'draft'
    | 'in_review'
    | 'approved'
    | 'active'
    | 'expiring_soon'
    | 'expired'
    | 'renewed'
    | 'closed';
  responsibleUserId?: string;
  responsibleUser?: User;
  mainDocumentId?: string;
  mainDocument?: DocumentRecord;
  currentVersionId?: string;
  renewable: boolean;
  renewalNoticeDays?: number;
  closedAt?: Date;
  closeReason?: string;
  createdById?: string;
  createdBy?: User;
  versions: ContractVersion[];
  obligations: ContractObligation[];
  milestones: ContractMilestone[];
  attachments: ContractAttachment[];
  comments: ContractComment[];
  auditLogs: ContractAuditLog[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
