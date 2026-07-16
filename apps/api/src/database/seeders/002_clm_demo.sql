-- CLM Demo Data: Simulacion completa de un contrato
-- Requiere: 001_demo_v1.sql ejecutado primero (usuarios, proyecto)
-- ============================================================
-- VARIABLES GLOBALES
-- ============================================================
SET
  @admin_id = '10000000-0000-0000-0000-000000000001';

SET
  @pm_id = '10000000-0000-0000-0000-000000000002';

SET
  @project_id = '20000000-0000-0000-0000-000000000001';

SET
  @cp_id = '90000000-0000-0000-0000-000000000001';

SET
  @cp_contact_id = '90000000-0000-0000-0000-000000000011';

SET
  @request_id = '90000000-0000-0000-0000-000000000021';

SET
  @contract_id = '90000000-0000-0000-0000-000000000031';

SET
  @version_id = '90000000-0000-0000-0000-000000000041';

SET
  @tag_legal = '90000000-0000-0000-0000-000000000051';

SET
  @tag_fiscal = '90000000-0000-0000-0000-000000000052';

SET
  @obligacion_1 = '90000000-0000-0000-0000-000000000061';

SET
  @obligacion_2 = '90000000-0000-0000-0000-000000000062';

SET
  @obligacion_3 = '90000000-0000-0000-0000-000000000063';

SET
  @milestone_1 = '90000000-0000-0000-0000-000000000071';

SET
  @milestone_2 = '90000000-0000-0000-0000-000000000072';

SET
  @milestone_3 = '90000000-0000-0000-0000-000000000073';

SET
  @payment_1 = '90000000-0000-0000-0000-000000000081';

SET
  @payment_2 = '90000000-0000-0000-0000-000000000082';

SET
  @amendment_id = '90000000-0000-0000-0000-000000000091';

SET
  @negotiation_id = '90000000-0000-0000-0000-000000000101';

SET
  @lifecycle_event_1 = '90000000-0000-0000-0000-000000000111';

SET
  @lifecycle_event_2 = '90000000-0000-0000-0000-000000000112';

SET
  @template_id = '90000000-0000-0000-0000-000000000121';

SET
  @clause_confid = '90000000-0000-0000-0000-000000000131';

SET
  @clause_penal = '90000000-0000-0000-0000-000000000132';

SET
  @clause_term = '90000000-0000-0000-0000-000000000133';

SET
  @text_index_id = '90000000-0000-0000-0000-000000000141';

-- ============================================================
-- 1. CONTRAPARTE
-- ============================================================
INSERT IGNORE INTO
  counterparties (
    id,
    businessName,
    commercialName,
    rfc,
    taxAddress,
    country,
    counterpartyType,
    status,
    riskLevel,
    isValidated,
    notes
  )
VALUES
  (
    @cp_id,
    'Constructora del Valle SA de CV',
    'CodValle',
    'CVS220812H78',
    'Av. Revolucion 1234, Col. Centro, CDMX, 06000',
    'MEXICO',
    'proveedor',
    'active',
    'medium',
    1,
    'Proveedor habitual de servicios de construccion. Contrato marco firmado en 2024.'
  );

INSERT IGNORE INTO
  counterparty_contacts (
    id,
    counterpartyId,
    name,
    email,
    phone,
    position,
    isLegalRepresentative
  )
VALUES
  (
    @cp_contact_id,
    @cp_id,
    'Juan Carlos Mendoza',
    'jc.mendoza@codvalle.com',
    '5551234567',
    'Representante Legal',
    1
  );

-- ============================================================
-- 2. SOLICITUD DE CONTRATO
-- ============================================================
INSERT IGNORE INTO
  contract_requests (
    id,
    contractType,
    projectId,
    counterpartyName,
    counterpartyRfc,
    counterpartyId,
    estimatedAmount,
    currency,
    startDate,
    endDate,
    requestingArea,
    responsibleUserId,
    urgencyLevel,
    riskLevel,
    description,
    justification,
    status,
    createdById
  )
