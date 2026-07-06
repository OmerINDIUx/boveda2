import { Discipline } from '../folders/discipline.entity';
import { Folder } from '../folders/folder.entity';
import { Project } from '../projects/project.entity';
import { User } from '../users/user.entity';
import { DocumentAuditLog } from './document-audit-log.entity';
import { DocumentComment } from './document-comment.entity';
import { DocumentMetadata } from './document-metadata.entity';
import { DocumentPermission } from './document-permission.entity';
export declare class DocumentRecord {
  id: string;
  projectId: string;
  project: Project;
  folderId?: string;
  folder?: Folder;
  disciplineId?: string;
  discipline?: Discipline;
  name: string;
  documentNumber: string;
  status:
    | 'draft'
    | 'pending_approval'
    | 'in_review'
    | 'approved'
    | 'published'
    | 'expired'
    | 'superseded'
    | 'archived';
  confidentialityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  responsibleUserId?: string;
  responsibleUser?: User;
  currentVersionId?: string;
  dueDate?: string;
  renewable: boolean;
  originalFileKey?: string;
  fileExtension?: string;
  sizeBytes?: number;
  uploadedById: string;
  uploadedBy: User;
  metadata: DocumentMetadata[];
  permissions: DocumentPermission[];
  auditLogs: DocumentAuditLog[];
  comments: DocumentComment[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}
