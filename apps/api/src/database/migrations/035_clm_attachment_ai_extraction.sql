ALTER TABLE contract_extraction_runs
MODIFY COLUMN version_id CHAR(36) NULL,
ADD COLUMN attachment_id CHAR(36) NULL AFTER version_id,
ADD UNIQUE KEY uq_contract_extraction_attachment (attachment_id),
ADD INDEX idx_contract_extraction_attachment (contract_id, attachment_id),
ADD CONSTRAINT fk_contract_extraction_attachment FOREIGN KEY (attachment_id) REFERENCES contract_attachments (id);
