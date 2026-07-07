CREATE TABLE IF NOT EXISTS conversation_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  project_id CHAR(36) NULL,
  document_id CHAR(36) NULL,
  name VARCHAR(255) NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_session_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

ALTER TABLE document_query_history
ADD COLUMN session_id CHAR(36) NULL;

ALTER TABLE document_query_history ADD INDEX idx_history_session (session_id);
