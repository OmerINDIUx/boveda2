export declare class UpdateDocumentDto {
  name?: string;
  folderId?: string;
  disciplineId?: string;
  responsibleUserId?: string;
  confidentialityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  renewable?: boolean;
  dueDate?: string;
  status?:
    'draft' | 'pending_approval' | 'in_review' | 'approved' | 'published' | 'expired' | 'archived';
}
