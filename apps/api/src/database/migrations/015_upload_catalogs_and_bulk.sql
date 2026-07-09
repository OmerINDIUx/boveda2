CREATE TABLE upload_catalogs (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NULL,
  category VARCHAR(80) NOT NULL,
  catalog_key VARCHAR(80) NOT NULL,
  label VARCHAR(160) NOT NULL,
  description TEXT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_uc_project (project_id, category, is_active),
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE TABLE bulk_uploads (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  total_files INT NOT NULL DEFAULT 0,
  processed_files INT NOT NULL DEFAULT 0,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  INDEX idx_bu_project (project_id, status),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE bulk_upload_items (
  id CHAR(36) PRIMARY KEY,
  bulk_upload_id CHAR(36) NOT NULL,
  file_key VARCHAR(500) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  error_message TEXT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_bui_upload (bulk_upload_id),
  FOREIGN KEY (bulk_upload_id) REFERENCES bulk_uploads (id)
);
