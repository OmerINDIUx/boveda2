UPDATE users
SET
  password_hash = '$2b$12$Wex5jMBUZCMGssWkR/Fj4e/doSjCsqz6bF9stvSJpCtihvN55gCyu',
  updated_at = CURRENT_TIMESTAMP
WHERE
  email IN (
    'admin@holocron.local',
    'pm@holocron.local',
    'reviewer@holocron.local',
    'viewer@holocron.local'
  );
