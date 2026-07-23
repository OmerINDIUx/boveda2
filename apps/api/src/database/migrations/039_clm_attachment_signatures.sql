ALTER TABLE contract_signature_requests
ADD COLUMN attachment_id CHAR(36) NULL AFTER version_id,
ADD INDEX idx_contract_signature_attachment (contract_id, attachment_id),
ADD CONSTRAINT fk_contract_signature_attachment FOREIGN KEY (attachment_id) REFERENCES contract_attachments (id);
