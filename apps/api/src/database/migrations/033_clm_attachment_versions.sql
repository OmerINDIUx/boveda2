ALTER TABLE contract_attachments
ADD COLUMN attachment_group_id CHAR(36) NULL AFTER name,
ADD COLUMN version_label VARCHAR(40) NOT NULL DEFAULT '1' AFTER attachment_group_id,
ADD COLUMN is_current TINYINT(1) NOT NULL DEFAULT 1 AFTER version_label;

UPDATE contract_attachments
SET
  attachment_group_id = id
WHERE
  attachment_group_id IS NULL;

ALTER TABLE contract_attachments
MODIFY COLUMN attachment_group_id CHAR(36) NOT NULL;

CREATE INDEX idx_contract_attachment_group ON contract_attachments (
  contract_id,
  attachment_group_id,
  is_current,
  created_at
);