VALUES
  (
    @request_id,
    'prestacion_servicios',
    @project_id,
    'Constructora del Valle SA de CV',
    'CVS220812H78',
    @cp_id,
    2450000.00,
    'MXN',
    '2026-08-01',
    '2027-07-31',
    'Operaciones',
    @pm_id,
    'alta',
    'medio',
    'Servicio de mantenimiento integral para las instalaciones del proyecto Holocron, incluyendoareas administrativas, bodega y taller.',
    'El contrato actual de mantenimiento vence en julio 2026. Se requiere renovar con un proveedorque cumpla con los nuevos requisitos de cobertura y tiempos de respuesta.',
    'approved',
    @pm_id
  );

-- ============================================================
-- 3. CONTRATO
-- ============================================================
INSERT IGNORE INTO
  contracts (
    id,
    project_id,
    name,
    supplier_name,
    client_name,
    responsible_area,
    contract_type,
    start_date,
    end_date,
    renewal_date,
    amount,
    currency,
    status,
    lifecycle_stage,
    lifecycle_changed_at,
    responsible_user_id,
    renewable,
    renewal_notice_days,
    alert_days_before,
    riskLevel,
    counterpartyRfc,
    supplierCounterpartyId,
    created_by_id,
    created_at,
    updated_at
  )
VALUES
  (
    @contract_id,
    @project_id,
    'Servicio de mantenimiento integral 2026-2027',
    'Constructora del Valle SA de CV',
    'Grupo INDI - Holocron',
    'Operaciones',
    'prestacion_servicios',
    '2026-08-01',
    '2027-07-31',
    '2027-05-01',
    2450000.00,
    'MXN',
    'active',
    'active',
    '2026-08-01 00:00:00',
    @pm_id,
    1,
    90,
    60,
    'medium',
    'CVS220812H78',
    @cp_id,
    @admin_id,
    '2026-07-15 10:00:00',
    '2026-08-01 12:00:00'
  );

-- ============================================================
-- 4. VERSION DEL CONTRATO
-- ============================================================
INSERT IGNORE INTO
  contract_versions (
    id,
    contract_id,
    version_label,
    file_key,
    file_name,
    file_extension,
    mime_type,
    size_bytes,
    uploaded_by_id,
    change_summary,
    created_at
  )
VALUES
  (
    @version_id,
    @contract_id,
    '1.0',
    'clm/contracts/90000000-versiones/contrato-mantenimiento-v1.pdf',
    'contrato-mantenimiento-integral-v1.pdf',
    'pdf',
    'application/pdf',
    245760,
    @admin_id,
    'Version final firmada del contrato de mantenimiento integral.',
    '2026-07-30 14:00:00'
  );

UPDATE contracts
SET
  current_version_id = @version_id
WHERE
  id = @contract_id;

-- ============================================================
-- 5. TEXTO INDEXADO (para busqueda full-text)
-- ============================================================
INSERT IGNORE INTO
  contract_text_index (
    id,
    contract_id,
    version_id,
    content,
    content_hash,
    page_number
  )
VALUES
  (
    @text_index_id,
    @contract_id,
    @version_id,
    'CONTRATO DE PRESTACION DE SERVICIOS DE MANTENIMIENTO INTEGRAL

CONTRATANTE: Grupo INDI (Holocron)
PROVEEDOR: Constructora del Valle SA de CV (CodValle)
RFC DEL PROVEEDOR: CVS220812H78
MONTO TOTAL: $2,450,000.00 MXN mas IVA
FORMA DE PAGO: Pagos mensuales por $204,166.67 MXN mas IVA

VIGENCIA: Del 1 de agosto de 2026 al 31 de julio de 2027

CLAUSULA PRIMERA - OBJETO: El PROVEEDOR se obliga a prestar los servicios de mantenimiento preventivo y correctivo de las instalaciones del CONTRATANTE, incluyendo sistemas electricos, hidrosanitarios, HVAC, y areas comunes.

CLAUSULA SEGUNDA - OBLIGACIONES DEL PROVEEDOR: Entregar reportes mensuales de mantenimiento, mantener un stock minimo de refacciones, responder a emergencias en menos de 4 horas, y contar con seguro de responsabilidad civil vigente.

CLAUSULA TERCERA - PENALIZACIONES: Por incumplimiento en tiempos de respuesta se aplicara una penalizacion del 1% del monto mensual por cada hora de retraso. Por incumplimiento grave se podra resolver el contrato.

CLAUSULA CUARTA - TERMINACION ANTICIPADA: Cualquiera de las partes podra terminar el contrato con 60 dias de anticipacion mediante notificacion por escrito. En caso de terminacion anticipada, se pagaran los servicios efectivamente prestados.

CLAUSULA QUINTA - CONFIDENCIALIDAD: El PROVEEDOR se obliga a mantener la confidencialidad de toda la informacion del CONTRATANTE a la que tenga acceso, por un periodo de 2 anos posteriores a la terminacion del contrato.',
    'e1b8e6c9a2f3d4b5c6a7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9',
    1
  );

