ALTER TABLE contract_text_index
ADD COLUMN chunk_index INT NULL AFTER page_number,
ADD COLUMN section_label VARCHAR(255) NULL AFTER chunk_index,
ADD COLUMN token_count INT NULL AFTER section_label,
ADD COLUMN embedding JSON NULL AFTER token_count,
ADD COLUMN ollama_embedding JSON NULL AFTER embedding,
ADD COLUMN embedding_model VARCHAR(120) NULL AFTER ollama_embedding;

CREATE INDEX idx_contract_text_version_chunk ON contract_text_index (contract_id, version_id, chunk_index);

CREATE TABLE contract_extraction_runs (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  version_id CHAR(36) NOT NULL,
  uploaded_by_id CHAR(36) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'queued',
  facts JSON NULL,
  error TEXT NULL,
  pipeline_version VARCHAR(40) NOT NULL DEFAULT 'contract-v1',
  model_name VARCHAR(120) NULL,
  content_hash VARCHAR(128) NULL,
  processed_at DATETIME NULL,
  approved_at DATETIME NULL,
  approved_by_id CHAR(36) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_contract_extraction_version (version_id),
  INDEX idx_contract_extraction_status (status),
  INDEX idx_contract_extraction_contract (contract_id),
  CONSTRAINT fk_contract_extraction_contract FOREIGN KEY (contract_id) REFERENCES contracts (id),
  CONSTRAINT fk_contract_extraction_version FOREIGN KEY (version_id) REFERENCES contract_versions (id),
  CONSTRAINT fk_contract_extraction_uploader FOREIGN KEY (uploaded_by_id) REFERENCES users (id),
  CONSTRAINT fk_contract_extraction_approver FOREIGN KEY (approved_by_id) REFERENCES users (id)
);
