SET
  @admin_user_id = '10000000-0000-0000-0000-000000000001';

SET
  @pm_user_id = '10000000-0000-0000-0000-000000000002';

SET
  @reviewer_user_id = '10000000-0000-0000-0000-000000000003';

SET
  @viewer_user_id = '10000000-0000-0000-0000-000000000004';

SET
  @project_id = '20000000-0000-0000-0000-000000000001';

SET
  @discipline_arc = '30000000-0000-0000-0000-000000000001';

SET
  @discipline_mec = '30000000-0000-0000-0000-000000000002';

SET
  @folder_root = '40000000-0000-0000-0000-000000000001';

SET
  @folder_arc = '40000000-0000-0000-0000-000000000002';

SET
  @folder_mec = '40000000-0000-0000-0000-000000000003';

SET
  @doc_public_id = '50000000-0000-0000-0000-000000000001';

SET
  @doc_public_ver = '50000000-0000-0000-0000-000000000011';

SET
  @doc_restricted_id = '50000000-0000-0000-0000-000000000002';

SET
  @doc_restricted_ver = '50000000-0000-0000-0000-000000000012';

SET
  @approval_flow_id = '60000000-0000-0000-0000-000000000001';

SET
  @approval_step_id = '60000000-0000-0000-0000-000000000002';

SET
  @approval_request_id = '60000000-0000-0000-0000-000000000003';

SET
  @rfi_id = '70000000-0000-0000-0000-000000000001';

SET
  @contract_id = '80000000-0000-0000-0000-000000000001';

SET
  @contract_version_id = '80000000-0000-0000-0000-000000000011';

SET
  @contract_attachment_id = '80000000-0000-0000-0000-000000000012';

SET
  @contract_obligation_id = '80000000-0000-0000-0000-000000000013';

SET
  @contract_milestone_id = '80000000-0000-0000-0000-000000000014';

SET
  @contract_comment_id = '80000000-0000-0000-0000-000000000015';

INSERT IGNORE INTO
  users (
    id,
    name,
    email,
    password_hash,
    active,
    created_at,
    updated_at
  )
