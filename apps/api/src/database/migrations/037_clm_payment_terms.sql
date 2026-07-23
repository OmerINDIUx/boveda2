ALTER TABLE contract_payments
MODIFY COLUMN amount DECIMAL(18, 2) NULL,
ADD COLUMN percentage DECIMAL(8, 4) NULL AFTER currency,
ADD COLUMN payment_condition TEXT NULL AFTER percentage;
