'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.PermissionCatalog = exports.PermissionKey = void 0;
exports.PermissionKey = {
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
};
exports.PermissionCatalog = [
  { key: exports.PermissionKey.UsersRead, label: 'Ver usuarios', module: 'users' },
  { key: exports.PermissionKey.UsersManage, label: 'Administrar usuarios', module: 'users' },
  { key: exports.PermissionKey.RolesRead, label: 'Ver roles', module: 'roles' },
  { key: exports.PermissionKey.RolesManage, label: 'Administrar roles', module: 'roles' },
  { key: exports.PermissionKey.ProjectsView, label: 'Ver proyecto', module: 'projects' },
  { key: exports.PermissionKey.ProjectsManage, label: 'Administrar proyectos', module: 'projects' },
  { key: exports.PermissionKey.DocumentsCreate, label: 'Crear documento', module: 'documents' },
  { key: exports.PermissionKey.DocumentsView, label: 'Ver documento', module: 'documents' },
  { key: exports.PermissionKey.DocumentsEdit, label: 'Editar documento', module: 'documents' },
  {
    key: exports.PermissionKey.DocumentsDownload,
    label: 'Descargar documento',
    module: 'documents',
  },
  { key: exports.PermissionKey.DocumentsPrint, label: 'Imprimir documento', module: 'documents' },
  { key: exports.PermissionKey.DocumentsApprove, label: 'Aprobar documento', module: 'documents' },
  { key: exports.PermissionKey.DocumentsDelete, label: 'Eliminar documento', module: 'documents' },
  { key: exports.PermissionKey.RfisManage, label: 'Gestionar RFIs', module: 'rfis' },
  {
    key: exports.PermissionKey.ApprovalsManage,
    label: 'Gestionar aprobaciones',
    module: 'approvals',
  },
  { key: exports.PermissionKey.AuditView, label: 'Ver auditoria', module: 'audit' },
  { key: exports.PermissionKey.ContractsManage, label: 'Administrar contratos', module: 'clm' },
  { key: exports.PermissionKey.AiQuery, label: 'Consultar IA documental', module: 'ai-query' },
];
//# sourceMappingURL=permissions.js.map
