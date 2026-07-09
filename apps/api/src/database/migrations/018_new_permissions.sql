INSERT INTO
  permissions (id, `key`, label, module)
VALUES
  (
    UUID(),
    'emails.view',
    'Ver correos del proyecto',
    'emails'
  ),
  (
    UUID(),
    'emails.manage',
    'Administrar correos',
    'emails'
  ),
  (
    UUID(),
    'nomenclatures.manage',
    'Administrar nomenclaturas',
    'nomenclatures'
  ),
  (
    UUID(),
    'bulk.upload',
    'Carga masiva de archivos',
    'uploads'
  ),
  (
    UUID(),
    'sla.manage',
    'Administrar SLAs y tiempos',
    'sla'
  ),
  (
    UUID(),
    'language.edit',
    'Cambiar idioma del perfil',
    'users'
  )
ON DUPLICATE KEY UPDATE
  id = id;

INSERT INTO
  role_permissions (role_id, permission_id)
SELECT
  r.id,
  p.id
FROM
  roles r
  JOIN permissions p ON p.`key` IN (
    'emails.view',
    'emails.manage',
    'nomenclatures.manage',
    'bulk.upload',
    'sla.manage',
    'language.edit'
  )
WHERE
  r.`key` = 'admin'
  AND NOT EXISTS (
    SELECT
      1
    FROM
      role_permissions rp
    WHERE
      rp.role_id = r.id
      AND rp.permission_id = p.id
  );

INSERT INTO
  role_permissions (role_id, permission_id)
SELECT
  r.id,
  p.id
FROM
  roles r
  JOIN permissions p ON p.`key` IN ('emails.view', 'bulk.upload', 'language.edit')
WHERE
  r.`key` = 'project_manager'
  AND NOT EXISTS (
    SELECT
      1
    FROM
      role_permissions rp
    WHERE
      rp.role_id = r.id
      AND rp.permission_id = p.id
  );
