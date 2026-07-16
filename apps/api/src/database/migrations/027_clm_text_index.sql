CREATE TABLE contract_text_index (
  id CHAR(36) PRIMARY KEY,
  contract_id CHAR(36) NOT NULL,
  version_id CHAR(36) NULL,
  content LONGTEXT NOT NULL,
  content_hash VARCHAR(64) NULL,
  page_number INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_contract_text_index_contract (contract_id),
  FULLTEXT INDEX ft_contract_text_content (content),
  FOREIGN KEY (contract_id) REFERENCES contracts (id),
  FOREIGN KEY (version_id) REFERENCES contract_versions (id)
);

ALTER TABLE contract_templates
ADD COLUMN content LONGTEXT NULL AFTER contract_type,
ADD COLUMN version VARCHAR(20) NOT NULL DEFAULT '1.0' AFTER content,
ADD COLUMN versionNumber INT NOT NULL DEFAULT 1 AFTER version,
ADD COLUMN parentTemplateId CHAR(36) NULL AFTER versionNumber,
ADD COLUMN approvedAt DATETIME NULL AFTER parentTemplateId,
ADD COLUMN approvedById CHAR(36) NULL AFTER approvedAt;

ALTER TABLE contract_clauses
ADD COLUMN clauseType VARCHAR(40) NOT NULL DEFAULT 'standard' AFTER content,
ADD COLUMN riskLevel VARCHAR(20) NULL AFTER clauseType,
ADD COLUMN language VARCHAR(10) NULL DEFAULT 'es' AFTER riskLevel,
ADD COLUMN applicableContractType VARCHAR(100) NULL AFTER language,
ADD COLUMN jurisdiction VARCHAR(100) NULL AFTER applicableContractType,
ADD COLUMN alternativeText LONGTEXT NULL AFTER jurisdiction,
ADD COLUMN approvedAt DATETIME NULL AFTER alternativeText,
ADD COLUMN expirationDate DATE NULL AFTER approvedAt;
