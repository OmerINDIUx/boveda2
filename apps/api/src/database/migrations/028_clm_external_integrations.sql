ALTER TABLE contract_payments
ADD COLUMN erp_external_id VARCHAR(255) NULL AFTER notes,
ADD COLUMN erp_sync_status VARCHAR(40) NULL AFTER erp_external_id,
ADD COLUMN erp_sync_error TEXT NULL AFTER erp_sync_status,
ADD COLUMN erp_synced_at DATETIME NULL AFTER erp_sync_error;

CREATE INDEX idx_contract_payments_erp_sync_status ON contract_payments (erp_sync_status);
