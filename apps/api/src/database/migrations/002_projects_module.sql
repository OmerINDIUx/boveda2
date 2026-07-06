ALTER TABLE projects
  ADD INDEX idx_projects_active_status (is_active, status, deleted_at);
