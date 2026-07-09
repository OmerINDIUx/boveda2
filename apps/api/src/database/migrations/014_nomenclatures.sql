CREATE TABLE nomenclature_rules (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  pattern VARCHAR(500) NOT NULL,
  segments JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_nr_project (project_id, is_active, deleted_at),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (created_by_id) REFERENCES users (id)
);

CREATE TABLE nomenclature_counters (
  id CHAR(36) PRIMARY KEY,
  rule_id CHAR(36) NOT NULL,
  project_id CHAR(36) NOT NULL,
  year INT NOT NULL,
  current_number INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_nc_rule_year (rule_id, year),
  FOREIGN KEY (rule_id) REFERENCES nomenclature_rules (id),
  FOREIGN KEY (project_id) REFERENCES projects (id)
);
