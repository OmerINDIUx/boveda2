ALTER TABLE contract_text_index
ADD COLUMN attachment_id CHAR(36) NULL AFTER version_id,
ADD CONSTRAINT fk_contract_text_attachment FOREIGN KEY (attachment_id) REFERENCES contract_attachments (id);

CREATE INDEX idx_contract_text_attachment_chunk ON contract_text_index (contract_id, attachment_id, chunk_index);
