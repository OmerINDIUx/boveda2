import { PermissionKey } from '@holocron/shared';
export { PermissionKey } from '@holocron/shared';

export const permissionCatalog = [
  { key: PermissionKey.ProjectsView, label: 'Ver proyecto', module: 'Proyectos' },
  { key: PermissionKey.ProjectsManage, label: 'Gestionar proyectos', module: 'Proyectos' },
  { key: PermissionKey.DocumentsCreate, label: 'Crear documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsView, label: 'Ver documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsEdit, label: 'Editar documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsDownload, label: 'Descargar documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsPrint, label: 'Imprimir documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsApprove, label: 'Aprobar documento', module: 'Documentos' },
  { key: PermissionKey.DocumentsDelete, label: 'Eliminar documento', module: 'Documentos' },
  { key: PermissionKey.RfisManage, label: 'Gestionar consultas', module: 'Consultas' },
  { key: PermissionKey.ApprovalsManage, label: 'Gestionar aprobaciones', module: 'Aprobaciones' },
  { key: PermissionKey.AuditView, label: 'Ver auditoria', module: 'Auditoria' },
  { key: PermissionKey.ContractsManage, label: 'Administrar contratos', module: 'Contratos' },
  { key: PermissionKey.AiQuery, label: 'Consultar IA documental', module: 'IA' },
  { key: PermissionKey.EmailsView, label: 'Ver correos', module: 'Correos' },
  { key: PermissionKey.EmailsManage, label: 'Administrar correos', module: 'Correos' },
  {
    key: PermissionKey.NomenclaturesManage,
    label: 'Administrar nomenclaturas',
    module: 'Nomenclaturas',
  },
  { key: PermissionKey.BulkUpload, label: 'Carga masiva', module: 'Archivos' },
  { key: PermissionKey.SlaManage, label: 'Administrar SLAs', module: 'SLAs' },
  { key: PermissionKey.LanguageEdit, label: 'Cambiar idioma', module: 'Usuarios' },
];
