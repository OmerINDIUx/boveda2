export declare class CreateContractDto {
  projectId: string;
  name: string;
  supplierName?: string;
  clientName?: string;
  responsibleArea?: string;
  contractType?: string;
  status?:
    | 'draft'
    | 'in_review'
    | 'approved'
    | 'active'
    | 'expiring_soon'
    | 'expired'
    | 'renewed'
    | 'closed';
  startDate?: string;
  endDate?: string;
  renewalDate?: string;
  amount?: string;
  currency?: string;
  responsibleUserId?: string;
  mainDocumentId?: string;
  renewalNoticeDays?: string | number;
  closeReason?: string;
}
