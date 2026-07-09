CREATE TABLE project_email_addresses (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  email_address VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(160) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pea_project (project_id, is_active),
  INDEX idx_pea_address (email_address),
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE TABLE project_email_threads (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  subject_clean VARCHAR(500) NOT NULL,
  last_email_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  email_count INT NOT NULL DEFAULT 0,
  is_archived TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pet_project (project_id, is_archived, last_email_at),
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE TABLE project_emails (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  thread_id CHAR(36) NULL,
  email_address_id CHAR(36) NULL,
  from_address VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) NULL,
  to_address TEXT NOT NULL,
  cc TEXT NULL,
  subject VARCHAR(500) NOT NULL,
  body_text LONGTEXT NULL,
  body_html LONGTEXT NULL,
  message_id VARCHAR(255) NULL UNIQUE,
  in_reply_to VARCHAR(255) NULL,
  references_header TEXT NULL,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  is_internal TINYINT(1) NOT NULL DEFAULT 1,
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pe_project (project_id, received_at),
  INDEX idx_pe_thread (thread_id),
  INDEX idx_pe_message_id (message_id),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (thread_id) REFERENCES project_email_threads (id),
  FOREIGN KEY (email_address_id) REFERENCES project_email_addresses (id)
);

CREATE TABLE project_email_attachments (
  id CHAR(36) PRIMARY KEY,
  email_id CHAR(36) NOT NULL,
  file_key VARCHAR(500) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(120) NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pea_email (email_id),
  FOREIGN KEY (email_id) REFERENCES project_emails (id)
);
