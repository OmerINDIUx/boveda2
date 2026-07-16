CREATE TABLE IF NOT EXISTS bitacoras (
  id CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL UNIQUE,
  folio_actual INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  FOREIGN KEY (project_id) REFERENCES projects (id)
);

CREATE TABLE IF NOT EXISTS bitacora_entries (
  id CHAR(36) PRIMARY KEY,
  bitacora_id CHAR(36) NOT NULL,
  project_id CHAR(36) NOT NULL,
  folio INT NOT NULL,
  fecha DATE NOT NULL,
  turno VARCHAR(20) NOT NULL DEFAULT 'matutino',
  clima JSON,
  descripcion_general TEXT,
  actividades JSON,
  personal JSON,
  equipos JSON,
  materiales_recibidos JSON,
  incidentes JSON,
  seguridad TEXT,
  calidad TEXT,
  observaciones TEXT,
  avance_estimado DECIMAL(5, 2),
  estado VARCHAR(20) NOT NULL DEFAULT 'borrador',
  firmado_por_id CHAR(36) NULL,
  firmado_en DATETIME NULL,
  created_by_id CHAR(36) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  INDEX idx_entries_bitacora_fecha (bitacora_id, fecha),
  INDEX idx_entries_estado (estado),
  FOREIGN KEY (bitacora_id) REFERENCES bitacoras (id),
  FOREIGN KEY (project_id) REFERENCES projects (id),
  FOREIGN KEY (firmado_por_id) REFERENCES users (id),
  FOREIGN KEY (created_by_id) REFERENCES users (id)
);

CREATE TABLE IF NOT EXISTS bitacora_photos (
  id CHAR(36) PRIMARY KEY,
  entry_id CHAR(36) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(30) NOT NULL DEFAULT 'general',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entry_id) REFERENCES bitacora_entries (id)
);

CREATE TABLE IF NOT EXISTS bitacora_history (
  id CHAR(36) PRIMARY KEY,
  entry_id CHAR(36) NOT NULL,
  actor_id CHAR(36) NULL,
  accion VARCHAR(80) NOT NULL,
  before_state JSON,
  after_state JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (entry_id) REFERENCES bitacora_entries (id),
  FOREIGN KEY (actor_id) REFERENCES users (id)
);

INSERT INTO
  permissions (id, `key`, label, module)
VALUES
  (
    UUID(),
    'bitacoras.view',
    'Ver bitácora',
    'bitacoras'
  ),
  (
    UUID(),
    'bitacoras.create',
    'Crear entrada de bitácora',
    'bitacoras'
  ),
  (
    UUID(),
    'bitacoras.edit',
    'Editar entrada de bitácora',
    'bitacoras'
  ),
  (
    UUID(),
    'bitacoras.sign',
    'Firmar entrada de bitácora',
    'bitacoras'
  ),
  (
    UUID(),
    'bitacoras.delete',
    'Eliminar entrada de bitácora',
    'bitacoras'
  ),
  (
    UUID(),
    'bitacoras.manage',
    'Administrar bitácora',
    'bitacoras'
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
    'bitacoras.view',
    'bitacoras.create',
    'bitacoras.edit',
    'bitacoras.sign',
    'bitacoras.delete',
    'bitacoras.manage'
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
  JOIN permissions p ON p.`key` IN (
    'bitacoras.view',
    'bitacoras.create',
    'bitacoras.edit'
  )
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
