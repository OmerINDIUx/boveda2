export declare class CreateDocumentDto {
  projectId: string;
  name?: string;
  title?: string;
  documentNumber: string;
  folderId?: string;
  disciplineId?: string;
  responsibleUserId?: string;
  confidentialityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  renewable?: boolean;
  dueDate?: string;
  status?: 'draft' | 'pending_approval' | 'in_review' | 'approved' | 'published' | 'expired';
  fileName: string;
  mimeType: string;
  base64Content: string;
  revision?: string;
  notes?: string;
  sizeBytes?: number;
  metadata?: Array<{
    key: string;
    value: string;
    type?: 'string' | 'number' | 'date' | 'boolean' | 'json';
  }>;
}
