ALTER TABLE approval_steps
ADD COLUMN approver_user_ids TEXT NULL AFTER approver_user_id,
ADD COLUMN due_days INT NULL AFTER required;
