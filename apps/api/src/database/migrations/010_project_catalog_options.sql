CREATE TABLE project_catalog_options (
  id CHAR(36) PRIMARY KEY,
  category VARCHAR(40) NOT NULL,
  value VARCHAR(80) NOT NULL,
  label VARCHAR(120) NOT NULL,
  description VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE KEY uq_project_catalog_category_value (category, value),
  INDEX idx_project_catalog_category_active (category, is_active, deleted_at)
);

INSERT INTO project_catalog_options (id, category, value, label, description, sort_order, is_active)
VALUES
  (UUID(), 'workType', 'edificacion_vertical', 'Edificación vertical', 'Proyectos de torre, edificio o campus.', 10, 1),
  (UUID(), 'workType', 'infraestructura_hidraulica', 'Infraestructura hidráulica', 'Plantas, redes y obra hidráulica.', 20, 1),
  (UUID(), 'workType', 'industrial', 'Industrial', 'Proyectos industriales y de manufactura.', 30, 1),
  (UUID(), 'currentStage', 'planificacion', 'Planificación', 'Etapa inicial del proyecto.', 10, 1),
  (UUID(), 'currentStage', 'coordinacion_ifc', 'Coordinación IFC', 'Revisión y coordinación técnica.', 20, 1),
  (UUID(), 'currentStage', 'construccion', 'Construcción', 'Ejecución en obra.', 30, 1),
  (UUID(), 'currentStage', 'cierre', 'Cierre', 'Entrega y cierre administrativo.', 40, 1),
  (UUID(), 'priority', 'baja', 'Baja', 'Seguimiento normal.', 10, 1),
  (UUID(), 'priority', 'media', 'Media', 'Atención estándar.', 20, 1),
  (UUID(), 'priority', 'alta', 'Alta', 'Requiere atención prioritaria.', 30, 1),
  (UUID(), 'priority', 'critica', 'Crítica', 'Atención inmediata.', 40, 1),
  (UUID(), 'status', 'planificacion', 'Planificación', 'Proyecto en preparación.', 10, 1),
  (UUID(), 'status', 'en_ejecucion', 'En ejecución', 'Proyecto activo.', 20, 1),
  (UUID(), 'status', 'en_riesgo', 'En riesgo', 'Proyecto con alertas críticas.', 30, 1),
  (UUID(), 'status', 'cerrado', 'Cerrado', 'Proyecto concluido.', 40, 1);
