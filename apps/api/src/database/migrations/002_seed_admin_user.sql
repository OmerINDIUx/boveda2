SET @admin_user_id = '10000000-0000-0000-0000-000000000001';

INSERT IGNORE INTO users (
  id,
  name,
  email,
  password_hash,
  active,
  created_at,
  updated_at
) VALUES (
  @admin_user_id,
  'Administrador Holocron',
  'admin@holocron.local',
  '$2b$12$uTuuOtIAA8nedGlmE.0rlufdZirNqwgK2KrPx6zHB/lyItUNfUck.',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT IGNORE INTO role_user (role_id, user_id)
SELECT roles.id, @admin_user_id
FROM roles
WHERE roles.`key` = 'admin';
