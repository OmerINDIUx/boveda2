CREATE TABLE sla_definitions (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  scope VARCHAR(40) NOT NULL,
  target_hours DECIMAL(10, 2) NOT NULL,
  warning_hours DECIMAL(10, 2) NULL,
  escalation_user_id CHAR(36) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sd_project (project_id, is_active),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (escalation_user_id) REFERENCES users (id)
);

CREATE TABLE response_time_records (
  id CHAR(36) PRIMARY KEY,
  email_id CHAR(36) NOT NULL,
  sla_id CHAR(36) NOT NULL,
  started_at DATETIME NOT NULL,
  target_deadline DATETIME NOT NULL,
  responded_at DATETIME NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'within_sla',
  breach_notified TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_rtr_email (email_id),
  INDEX idx_rtr_sla (sla_id),
  FOREIGN KEY (email_id) REFERENCES project_emails (id),
  FOREIGN KEY (sla_id) REFERENCES sla_definitions (id)
);

CREATE TABLE email_workflow_actions (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  trigger_event VARCHAR(40) NOT NULL,
  action_type VARCHAR(40) NOT NULL,
  config JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ewa_project (project_id, is_active),
  FOREIGN KEY (project_id) REFERENCES projects (id)
);
