export type ProjectStatus = 'active' | 'archived' | 'closed';
export type DocumentStatus = 'draft' | 'in_review' | 'approved' | 'superseded' | 'archived';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ContractLifecycleStage = 'draft' | 'review' | 'negotiation' | 'active' | 'renewal' | 'expired';
export type PermissionKey =
  | 'users.read'
  | 'users.manage'
  | 'roles.read'
  | 'roles.manage'
  | 'projects.view'
  | 'projects.manage'
  | 'documents.create'
  | 'documents.view'
  | 'documents.edit'
  | 'documents.download'
  | 'documents.print'
  | 'documents.approve'
  | 'documents.delete'
  | 'audit.view'
  | 'contracts.manage'
  | 'ai.query';

export interface ProjectSummary {
  id: string;
  code: string;
  name: string;
  status: ProjectStatus;
}

export interface DocumentSummary {
  id: string;
  projectId: string;
  documentNumber: string;
  name: string;
  status: DocumentStatus;
  currentVersionId?: string;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}
