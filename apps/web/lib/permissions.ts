import { PermissionKey } from '@holocron/shared';
export { PermissionKey } from '@holocron/shared';

export const permissionCatalog = [
  { key: PermissionKey.ProjectsView, label: 'Ver proyecto', module: 'Proyectos' },
  { key: PermissionKey.DocumentsCreate, label: 'Crear documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsView, label: 'Ver documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsEdit, label: 'Editar documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsDownload, label: 'Descargar documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsPrint, label: 'Imprimir documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsApprove, label: 'Aprobar documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsDelete, label: 'Eliminar documento', module: 'Documentos' },
  { key: PermissionKey.RfisManage, label: 'Gestionar RFIs', module: 'RFIs' },
  { key: PermissionKey.ApprovalsManage, label: 'Gestionar aprobaciones', module: 'Aprobaciones' },
  { key: PermissionKey.AuditView, label: 'Ver auditoria', module: 'Auditoria' },
  { key: PermissionKey.ContractsManage, label: 'Administrar contratos', module: 'CLM' },
  { key: PermissionKey.AiQuery, label: 'Consultar IA documental', module: 'IA' },
];
