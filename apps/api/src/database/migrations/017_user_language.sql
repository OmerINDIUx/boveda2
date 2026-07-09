ALTER TABLE users
ADD COLUMN language VARCHAR(10) NULL DEFAULT 'es' AFTER active,
ADD INDEX idx_users_language (language);
