export declare class CreateContractMilestoneDto {
  name: string;
  milestoneDate: string;
  responsibleUserId?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
  evidenceDocumentId?: string;
  notes?: string;
}
