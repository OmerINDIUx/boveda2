ALTER TABLE contract_extraction_runs
ADD COLUMN progress_percent INT NOT NULL DEFAULT 0 AFTER error,
ADD COLUMN processing_stage VARCHAR(80) NOT NULL DEFAULT 'queued' AFTER progress_percent;
