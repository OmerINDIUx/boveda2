ALTER TABLE contracts
ADD COLUMN lifecycle_stage VARCHAR(80) NOT NULL DEFAULT 'request' AFTER status;

ALTER TABLE contracts
ADD COLUMN lifecycle_changed_at DATETIME NULL AFTER lifecycle_stage;

UPDATE contracts
SET
  lifecycle_stage = CASE
    WHEN status = 'draft' THEN 'drafting'
    WHEN status = 'in_review' THEN 'internal_review'
    WHEN status = 'approved' THEN 'approval'
    WHEN status = 'active' THEN 'active'
    WHEN status = 'expiring_soon' THEN 'obligations_tracking'
    WHEN status = 'expired' THEN 'renewal_modification_termination'
    WHEN status = 'renewed' THEN 'renewal_modification_termination'
    WHEN status = 'closed' THEN 'archived'
    ELSE 'request'
  END,
  lifecycle_changed_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP);

CREATE TABLE contract_lifecycle_events (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  previous_stage VARCHAR(80) NULL,
  stage VARCHAR(80) NOT NULL,
  changed_by_id CHAR(36) NOT NULL,
  comments TEXT NULL,
  decision VARCHAR(120) NULL,
  related_document_id CHAR(36) NULL,
  related_version_id CHAR(36) NULL,
  time_in_previous_stage_minutes INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_lifecycle_events_contract (contract_id, created_at),
  INDEX idx_contract_lifecycle_events_stage (stage, created_at),
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (changed_by_id) REFERENCES users (id),
  FOREIGN KEY (related_document_id) REFERENCES documents (id),
  FOREIGN KEY (related_version_id) REFERENCES contract_versions (id)
);

INSERT INTO
  contract_lifecycle_events (
    id,
    contract_id,
    previous_stage,
    stage,
    changed_by_id,
    comments,
    decision,
    created_at
  )
SELECT
  UUID(),
  c.id,
  NULL,
  c.lifecycle_stage,
  COALESCE(c.created_by_id, c.responsible_user_id),
  'Evento inicial migrado',
  'migrated',
  COALESCE(c.created_at, CURRENT_TIMESTAMP)
FROM
  contracts c
WHERE
  COALESCE(c.created_by_id, c.responsible_user_id) IS NOT NULL;
