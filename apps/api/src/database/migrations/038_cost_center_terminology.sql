-- Actualiza textos de sistema para instalaciones existentes sin cambiar
-- claves, tablas ni relaciones internas basadas en "projects".
UPDATE permissions
SET
  label = 'Ver centro de costos'
WHERE
  `key` = 'projects.view';

UPDATE permissions
SET
  label = 'Gestionar centros de costos'
WHERE
  `key` = 'projects.manage';

UPDATE permissions
SET
  label = 'Ver correos del centro de costos'
WHERE
  `key` = 'emails.view';

UPDATE roles
SET
  name = 'Gerente de centro de costos',
  description = 'Gestión operativa por centro de costos'
WHERE
  `key` = 'project_manager';

UPDATE project_catalog_options
SET
  description = CASE value
    WHEN 'edificacion_vertical' THEN 'Centros de costos de torre, edificio o campus.'
    WHEN 'industrial' THEN 'Centros de costos industriales y de manufactura.'
    WHEN 'planificacion' THEN CASE category
      WHEN 'currentStage' THEN 'Etapa inicial del centro de costos.'
      WHEN 'status' THEN 'Centro de costos en preparación.'
      ELSE description
    END
    WHEN 'en_ejecucion' THEN 'Centro de costos activo.'
    WHEN 'en_riesgo' THEN 'Centro de costos con alertas críticas.'
    WHEN 'cerrado' THEN 'Centro de costos concluido.'
    ELSE description
  END
WHERE
  (
    category = 'workType'
    AND value IN ('edificacion_vertical', 'industrial')
  )
  OR (
    category = 'currentStage'
    AND value = 'planificacion'
  )
  OR (
    category = 'status'
    AND value IN (
      'planificacion',
      'en_ejecucion',
      'en_riesgo',
      'cerrado'
    )
  );
