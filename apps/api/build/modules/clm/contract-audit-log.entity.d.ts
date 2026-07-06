import { Contract } from './contract.entity';
export declare class ContractAuditLog {
    id: string;
    contractId: string;
    contract: Contract;
    actorId?: string;
    action: string;
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
    createdAt: Date;
}
