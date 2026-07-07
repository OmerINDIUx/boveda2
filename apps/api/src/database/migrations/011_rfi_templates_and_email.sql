CREATE TABLE rfi_templates (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NULL,
  project_id CHAR(36) NULL,
  title_template VARCHAR(180) NOT NULL,
  description_template TEXT NOT NULL,
  default_priority VARCHAR(30) NOT NULL DEFAULT 'normal',
  default_due_days INT NULL,
  auto_assign_rule JSON NULL,
  is_active TINYINT (1) NOT NULL DEFAULT 1,
  created_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_rfi_templates_active (is_active, deleted_at),
  INDEX idx_rfi_templates_project (project_id, deleted_at),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (created_by_id) REFERENCES users (id)
);

ALTER TABLE rfis
ADD COLUMN template_id CHAR(36) NULL AFTER priority,
ADD COLUMN reply_to_address VARCHAR(255) NULL AFTER template_id,
ADD INDEX idx_rfis_template (template_id),
ADD FOREIGN KEY (template_id) REFERENCES rfi_templates (id);

ALTER TABLE rfi_comments
ADD COLUMN email_message_id VARCHAR(255) NULL AFTER comment_type,
ADD COLUMN email_in_reply_to VARCHAR(255) NULL AFTER email_message_id,
ADD INDEX idx_rfi_comments_email (email_message_id);
