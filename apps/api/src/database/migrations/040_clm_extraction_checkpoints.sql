ALTER TABLE contract_extraction_runs
ADD COLUMN checkpoint JSON NULL AFTER content_hash;