-- ============================================================
-- 6. TAGS
-- ============================================================
INSERT IGNORE INTO
  tags (id, name, color)
VALUES
  (@tag_legal, 'Juridico', '#e74c3c'),
  (@tag_fiscal, 'Fiscal', '#3498db');

INSERT IGNORE INTO
  contract_tags (contract_id, tag_id)
VALUES
  (@contract_id, @tag_legal),
  (@contract_id, @tag_fiscal);

-- ============================================================
-- 7. OBLIGACIONES
-- ============================================================
INSERT IGNORE INTO
  contract_obligations (
    id,
    contract_id,
    description,
    responsible_user_id,
    commitment_date,
    status,
    evidence_document_id,
    comments,
    periodicity,
    priority,
    consequence,
    periodicityDay,
    alert_days_before
  )
VALUES
  (
    @obligacion_1,
    @contract_id,
    'Entregar reporte mensual de mantenimiento preventivo',
    @pm_id,
    '2026-09-05',
    'pending',
    NULL,
    'Incluir detalle de actividades realizadas, refacciones utilizadas y recomendaciones.',
    'monthly',
    'high',
    'Incumplimiento: penalizacion del 1% del monto mensual por cada dia de retraso en la entrega.',
    5,
    14
  ),
  (
    @obligacion_2,
    @contract_id,
    'Mantener seguro de responsabilidad civil vigente',
    @pm_id,
    '2026-12-31',
    'pending',
    NULL,
    'La poliza debe cubrir danos a terceros por al menos $5,000,000 MXN.',
    'yearly',
    'high',
    'Incumplimiento: suspension del contrato hasta presentar la poliza vigente.',
    NULL,
    60
  ),
  (
    @obligacion_3,
    @contract_id,
    'Responder a emergencias en menos de 4 horas',
    NULL,
    '2026-08-01',
    'pending',
    NULL,
    'Aplica para fallas electricas, fugas de agua y fallas en sistemas HVAC.',
    'once',
    'critical',
    'Incumplimiento: penalizacion del 1% del monto mensual por cada hora de retraso.',
    NULL,
    7
  );

-- ============================================================
-- 8. HITOS
-- ============================================================
INSERT IGNORE INTO
  contract_milestones (
    id,
    contract_id,
    name,
    milestone_date,
    responsible_user_id,
    status,
    notes
  )
VALUES
  (
    @milestone_1,
    @contract_id,
    'Entrega de diagnostico inicial',
    '2026-08-15',
    @pm_id,
    'completed',
    'Diagnostico entregado y aprobado. Se identificaron 12 areas de mejora prioritaria.'
  ),
  (
    @milestone_2,
    @contract_id,
    'Instalacion de equipos de monitoreo',
    '2026-09-30',
    @pm_id,
    'pending',
    'Sensores IoT para monitoreo en tiempo real de consumo electrico y temperatura.'
  ),
  (
    @milestone_3,
    @contract_id,
    'Cierre de ejercicio anual',
    '2027-07-31',
    @pm_id,
    'pending',
    'Entrega de reporte anual, inventario de refacciones y acta de cierre.'
  );

-- ============================================================
-- 9. PAGOS
-- ============================================================
INSERT IGNORE INTO
  contract_payments (
    id,
    contract_id,
    concept,
    amount,
    currency,
    payment_date,
    due_date,
    status,
    invoice_number,
    notes,
    created_by_id
  )
