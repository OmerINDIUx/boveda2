export declare class CreateContractObligationDto {
  description: string;
  responsibleUserId?: string;
  commitmentDate?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'waived' | 'overdue';
  evidenceDocumentId?: string;
  comments?: string;
}
