import { User } from '../users/user.entity';
import { Contract } from './contract.entity';
export declare class ContractVersion {
  id: string;
  contractId: string;
  contract: Contract;
  versionLabel: string;
  fileKey: string;
  fileName: string;
  fileExtension?: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
  uploadedBy: User;
  changeSummary?: string;
  createdAt: Date;
  deletedAt?: Date;
}