VALUES
  (
    @payment_1,
    @contract_id,
    'Pago mensual agosto 2026',
    204166.67,
    'MXN',
    '2026-09-05',
    '2026-09-01',
    'paid',
    'FAC-2026-08421',
    'Pago puntual. Factura recibida el 1 de septiembre.',
    @admin_id
  ),
  (
    @payment_2,
    @contract_id,
    'Pago mensual septiembre 2026',
    204166.67,
    'MXN',
    NULL,
    '2026-10-01',
    'pending',
    NULL,
    'Pendiente de facturacion.',
    @admin_id
  );

-- ============================================================
-- 10. CONVENIO MODIFICATORIO
-- ============================================================
INSERT IGNORE INTO
  contract_amendments (
    id,
    contract_id,
    amendment_number,
    title,
    description,
    amendment_date,
    status,
    created_by_id
  )
VALUES
  (
    @amendment_id,
    @contract_id,
    'CM-2026-001',
    'Convenio modificatorio - Ampliacion de cobertura',
    'Se amplia la cobertura de mantenimiento para incluir el area de bodega norte (500 m2 adicionales). El monto se incrementa en $180,000 MXN anuales.',
    '2026-10-15',
    'draft',
    @admin_id
  );

-- ============================================================
-- 11. NEGOCIACION
-- ============================================================
INSERT IGNORE INTO
  contract_negotiations (
    id,
    contract_id,
    party_name,
    proposed_text,
    original_text,
    status,
    created_by_id
  )
VALUES
  (
    @negotiation_id,
    @contract_id,
    'Constructora del Valle SA de CV',
    'El proveedor se compromete a mantener un tiempo de respuesta maximo de 2 horas para emergencias criticas.',
    'El proveedor se compromete a mantener un tiempo de respuesta maximo de 4 horas para emergencias.',
    'accepted',
    @pm_id
  );

-- ============================================================
-- 12. EVENTOS DE CICLO DE VIDA
-- ============================================================
INSERT IGNORE INTO
  contract_lifecycle_events (
    id,
    contract_id,
    previous_stage,
    stage,
    changed_by_id,
    comments,
    decision,
    time_in_previous_stage_minutes,
    created_at
  )
VALUES
  (
    @lifecycle_event_1,
    @contract_id,
    NULL,
    'request',
    @pm_id,
    'Solicitud de contrato creada por el area de Operaciones.',
    'created',
    0,
    '2026-07-01 09:00:00'
  ),
  (
    @lifecycle_event_2,
    @contract_id,
    'request',
    'approval',
    @admin_id,
    'Solicitud revisada y aprobada. Se autoriza la contratacion.',
    'approved',
    43200,
    '2026-07-10 10:00:00'
  );

-- ============================================================
-- 13. PLANTILLA
-- ============================================================
INSERT IGNORE INTO
  contract_templates (
    id,
    name,
    description,
    contract_type,
    content,
    version,
    versionNumber,
    is_active,
    created_by_id
  )
VALUES
  (
    @template_id,
    'Contrato de prestacion de servicios - Profesional',
    'Plantilla estandar para contratos de prestacion de servicios profesionales. Incluye clausulas de confidencialidad, propiedad intelectual y terminacion.',
    'prestacion_servicios',
    'CONTRATO DE PRESTACION DE SERVICIOS PROFESIONALES

CONTRATANTE: {{empresa_contratante}}
PROVEEDOR: {{nombre_proveedor}}
RFC PROVEEDOR: {{rfc_proveedor}}
MONTO TOTAL: {{monto_total}} {{moneda}}
VIGENCIA: Del {{fecha_inicio}} al {{fecha_fin}}
RESPONSABLE: {{responsable_interno}}

CLAUSULA PRIMERA - OBJETO: El PROVEEDOR se obliga a prestar los servicios descritos en el Anexo A del presente contrato.

CLAUSULA SEGUNDA - CONTRAPRESTACION: El CONTRATANTE pagara al PROVEEDOR la cantidad de {{monto_total}} {{moneda}}, en {{forma_pago}}.

CLAUSULA TERCERA - CONFIDENCIALIDAD: Las partes se obligan a mantener la confidencialidad de la informacion intercambiada.

CLAUSULA CUARTA - PROPIEDAD INTELECTUAL: Los derechos de propiedad intelectual sobre los entregables seran del CONTRATANTE.

CLAUSULA QUINTA - TERMINACION: El contrato podra terminar anticipadamente con {{dias_notificacion}} dias de notificacion.',
    '2.0',
    2,
    1,
    @admin_id
  );

