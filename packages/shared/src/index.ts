export type ProjectStatus = 'active' | 'archived' | 'closed';
export type DocumentStatus = 'draft' | 'pending_approval' | 'in_review' | 'approved' | 'published' | 'expired' | 'superseded' | 'archived';
export type ApprovalStatus = 'draft' | 'pending' | 'in_process' | 'approved' | 'rejected' | 'cancelled';
export type ContractStatus = 'draft' | 'active' | 'expired' | 'terminated' | 'renewed' | 'closed';
export type RfiStatus = 'open' | 'answered' | 'closed';

export const PermissionKey = {
  UsersRead: 'users.read',
  UsersManage: 'users.manage',
  RolesRead: 'roles.read',
  RolesManage: 'roles.manage',
  ProjectsView: 'projects.view',
  ProjectsManage: 'projects.manage',
  DocumentsCreate: 'documents.create',
  DocumentsView: 'documents.view',
  DocumentsEdit: 'documents.edit',
  DocumentsDownload: 'documents.download',
  DocumentsPrint: 'documents.print',
  DocumentsApprove: 'documents.approve',
  DocumentsDelete: 'documents.delete',
  RfisManage: 'rfis.manage',
  ApprovalsManage: 'approvals.manage',
  AuditView: 'audit.view',
  ContractsManage: 'contracts.manage',
  AiQuery: 'ai.query',
  ClmTemplates: 'clm.templates',
  ClmImport: 'clm.import',
  ClmExport: 'clm.export',
  ClmSign: 'clm.sign',
  ClmFinance: 'clm.finance',
  ClmReports: 'clm.reports',
} as const;

export type PermissionKey = (typeof PermissionKey)[keyof typeof PermissionKey];

export const PermissionCatalog: Array<{ key: PermissionKey; label: string; module: string }> = [
  { key: PermissionKey.UsersRead, label: 'Ver usuarios', module: 'users' },
  { key: PermissionKey.UsersManage, label: 'Administrar usuarios', module: 'users' },
  { key: PermissionKey.RolesRead, label: 'Ver roles', module: 'roles' },
  { key: PermissionKey.RolesManage, label: 'Administrar roles', module: 'roles' },
  { key: PermissionKey.ProjectsView, label: 'Ver proyecto', module: 'projects' },
  { key: PermissionKey.ProjectsManage, label: 'Administrar proyectos', module: 'projects' },
  { key: PermissionKey.DocumentsCreate, label: 'Crear documento', module: 'documents' },
  { key: PermissionKey.DocumentsView, label: 'Ver documento', module: 'documents' },
  { key: PermissionKey.DocumentsEdit, label: 'Editar documento', module: 'documents' },
  { key: PermissionKey.DocumentsDownload, label: 'Descargar documento', module: 'documents' },
  { key: PermissionKey.DocumentsPrint, label: 'Imprimir documento', module: 'documents' },
  { key: PermissionKey.DocumentsApprove, label: 'Aprobar documento', module: 'documents' },
  { key: PermissionKey.DocumentsDelete, label: 'Eliminar documento', module: 'documents' },
  { key: PermissionKey.RfisManage, label: 'Gestionar RFIs', module: 'rfis' },
  { key: PermissionKey.ApprovalsManage, label: 'Gestionar aprobaciones', module: 'approvals' },
  { key: PermissionKey.AuditView, label: 'Ver auditoria', module: 'audit' },
  { key: PermissionKey.ContractsManage, label: 'Administrar contratos', module: 'clm' },
  { key: PermissionKey.AiQuery, label: 'Consultar IA documental', module: 'ai-query' },
  { key: PermissionKey.ClmTemplates, label: 'Gestionar plantillas CLM', module: 'clm' },
  { key: PermissionKey.ClmImport, label: 'Importar contratos', module: 'clm' },
  { key: PermissionKey.ClmExport, label: 'Exportar contratos', module: 'clm' },
  { key: PermissionKey.ClmSign, label: 'Enviar a firma', module: 'clm' },
  { key: PermissionKey.ClmFinance, label: 'Ver finanzas CLM', module: 'clm' },
  { key: PermissionKey.ClmReports, label: 'Ver reportes CLM', module: 'clm' },
];

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

export interface RequestUser {
  id: string;
  email: string;
  name?: string;
  active?: boolean;
  roles: string[];
  permissions: string[];
}
