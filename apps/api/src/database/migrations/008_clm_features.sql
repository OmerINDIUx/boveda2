-- CLM v2: Tags, custom fields, amendments, payments, signatures, negotiations, templates, clauses, import logs
ALTER TABLE contracts
ADD COLUMN parent_contract_id CHAR(36) NULL AFTER close_reason;

ALTER TABLE contracts
ADD COLUMN alert_days_before INT NULL DEFAULT 30 AFTER renewal_notice_days;

ALTER TABLE contract_obligations
ADD COLUMN alert_days_before INT NULL DEFAULT 14 AFTER comments;

ALTER TABLE contract_milestones
ADD COLUMN alert_days_before INT NULL DEFAULT 7 AFTER notes;

CREATE TABLE tags (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  color VARCHAR(7) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE contract_tags (
  contract_id CHAR(36) NOT NULL,
  tag_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (contract_id, tag_id),
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (tag_id) REFERENCES tags (id)
);

CREATE TABLE contract_custom_fields (
  id CHAR(36) PRIMARY KEY,
  contract_type VARCHAR(100) NOT NULL,
  field_key VARCHAR(80) NOT NULL,
  field_label VARCHAR(180) NOT NULL,
  field_type VARCHAR(40) NOT NULL DEFAULT 'string',
  required TINYINT (1) NOT NULL DEFAULT 0,
  options_json JSON NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_custom_field_type_key (contract_type, field_key)
);

CREATE TABLE contract_custom_values (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  field_id CHAR(36) NOT NULL,
  value TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_custom_value_contract_field (contract_id, field_id),
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (field_id) REFERENCES contract_custom_fields (id)
);

CREATE TABLE contract_amendments (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  amendment_number VARCHAR(40) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NULL,
  amendment_date DATE NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'draft',
  file_key VARCHAR(255) NULL,
  file_name VARCHAR(255) NULL,
  created_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_amendment_number (contract_id, amendment_number),
  INDEX idx_amendments_contract (contract_id, created_at),
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (created_by_id) REFERENCES users (id)
);

CREATE TABLE contract_payments (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  concept VARCHAR(200) NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'MXN',
  payment_date DATE NULL,
  due_date DATE NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  invoice_number VARCHAR(80) NULL,
  invoice_file_key VARCHAR(255) NULL,
  notes TEXT NULL,
  created_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_payments_contract (contract_id, created_at),
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (created_by_id) REFERENCES users (id)
);

CREATE TABLE contract_signature_requests (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  version_id CHAR(36) NULL,
  provider VARCHAR(40) NOT NULL DEFAULT 'stub',
  provider_request_id VARCHAR(255) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  signers_json JSON NOT NULL,
  document_hash VARCHAR(128) NULL,
  signed_at DATETIME NULL,
  expires_at DATETIME NULL,
  created_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_signature_requests_contract (contract_id, created_at),
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (version_id) REFERENCES contract_versions (id),
  FOREIGN KEY (created_by_id) REFERENCES users (id)
);

CREATE TABLE contract_negotiations (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  version_id CHAR(36) NULL,
  party_name VARCHAR(160) NOT NULL,
  proposed_text TEXT NULL,
  original_text TEXT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'proposed',
  resolved_at DATETIME NULL,
  created_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_negotiations_contract (contract_id, created_at),
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (version_id) REFERENCES contract_versions (id),
  FOREIGN KEY (created_by_id) REFERENCES users (id)
);

CREATE TABLE contract_templates (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  description TEXT NULL,
  contract_type VARCHAR(100) NULL,
  is_active TINYINT (1) NOT NULL DEFAULT 1,
  created_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_templates_active (is_active),
  FOREIGN KEY (created_by_id) REFERENCES users (id)
);

CREATE TABLE contract_clauses (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  content LONGTEXT NOT NULL,
  category VARCHAR(80) NULL,
  is_active TINYINT (1) NOT NULL DEFAULT 1,
  created_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_clauses_category (category),
  FOREIGN KEY (created_by_id) REFERENCES users (id)
);

CREATE TABLE template_clauses (
  template_id CHAR(36) NOT NULL,
  clause_id CHAR(36) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (template_id, clause_id),
  FOREIGN KEY (template_id) REFERENCES contract_templates (id),
  FOREIGN KEY (clause_id) REFERENCES contract_clauses (id)
);

CREATE TABLE contract_import_logs (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  total_rows INT NOT NULL DEFAULT 0,
  success_rows INT NOT NULL DEFAULT 0,
  error_rows INT NOT NULL DEFAULT 0,
  errors_json JSON NULL,
  created_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_import_logs_project (project_id, created_at),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (created_by_id) REFERENCES users (id)
);

INSERT IGNORE INTO permissions (id, `key`, label, module)
VALUES
  (
    UUID (),
    'clm.templates',
    'Gestionar plantillas CLM',
    'clm'
  ),
  (
    UUID (),
    'clm.import',
    'Importar contratos',
    'clm'
  ),
  (
    UUID (),
    'clm.export',
    'Exportar contratos',
    'clm'
  ),
  (UUID (), 'clm.sign', 'Enviar a firma', 'clm'),
  (UUID (), 'clm.finance', 'Ver finanzas CLM', 'clm'),
  (UUID (), 'clm.reports', 'Ver reportes CLM', 'clm');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT
  r.id,
  p.id
FROM
  roles r
  JOIN permissions p ON p.`key` IN (
    'clm.templates',
    'clm.import',
    'clm.export',
    'clm.sign',
    'clm.finance',
    'clm.reports'
  )
WHERE
  r.`key` = 'admin';