-- ============================================================
-- 14. CLAUSULAS
-- ============================================================
INSERT IGNORE INTO
  contract_clauses (
    id,
    title,
    content,
    category,
    is_active,
    created_by_id
  )
VALUES
  (
    @clause_confid,
    'Confidencialidad estandar',
    'El PROVEEDOR se obliga a mantener estricta confidencialidad sobre toda la informacion del CONTRATANTE, incluyendo datos tecnicos, financieros, comerciales y de cualquier otra naturaleza, a la que tenga acceso con motivo del presente contrato. Esta obligacion subsistira por un periodo de 2 anos posteriores a la terminacion del contrato.',
    'confidencialidad',
    1,
    @admin_id
  ),
  (
    @clause_penal,
    'Penalizaciones por incumplimiento',
    'En caso de incumplimiento comprobado de las obligaciones del PROVEEDOR, se aplicara una penalizacion equivalente al 1% del monto total del contrato por cada evento de incumplimiento, sin perjuicio de la facultad del CONTRATANTE de resolver el contrato.',
    'penalizaciones',
    1,
    @admin_id
  ),
  (
    @clause_term,
    'Terminacion anticipada',
    'Cualquiera de las partes podra dar por terminado el presente contrato de manera anticipada, sin necesidad de expresar causa, mediante notificacion por escrito con 30 dias naturales de anticipacion. En caso de terminacion, se pagaran los servicios efectivamente prestados a la fecha de terminacion.',
    'terminacion',
    1,
    @admin_id
  );

-- ============================================================
-- 15. PERMISOS CLM (si no existen)
-- ============================================================
INSERT IGNORE INTO
  permissions (id, `key`, label, module)
SELECT
  UUID(),
  p.`key`,
  p.label,
  p.module
FROM
  (
    SELECT
      'clm.templates' AS `key`,
      'Gestionar plantillas CLM' AS label,
      'clm' AS module
    UNION ALL
    SELECT
      'clm.import',
      'Importar contratos',
      'clm'
    UNION ALL
    SELECT
      'clm.export',
      'Exportar contratos',
      'clm'
    UNION ALL
    SELECT
      'clm.sign',
      'Enviar a firma',
      'clm'
    UNION ALL
    SELECT
      'clm.finance',
      'Ver finanzas CLM',
      'clm'
    UNION ALL
    SELECT
      'clm.reports',
      'Ver reportes CLM',
      'clm'
  ) p
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      permissions
    WHERE
      `key` = p.`key`
  );

INSERT IGNORE INTO
  role_permissions (role_id, permission_id)
SELECT
  r.id,
  p.id
FROM
  roles r
  JOIN permissions p ON p.`key` IN (
    'clm.templates',
    'clm.import',
    'clm.export',
    'clm.sign',
    'clm.finance',
    'clm.reports'
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

-- ============================================================
-- 16. COMENTARIO DE EJEMPLO
-- ============================================================
INSERT IGNORE INTO
  contract_comments (id, contract_id, author_id, body, created_at)
SELECT
  '90000000-0000-0000-0000-000000000151',
  @contract_id,
  @pm_id,
  'El proveedor cumplio satisfactoriamente con el diagnostico inicial. Se recomienda dar seguimiento puntual a las obligaciones mensuales.',
  '2026-08-16 11:30:00'
WHERE
  NOT EXISTS (
    SELECT
      1
    FROM
      contract_comments
    WHERE
      id = '90000000-0000-0000-0000-000000000151'
  );

SELECT
  'CLM demo data seeded successfully.' AS status;
