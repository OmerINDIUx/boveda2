import { User } from '../users/user.entity';
import { Contract } from './contract.entity';
export declare class ContractComment {
    id: string;
    contractId: string;
    contract: Contract;
    authorId: string;
    author: User;
    body: string;
    createdAt: Date;
    deletedAt?: Date;
}
