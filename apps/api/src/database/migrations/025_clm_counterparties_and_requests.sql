ALTER TABLE contracts
ADD COLUMN riskLevel VARCHAR(20) NULL AFTER created_by_id;

ALTER TABLE contracts
ADD COLUMN counterpartyRfc VARCHAR(20) NULL AFTER riskLevel;

ALTER TABLE contracts
ADD COLUMN supplierCounterpartyId CHAR(36) NULL AFTER counterpartyRfc;

ALTER TABLE contracts
ADD COLUMN clientCounterpartyId CHAR(36) NULL AFTER supplierCounterpartyId;

CREATE TABLE counterparties (
  id CHAR(36) PRIMARY KEY,
  businessName VARCHAR(255) NOT NULL,
  commercialName VARCHAR(255) NULL,
  rfc VARCHAR(20) NOT NULL UNIQUE,
  taxAddress VARCHAR(255) NULL,
  country VARCHAR(100) NULL,
  counterpartyType VARCHAR(50) NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  riskLevel VARCHAR(50) NULL,
  notes TEXT NULL,
  isValidated TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  INDEX idx_counterparties_rfc (rfc),
  INDEX idx_counterparties_type (counterpartyType, deletedAt)
);

CREATE TABLE counterparty_contacts (
  id CHAR(36) PRIMARY KEY,
  counterpartyId CHAR(36) NOT NULL,
  name VARCHAR(180) NOT NULL,
  email VARCHAR(180) NULL,
  phone VARCHAR(30) NULL,
  position VARCHAR(100) NULL,
  isLegalRepresentative TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_counterparty_contacts_counterparty (counterpartyId),
  FOREIGN KEY (counterpartyId) REFERENCES counterparties (id) ON DELETE CASCADE
);

CREATE TABLE counterparty_documents (
  id CHAR(36) PRIMARY KEY,
  counterpartyId CHAR(36) NOT NULL,
  documentType VARCHAR(100) NOT NULL,
  fileName VARCHAR(255) NOT NULL,
  fileKey VARCHAR(255) NULL,
  expirationDate DATE NULL,
  isValid TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_counterparty_documents_counterparty (counterpartyId),
  FOREIGN KEY (counterpartyId) REFERENCES counterparties (id) ON DELETE CASCADE
);

CREATE TABLE contract_requests (
  id CHAR(36) PRIMARY KEY,
  contractType VARCHAR(100) NOT NULL,
  projectId CHAR(36) NULL,
  counterpartyName VARCHAR(255) NULL,
  counterpartyRfc VARCHAR(20) NULL,
  counterpartyId VARCHAR(255) NULL,
  estimatedAmount DECIMAL(18, 2) NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'MXN',
  startDate DATE NULL,
  endDate DATE NULL,
  requestingArea VARCHAR(160) NULL,
  responsibleUserId CHAR(36) NULL,
  urgencyLevel VARCHAR(20) NOT NULL DEFAULT 'normal',
  riskLevel VARCHAR(20) NOT NULL DEFAULT 'low',
  description TEXT NULL,
  justification TEXT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  reviewedById CHAR(36) NULL,
  reviewComments TEXT NULL,
  reviewedAt DATETIME NULL,
  createdById CHAR(36) NULL,
  convertedContractId CHAR(36) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deletedAt DATETIME NULL,
  INDEX idx_contract_requests_project (projectId, status, deletedAt),
  INDEX idx_contract_requests_status (status, createdAt),
  FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE SET NULL,
  FOREIGN KEY (responsibleUserId) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (reviewedById) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (createdById) REFERENCES users (id) ON DELETE SET NULL,
  FOREIGN KEY (convertedContractId) REFERENCES contracts (id) ON DELETE SET NULL
);

ALTER TABLE contracts
ADD CONSTRAINT fk_contracts_supplier_counterparty FOREIGN KEY (supplierCounterpartyId) REFERENCES counterparties (id) ON DELETE SET NULL;

ALTER TABLE contracts
ADD CONSTRAINT fk_contracts_client_counterparty FOREIGN KEY (clientCounterpartyId) REFERENCES counterparties (id) ON DELETE SET NULL;
