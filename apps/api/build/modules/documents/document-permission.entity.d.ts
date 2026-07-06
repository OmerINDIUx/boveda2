import { DocumentRecord } from './document.entity';
export declare class DocumentPermission {
  id: string;
  documentId: string;
  document: DocumentRecord;
  userId?: string;
  roleId?: string;
  projectUserId?: string;
  permission: 'view' | 'download' | 'edit' | 'approve' | 'owner';
  grantedById?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
