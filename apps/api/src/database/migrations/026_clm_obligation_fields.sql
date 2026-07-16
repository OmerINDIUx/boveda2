ALTER TABLE contract_obligations
ADD COLUMN periodicity VARCHAR(20) NOT NULL DEFAULT 'once' AFTER comments;

ALTER TABLE contract_obligations
ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'medium' AFTER periodicity;

ALTER TABLE contract_obligations
ADD COLUMN consequence TEXT NULL AFTER priority;

ALTER TABLE contract_obligations
ADD COLUMN periodicityDay INT NULL AFTER consequence;

ALTER TABLE contract_obligations
ADD COLUMN lastRemindedAt DATETIME NULL AFTER periodicityDay;

ALTER TABLE contract_obligations
ADD COLUMN reminderCount INT NOT NULL DEFAULT 0 AFTER lastRemindedAt;
