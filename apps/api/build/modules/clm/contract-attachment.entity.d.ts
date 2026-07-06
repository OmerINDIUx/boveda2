import { User } from '../users/user.entity';
import { Contract } from './contract.entity';
export declare class ContractAttachment {
  id: string;
  contractId: string;
  contract: Contract;
  name: string;
  fileKey: string;
  fileName: string;
  fileExtension?: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  uploadedBy: User;
  notes?: string;
  createdAt: Date;
  deletedAt?: Date;
}