VALUES
  (
    @admin_user_id,
    'Administrador Holocron',
    'admin@holocron.local',
    '$2b$12$Wex5jMBUZCMGssWkR/Fj4e/doSjCsqz6bF9stvSJpCtihvN55gCyu',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    @pm_user_id,
    'Paula Proyecto',
    'pm@holocron.local',
    '$2b$12$Wex5jMBUZCMGssWkR/Fj4e/doSjCsqz6bF9stvSJpCtihvN55gCyu',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    @reviewer_user_id,
    'Ricardo Revisor',
    'reviewer@holocron.local',
    '$2b$12$Wex5jMBUZCMGssWkR/Fj4e/doSjCsqz6bF9stvSJpCtihvN55gCyu',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    @viewer_user_id,
    'Valeria Viewer',
    'viewer@holocron.local',
    '$2b$12$Wex5jMBUZCMGssWkR/Fj4e/doSjCsqz6bF9stvSJpCtihvN55gCyu',
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  role_user (role_id, user_id)
SELECT
  r.id,
  @admin_user_id
FROM
  roles r
WHERE
  r.`key` = 'admin';

INSERT IGNORE INTO
  role_user (role_id, user_id)
SELECT
  r.id,
  @pm_user_id
FROM
  roles r
WHERE
  r.`key` = 'project_manager';

INSERT IGNORE INTO
  role_user (role_id, user_id)
SELECT
  r.id,
  @reviewer_user_id
FROM
  roles r
WHERE
  r.`key` = 'project_manager';

INSERT IGNORE INTO
  role_user (role_id, user_id)
SELECT
  r.id,
  @viewer_user_id
FROM
  roles r
WHERE
  r.`key` = 'viewer';

INSERT IGNORE INTO
  disciplines (
    id,
    code,
    name,
    description,
    created_at,
    updated_at
  )
VALUES
  (
    @discipline_arc,
    'ARC',
    'Arquitectura',
    'Disciplina arquitectonica',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    @discipline_mec,
    'MEC',
    'Mecanica',
    'Disciplina mecanica',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  projects (
    id,
    name,
    code,
    description,
    work_type,
    current_stage,
    priority,
    responsible_user_id,
    target_date,
    status,
    is_active,
    discipline_ids,
    owner_id,
    created_at,
    updated_at
  )
VALUES
  (
    @project_id,
    'Torre Ejecutiva Norte',
    'HOL-PRJ-001',
    'Proyecto demo V1 Holocron',
    'Edificacion',
    'Coordinacion documental',
    'alta',
    @pm_user_id,
    DATE_ADD(CURDATE(), INTERVAL 45 DAY),
    'ejecucion',
    1,
    JSON_ARRAY(@discipline_arc, @discipline_mec),
    @admin_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  project_users (
    id,
    project_id,
    user_id,
    role,
    can_manage_documents,
    can_manage_contracts,
    created_at,
    updated_at
  )
VALUES
  (
    '21000000-0000-0000-0000-000000000001',
    @project_id,
    @admin_user_id,
    'owner',
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '21000000-0000-0000-0000-000000000002',
    @project_id,
    @pm_user_id,
    'manager',
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '21000000-0000-0000-0000-000000000003',
    @project_id,
    @reviewer_user_id,
    'contributor',
    1,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '21000000-0000-0000-0000-000000000004',
    @project_id,
    @viewer_user_id,
    'viewer',
    0,
    0,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  folders (
    id,
    project_id,
    parent_id,
    discipline_id,
    name,
    path,
    created_by_id,
    created_at,
    updated_at
  )
VALUES
  (
    @folder_root,
    @project_id,
    NULL,
    NULL,
    '02_Tecnico',
    '02_Tecnico',
    @pm_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    @folder_arc,
    @project_id,
    @folder_root,
    @discipline_arc,
    'ARC_Arquitectura',
    '02_Tecnico/ARC_Arquitectura',
    @pm_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    @folder_mec,
    @project_id,
    @folder_root,
    @discipline_mec,
    'MEC_Mecanica',
    '02_Tecnico/MEC_Mecanica',
    @pm_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  documents (
    id,
    name,
    document_number,
    project_id,
    folder_id,
    discipline_id,
    status,
    confidentiality_level,
    responsible_user_id,
    current_version_id,
    due_date,
    renewable,
    original_file_key,
    file_extension,
    size_bytes,
    uploaded_by_id,
    created_at,
    updated_at
  )
VALUES
  (
    @doc_public_id,
    'Especificacion arquitectonica demo',
    'ARC-ESP-001',
    @project_id,
    @folder_arc,
    @discipline_arc,
    'approved',
    'internal',
    @pm_user_id,
    NULL,
    DATE_ADD(CURDATE(), INTERVAL 20 DAY),
    1,
    'seed-architecture-spec.txt',
    'txt',
    245,
    @pm_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    @doc_restricted_id,
    'Observaciones legales reservadas',
    'LEG-OBS-001',
    @project_id,
    @folder_arc,
    @discipline_arc,
    'in_review',
    'restricted',
    @reviewer_user_id,
    NULL,
    DATE_ADD(CURDATE(), INTERVAL 5 DAY),
    0,
    'seed-legal-observations.txt',
    'txt',
    233,
    @reviewer_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  document_versions (
    id,
    document_id,
    revision,
    file_key,
    file_name,
    file_extension,
    mime_type,
    size_bytes,
    uploaded_by_id,
    notes,
    content_hash,
    content_extraction_status,
    content_extracted_at,
    created_at
  )
VALUES
  (
    @doc_public_ver,
    @doc_public_id,
    'A',
    'seed-architecture-spec.txt',
    'seed-architecture-spec.txt',
    'txt',
    'text/plain',
    245,
    @pm_user_id,
    'Version aprobada para demo',
    SHA2('seed-architecture-spec.txt', 256),
    'completed',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    @doc_restricted_ver,
    @doc_restricted_id,
    'A',
    'seed-legal-observations.txt',
    'seed-legal-observations.txt',
    'txt',
    'text/plain',
    233,
    @reviewer_user_id,
    'Version restringida para demo',
    SHA2('seed-legal-observations.txt', 256),
    'completed',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

UPDATE documents
SET
  current_version_id = @doc_public_ver
WHERE
  id = @doc_public_id;

UPDATE documents
SET
  current_version_id = @doc_restricted_ver
WHERE
  id = @doc_restricted_id;

INSERT IGNORE INTO
  document_permissions (
    id,
    document_id,
    user_id,
    role_id,
    project_user_id,
    permission,
    granted_by_id,
    created_at,
    updated_at
  )
VALUES
  (
    '51000000-0000-0000-0000-000000000001',
    @doc_restricted_id,
    @pm_user_id,
    NULL,
    NULL,
    'view',
    @admin_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '51000000-0000-0000-0000-000000000002',
    @doc_restricted_id,
    @reviewer_user_id,
    NULL,
    NULL,
    'view',
    @admin_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  document_chunks (
    id,
    document_id,
    version_id,
    chunk_index,
    content,
    token_count,
    page_number,
    section_label,
    created_at
  )
VALUES
  (
    '52000000-0000-0000-0000-000000000001',
    @doc_public_id,
    @doc_public_ver,
    0,
    'Documento: Especificacion arquitectonica demo. Version A. Este documento define acabados, alcances, fechas de entrega y responsables arquitectonicos del proyecto Torre Ejecutiva Norte.',
    40,
    1,
    'Resumen documental',
    CURRENT_TIMESTAMP
  ),
  (
    '52000000-0000-0000-0000-000000000002',
    @doc_restricted_id,
    @doc_restricted_ver,
    0,
    'Documento: Observaciones legales reservadas. Version A. Este archivo contiene riesgos contractuales y observaciones confidenciales para revision interna.',
    33,
    1,
    'Resumen legal',
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  document_embeddings (
    id,
    chunk_id,
    provider,
    model,
    dimensions,
    embedding,
    content_hash,
    created_at
  )
VALUES
  (
    '53000000-0000-0000-0000-000000000001',
    '52000000-0000-0000-0000-000000000001',
    'local',
    'holocron-hash-v1',
    256,
    JSON_ARRAY(0.1, 0.2, 0.3),
    SHA2('public-chunk', 256),
    CURRENT_TIMESTAMP
  ),
  (
    '53000000-0000-0000-0000-000000000002',
    '52000000-0000-0000-0000-000000000002',
    'local',
    'holocron-hash-v1',
    256,
    JSON_ARRAY(0.4, 0.2, 0.1),
    SHA2('restricted-chunk', 256),
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  approval_workflows (
    id,
    project_id,
    name,
    entity_type,
    active,
    created_by_id,
    scope_type,
    target_document_id,
    require_for_publication,
    created_at,
    updated_at
  )
VALUES
  (
    @approval_flow_id,
    @project_id,
    'Flujo documental demo',
    'document',
    1,
    @admin_user_id,
    'global',
    NULL,
    1,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  approval_steps (
    id,
    workflow_id,
    step_order,
    name,
    approver_role_id,
    approver_user_id,
    required,
    created_at
  )
VALUES
  (
    @approval_step_id,
    @approval_flow_id,
    1,
    'Revision PM',
    NULL,
    @reviewer_user_id,
    1,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  approval_requests (
    id,
    workflow_id,
    current_step_id,
    requester_id,
    project_id,
    entity_type,
    entity_id,
    status,
    requested_at,
    last_action_at,
    created_at,
    updated_at
  )
VALUES
  (
    @approval_request_id,
    @approval_flow_id,
    @approval_step_id,
    @pm_user_id,
    @project_id,
    'document',
    @doc_restricted_id,
    'pending',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  rfis (
    id,
    project_id,
    document_id,
    subject,
    question,
    answer,
    status,
    priority,
    due_date,
    created_by_id,
    assigned_to_id,
    created_at,
    updated_at
  )
VALUES
  (
    @rfi_id,
    @project_id,
    @doc_public_id,
    'Consulta sobre acabado de fachada',
    'Confirmar si el acabado final aprobado es piedra sinterizada o panel compuesto.',
    NULL,
    'open',
    'high',
    DATE_ADD(CURDATE(), INTERVAL 3 DAY),
    @pm_user_id,
    @reviewer_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  rfi_comments (
    id,
    rfi_id,
    user_id,
    comment,
    comment_type,
    created_at,
    updated_at
  )
VALUES
  (
    '71000000-0000-0000-0000-000000000001',
    @rfi_id,
    @reviewer_user_id,
    'Se requiere revisar el documento arquitectonico demo para responder.',
    'comment',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  contracts (
    id,
    project_id,
    name,
    supplier_name,
    client_name,
    start_date,
    end_date,
    renewal_date,
    amount,
    currency,
    status,
    responsible_user_id,
    responsible_area,
    contract_type,
    main_document_id,
    current_version_id,
    renewable,
    renewal_notice_days,
    created_by_id,
    created_at,
    updated_at
  )
VALUES
  (
    @contract_id,
    @project_id,
    'Contrato marco de servicios demo',
    'Proveedor Demo SA',
    'Holocron SA',
    DATE_SUB(CURDATE(), INTERVAL 30 DAY),
    DATE_ADD(CURDATE(), INTERVAL 15 DAY),
    DATE_ADD(CURDATE(), INTERVAL 10 DAY),
    1250000.00,
    'MXN',
    'expiring_soon',
    @pm_user_id,
    'Legal',
    'Servicios',
    @doc_public_id,
    NULL,
    1,
    30,
    @admin_user_id,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

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
    @contract_version_id,
    @contract_id,
    'A',
    'seed-contract-summary.txt',
    'seed-contract-summary.txt',
    'txt',
    'text/plain',
    301,
    @pm_user_id,
    'Version inicial para demo',
    CURRENT_TIMESTAMP
  );

UPDATE contracts
SET
  current_version_id = @contract_version_id
WHERE
  id = @contract_id;

INSERT IGNORE INTO
  contract_attachments (
    id,
    contract_id,
    name,
    file_key,
    file_name,
    file_extension,
    mime_type,
    size_bytes,
    uploaded_by_id,
    notes,
    created_at
  )
VALUES
  (
    @contract_attachment_id,
    @contract_id,
    'Anexo tecnico demo',
    'seed-contract-annex.txt',
    'seed-contract-annex.txt',
    'txt',
    'text/plain',
    205,
    @pm_user_id,
    'Anexo operativo',
    CURRENT_TIMESTAMP
  );

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
    created_at,
    updated_at
  )
VALUES
  (
    @contract_obligation_id,
    @contract_id,
    'Entregar calendario consolidado de hitos contractuales al cliente.',
    @pm_user_id,
    DATE_ADD(CURDATE(), INTERVAL 7 DAY),
    'pending',
    @doc_public_id,
    'Pendiente de evidencia final.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  contract_milestones (
    id,
    contract_id,
    name,
    milestone_date,
    responsible_user_id,
    status,
    evidence_document_id,
    notes,
    created_at,
    updated_at
  )
VALUES
  (
    @contract_milestone_id,
    @contract_id,
    'Renovacion contractual',
    DATE_ADD(CURDATE(), INTERVAL 10 DAY),
    @reviewer_user_id,
    'in_progress',
    @doc_public_id,
    'Preparar paquete de renovacion.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  contract_comments (id, contract_id, author_id, body, created_at)
VALUES
  (
    @contract_comment_id,
    @contract_id,
    @reviewer_user_id,
    'Se detecto una ventana corta para renovar; dar seguimiento esta semana.',
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  notifications (
    id,
    user_id,
    title,
    body,
    type,
    entity_type,
    entity_id,
    created_at
  )
VALUES
  (
    '90000000-0000-0000-0000-000000000001',
    @pm_user_id,
    'Contrato proximo a vencer',
    'El contrato marco demo vence en 15 dias.',
    'contract_expiration',
    'contract',
    @contract_id,
    CURRENT_TIMESTAMP
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    @reviewer_user_id,
    'RFI asignado',
    'Tienes un RFI demo pendiente de respuesta.',
    'rfi_assignment',
    'rfi',
    @rfi_id,
    CURRENT_TIMESTAMP
  );

INSERT IGNORE INTO
  audit_logs (
    id,
    actor_id,
    action,
    entity_type,
    entity_id,
    metadata,
    created_at
  )
VALUES
  (
    '91000000-0000-0000-0000-000000000001',
    @admin_user_id,
    'seed.demo',
    'project',
    @project_id,
    JSON_OBJECT('seed', 'v1_demo'),
    CURRENT_TIMESTAMP
  ),
  (
    '91000000-0000-0000-0000-000000000002',
    @pm_user_id,
    'seed.demo',
    'document',
    @doc_public_id,
    JSON_OBJECT('seed', 'v1_demo'),
    CURRENT_TIMESTAMP
  );
