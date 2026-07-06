import { DocumentRecord } from '../documents/document.entity';
import { User } from '../users/user.entity';
import { Contract } from './contract.entity';
export declare class ContractObligation {
    id: string;
    contractId: string;
    contract: Contract;
    description: string;
    responsibleUserId?: string;
    responsibleUser?: User;
    commitmentDate?: string;
    status: 'pending' | 'in_progress' | 'completed' | 'waived' | 'overdue';
    evidenceDocumentId?: string;
    evidenceDocument?: DocumentRecord;
    comments?: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
}
