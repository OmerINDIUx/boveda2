CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  last_login_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_users_active_deleted (active, deleted_at)
);

CREATE TABLE roles (
  id CHAR(36) PRIMARY KEY,
  `key` VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
);

CREATE TABLE permissions (
  id CHAR(36) PRIMARY KEY,
  `key` VARCHAR(120) NOT NULL UNIQUE,
  label VARCHAR(180) NOT NULL,
  module VARCHAR(80) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE role_user (
  role_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, user_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE role_permissions (
  role_id CHAR(36) NOT NULL,
  permission_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (permission_id) REFERENCES permissions(id)
);

CREATE TABLE projects (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  code VARCHAR(40) NOT NULL UNIQUE,
  description TEXT NULL,
  work_type VARCHAR(120) NULL,
  current_stage VARCHAR(120) NULL,
  priority VARCHAR(30) NOT NULL DEFAULT 'media',
  responsible_user_id CHAR(36) NULL,
  target_date DATE NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'planificacion',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  discipline_ids JSON NULL,
  owner_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_projects_status_deleted (status, deleted_at),
  FOREIGN KEY (responsible_user_id) REFERENCES users(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE project_users (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'viewer',
  can_manage_documents TINYINT(1) NOT NULL DEFAULT 0,
  can_manage_contracts TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_project_users_project_user (project_id, user_id),
  INDEX idx_project_users_user (user_id, deleted_at),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE disciplines (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
);

CREATE TABLE folders (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  parent_id CHAR(36) NULL,
  discipline_id CHAR(36) NULL,
  name VARCHAR(140) NOT NULL,
  path VARCHAR(600) NULL,
  created_by_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_folders_project_parent (project_id, parent_id, deleted_at),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (parent_id) REFERENCES folders(id),
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE documents (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(220) NOT NULL,
  document_number VARCHAR(80) NOT NULL,
  project_id CHAR(36) NOT NULL,
  folder_id CHAR(36) NULL,
  discipline_id CHAR(36) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  confidentiality_level VARCHAR(40) NOT NULL DEFAULT 'internal',
  responsible_user_id CHAR(36) NULL,
  current_version_id CHAR(36) NULL,
  due_date DATE NULL,
  renewable TINYINT(1) NOT NULL DEFAULT 0,
  original_file_key VARCHAR(255) NULL,
  file_extension VARCHAR(30) NULL,
  size_bytes BIGINT NULL,
  uploaded_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_documents_project_number (project_id, document_number),
  INDEX idx_documents_scope (project_id, folder_id, discipline_id, deleted_at),
  INDEX idx_documents_status_due (status, due_date),
  INDEX idx_documents_responsible (responsible_user_id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (folder_id) REFERENCES folders(id),
  FOREIGN KEY (discipline_id) REFERENCES disciplines(id),
  FOREIGN KEY (responsible_user_id) REFERENCES users(id),
  FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
);

CREATE TABLE document_versions (
  id CHAR(36) PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  revision VARCHAR(40) NOT NULL,
  file_key VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_extension VARCHAR(30) NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum VARCHAR(128) NULL,
  uploaded_by_id CHAR(36) NOT NULL,
  notes TEXT NULL,
  content_hash VARCHAR(128) NULL,
  content_extraction_status VARCHAR(40) NOT NULL DEFAULT 'pending',
  content_extraction_error TEXT NULL,
  content_extracted_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_document_versions_revision (document_id, revision),
  INDEX idx_document_versions_document (document_id, created_at),
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
);

ALTER TABLE documents
  ADD CONSTRAINT fk_documents_current_version FOREIGN KEY (current_version_id) REFERENCES document_versions(id);

CREATE TABLE document_metadata (
  id CHAR(36) PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  meta_key VARCHAR(120) NOT NULL,
  meta_value TEXT NULL,
  value_type VARCHAR(40) NOT NULL DEFAULT 'string',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_document_metadata_key (document_id, meta_key),
  INDEX idx_document_metadata_key (meta_key),
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE document_permissions (
  id CHAR(36) PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  role_id CHAR(36) NULL,
  project_user_id CHAR(36) NULL,
  permission VARCHAR(40) NOT NULL,
  granted_by_id CHAR(36) NULL,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_document_permissions_document (document_id, deleted_at),
  INDEX idx_document_permissions_user (user_id, permission),
  INDEX idx_document_permissions_role (role_id, permission),
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (project_user_id) REFERENCES project_users(id),
  FOREIGN KEY (granted_by_id) REFERENCES users(id)
);

CREATE TABLE document_audit_logs (
  id CHAR(36) PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  actor_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  before_state JSON NULL,
  after_state JSON NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_document_audit_document (document_id, created_at),
  INDEX idx_document_audit_actor (actor_id, created_at),
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE document_comments (
  id CHAR(36) PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  author_id CHAR(36) NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_document_comments_document (document_id, created_at),
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  actor_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id CHAR(36) NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_actor (actor_id, created_at),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE approval_workflows (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  scope_type VARCHAR(40) NOT NULL DEFAULT 'global',
  target_document_id CHAR(36) NULL,
  require_for_publication TINYINT(1) NOT NULL DEFAULT 1,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_by_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_approval_workflows_project_entity (project_id, entity_type, active),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (target_document_id) REFERENCES documents(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE approval_steps (
  id CHAR(36) PRIMARY KEY,
  workflow_id CHAR(36) NOT NULL,
  step_order INT NOT NULL,
  name VARCHAR(140) NOT NULL,
  approver_role_id CHAR(36) NULL,
  approver_user_id CHAR(36) NULL,
  required TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_approval_steps_order (workflow_id, step_order),
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id),
  FOREIGN KEY (approver_role_id) REFERENCES roles(id),
  FOREIGN KEY (approver_user_id) REFERENCES users(id)
);

CREATE TABLE approval_requests (
  id CHAR(36) PRIMARY KEY,
  workflow_id CHAR(36) NOT NULL,
  current_step_id CHAR(36) NULL,
  requester_id CHAR(36) NOT NULL,
  project_id CHAR(36) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id CHAR(36) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_action_at DATETIME NULL,
  completed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_approval_requests_entity (entity_type, entity_id),
  INDEX idx_approval_requests_status (status, requested_at),
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id),
  FOREIGN KEY (current_step_id) REFERENCES approval_steps(id),
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE approval_request_actions (
  id CHAR(36) PRIMARY KEY,
  request_id CHAR(36) NOT NULL,
  step_id CHAR(36) NULL,
  actor_id CHAR(36) NOT NULL,
  action VARCHAR(60) NOT NULL,
  comment TEXT NULL,
  step_order INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_approval_request_actions_request (request_id, created_at),
  FOREIGN KEY (request_id) REFERENCES approval_requests(id),
  FOREIGN KEY (step_id) REFERENCES approval_steps(id),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE rfis (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  document_id CHAR(36) NULL,
  subject VARCHAR(180) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'open',
  priority VARCHAR(30) NOT NULL DEFAULT 'normal',
  due_date DATE NULL,
  created_by_id CHAR(36) NOT NULL,
  assigned_to_id CHAR(36) NULL,
  closed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_rfis_project_status (project_id, status, deleted_at),
  INDEX idx_rfis_due (due_date, status),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id),
  FOREIGN KEY (assigned_to_id) REFERENCES users(id)
);

CREATE TABLE rfi_comments (
  id CHAR(36) PRIMARY KEY,
  rfi_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  comment TEXT NOT NULL,
  comment_type VARCHAR(40) NOT NULL DEFAULT 'comment',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_rfi_comments_rfi (rfi_id, created_at),
  FOREIGN KEY (rfi_id) REFERENCES rfis(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE rfi_attachments (
  id CHAR(36) PRIMARY KEY,
  rfi_id CHAR(36) NOT NULL,
  comment_id CHAR(36) NULL,
  file_key VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_rfi_attachments_rfi (rfi_id, created_at),
  FOREIGN KEY (rfi_id) REFERENCES rfis(id),
  FOREIGN KEY (comment_id) REFERENCES rfi_comments(id),
  FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
);

CREATE TABLE rfi_history (
  id CHAR(36) PRIMARY KEY,
  rfi_id CHAR(36) NOT NULL,
  actor_id CHAR(36) NULL,
  action VARCHAR(80) NOT NULL,
  before_state JSON NULL,
  after_state JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rfi_history_rfi (rfi_id, created_at),
  FOREIGN KEY (rfi_id) REFERENCES rfis(id),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(60) NOT NULL DEFAULT 'system',
  notification_type VARCHAR(80) NOT NULL DEFAULT 'system',
  entity_type VARCHAR(80) NULL,
  entity_id CHAR(36) NULL,
  meta_json TEXT NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_notifications_user_read (user_id, read_at, created_at),
  INDEX idx_notifications_type (user_id, notification_type, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notification_preferences (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  notification_type VARCHAR(80) NOT NULL,
  in_app_enabled TINYINT(1) NOT NULL DEFAULT 1,
  email_enabled TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_notification_preferences_user_type (user_id, notification_type),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE notification_deliveries (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  notification_type VARCHAR(80) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'sent',
  subject VARCHAR(200) NULL,
  entity_type VARCHAR(80) NULL,
  entity_id CHAR(36) NULL,
  dedupe_key VARCHAR(190) NULL,
  error_message TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notification_deliveries_user (user_id, created_at),
  UNIQUE KEY uq_notification_deliveries_dedupe (user_id, channel, dedupe_key),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE document_chunks (
  id CHAR(36) PRIMARY KEY,
  document_id CHAR(36) NOT NULL,
  version_id CHAR(36) NULL,
  chunk_index INT NOT NULL,
  content LONGTEXT NOT NULL,
  token_count INT NULL,
  page_number INT NULL,
  section_label VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_document_chunks_index (document_id, version_id, chunk_index),
  FULLTEXT KEY ft_document_chunks_content (content),
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (version_id) REFERENCES document_versions(id)
);

CREATE TABLE document_embeddings (
  id CHAR(36) PRIMARY KEY,
  chunk_id CHAR(36) NOT NULL,
  provider VARCHAR(80) NOT NULL,
  model VARCHAR(120) NOT NULL,
  dimensions INT NOT NULL,
  embedding JSON NOT NULL,
  content_hash VARCHAR(128) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_document_embeddings_chunk_model (chunk_id, provider, model),
  INDEX idx_document_embeddings_hash (content_hash),
  FOREIGN KEY (chunk_id) REFERENCES document_chunks(id)
);

CREATE TABLE contracts (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(180) NOT NULL,
  supplier_name VARCHAR(180) NULL,
  client_name VARCHAR(180) NULL,
  responsible_area VARCHAR(160) NULL,
  contract_type VARCHAR(100) NULL,
  start_date DATE NULL,
  end_date DATE NULL,
  renewal_date DATE NULL,
  amount DECIMAL(18, 2) NULL,
  currency CHAR(3) NOT NULL DEFAULT 'MXN',
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  responsible_user_id CHAR(36) NULL,
  main_document_id CHAR(36) NULL,
  current_version_id CHAR(36) NULL,
  renewable TINYINT(1) NOT NULL DEFAULT 0,
  renewal_notice_days INT NULL,
  closed_at DATETIME NULL,
  close_reason TEXT NULL,
  created_by_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_contracts_project_status (project_id, status, deleted_at),
  INDEX idx_contracts_expiration (end_date, status),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (responsible_user_id) REFERENCES users(id),
  FOREIGN KEY (main_document_id) REFERENCES documents(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE contract_versions (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  version_label VARCHAR(40) NOT NULL,
  file_key VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_extension VARCHAR(30) NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_by_id CHAR(36) NOT NULL,
  change_summary TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_contract_versions_label (contract_id, version_label),
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
);

ALTER TABLE contracts
  ADD CONSTRAINT fk_contracts_current_version FOREIGN KEY (current_version_id) REFERENCES contract_versions(id);

CREATE TABLE contract_obligations (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  description TEXT NOT NULL,
  responsible_user_id CHAR(36) NULL,
  commitment_date DATE NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  evidence_document_id CHAR(36) NULL,
  comments TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_contract_obligations_contract_status (contract_id, status),
  INDEX idx_contract_obligations_due (commitment_date, status),
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (responsible_user_id) REFERENCES users(id),
  FOREIGN KEY (evidence_document_id) REFERENCES documents(id)
);

CREATE TABLE contract_milestones (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  name VARCHAR(180) NOT NULL,
  milestone_date DATE NOT NULL,
  responsible_user_id CHAR(36) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  completed_at DATETIME NULL,
  evidence_document_id CHAR(36) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_contract_milestones_contract_due (contract_id, milestone_date),
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (responsible_user_id) REFERENCES users(id),
  FOREIGN KEY (evidence_document_id) REFERENCES documents(id)
);

CREATE TABLE contract_attachments (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  name VARCHAR(180) NOT NULL,
  file_key VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_extension VARCHAR(30) NULL,
  mime_type VARCHAR(120) NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploaded_by_id CHAR(36) NOT NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_contract_attachments_contract (contract_id, created_at),
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (uploaded_by_id) REFERENCES users(id)
);

CREATE TABLE contract_comments (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  author_id CHAR(36) NOT NULL,
  body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_contract_comments_contract (contract_id, created_at),
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE document_query_history (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  project_id CHAR(36) NULL,
  document_id CHAR(36) NULL,
  question TEXT NOT NULL,
  answer LONGTEXT NOT NULL,
  status VARCHAR(40) NOT NULL,
  citations_json JSON NULL,
  response_json JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_document_query_history_user (user_id, created_at),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE TABLE contract_audit_logs (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  actor_id CHAR(36) NULL,
  action VARCHAR(100) NOT NULL,
  before_state JSON NULL,
  after_state JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_audit_contract (contract_id, created_at),
  FOREIGN KEY (contract_id) REFERENCES contracts(id),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

INSERT INTO permissions (id, `key`, label, module) VALUES
(UUID(), 'users.read', 'Ver usuarios', 'users'),
(UUID(), 'users.manage', 'Gestionar usuarios', 'users'),
(UUID(), 'roles.read', 'Ver roles y permisos', 'roles'),
(UUID(), 'roles.manage', 'Administrar roles', 'roles'),
(UUID(), 'projects.view', 'Ver proyecto', 'projects'),
(UUID(), 'projects.manage', 'Gestionar proyectos', 'projects'),
(UUID(), 'documents.create', 'Crear documento', 'documents'),
(UUID(), 'documents.view', 'Ver documento', 'documents'),
(UUID(), 'documents.edit', 'Editar documento', 'documents'),
(UUID(), 'documents.download', 'Descargar documento', 'documents'),
(UUID(), 'documents.print', 'Imprimir documento', 'documents'),
(UUID(), 'documents.approve', 'Aprobar documento', 'documents'),
(UUID(), 'documents.delete', 'Eliminar documento', 'documents'),
(UUID(), 'audit.view', 'Ver auditoria', 'audit'),
(UUID(), 'rfis.manage', 'Gestionar RFIs', 'rfis'),
(UUID(), 'approvals.manage', 'Gestionar aprobaciones', 'approvals'),
(UUID(), 'ai.query', 'Consultar documentos con IA', 'ai-query'),
(UUID(), 'contracts.manage', 'Administrar contratos', 'clm');

INSERT INTO roles (id, `key`, name, description) VALUES
(UUID(), 'admin', 'Administrador', 'Acceso total a la plataforma'),
(UUID(), 'project_manager', 'Gerente de proyecto', 'Gestion operativa por proyecto'),
(UUID(), 'viewer', 'Consulta', 'Lectura de proyectos y documentos asignados');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p
WHERE r.`key` = 'admin';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.`key` IN (
  'projects.view',
  'projects.manage',
  'documents.create',
  'documents.view',
  'documents.edit',
  'documents.download',
  'documents.print',
  'documents.approve',
  'rfis.manage',
  'approvals.manage',
  'ai.query',
  'contracts.manage'
)
WHERE r.`key` = 'project_manager';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.`key` IN ('projects.view', 'documents.view', 'documents.download', 'ai.query')
WHERE r.`key` = 'viewer';
