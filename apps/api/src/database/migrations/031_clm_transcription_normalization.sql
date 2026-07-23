ALTER TABLE contract_text_index
ADD COLUMN raw_content LONGTEXT NULL AFTER content,
ADD COLUMN normalization_method VARCHAR(40) NULL AFTER raw_content;
