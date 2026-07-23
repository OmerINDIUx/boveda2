import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

async function source(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

test('la carga inicia análisis y dirige al paso de revisión', async () => {
  const form = await source('../components/modules/clm/version-form.tsx');

  assert.match(form, /createdVersionId/);
  assert.match(form, /currentVersionId/);
  assert.match(form, /\/review/);
  assert.doesNotMatch(form, /response\.createdVersionId}\/review/);
  assert.match(form, /Subir y analizar con IA/);
  assert.match(form, /uploadFile/);
  assert.match(form, /Subir contrato original y analizar con IA/);
});

test('un anexo abre G.OTA seleccionando su documento y no sólo el contrato', async () => {
  const attachments = await source('../components/modules/clm/attachments-manage.tsx');

  assert.match(attachments, /documentId=\$\{currentAttachment\.id\}/);
  assert.doesNotMatch(attachments, /attachmentId=\$\{currentAttachment\.id\}/);
  assert.match(attachments, /attachments\/\$\{currentAttachment\.id\}\/review/);
  assert.match(attachments, /Extraer o revisar datos/);
});

test('la revisión exige decisiones completas y contraseña antes de aplicar datos', async () => {
  const review = await source('../components/modules/clm/contract-extraction-review.tsx');

  assert.match(review, /current-password/);
  assert.match(review, /pending > 0/);
  assert.match(review, /extractionUrl.*approve/s);
  assert.match(review, /extractionUrl.*start/s);
  assert.match(review, /documentId !== 'undefined'/);
  assert.match(review, /attachmentId/);
  assert.match(review, /progressPercent/);
  assert.match(review, /Volver a extraer/);
  assert.match(review, /Falta/);
  assert.match(review, /Página/);
});

test('contratos concentra accesos al original y a los anexos', async () => {
  const shell = await source('../components/modules/clm/contract-shell.tsx');
  const versions = await source('../components/modules/clm/versions-manage.tsx');
  const attachments = await source('../components/modules/clm/attachments-manage.tsx');

  assert.match(shell, /label: 'Contratos'/);
  assert.doesNotMatch(shell, /label: 'Contrato original'/);
  assert.match(versions, /aria-label="Documentos del contrato"/);
  assert.match(versions, />Contrato original</);
  assert.match(versions, />Anexos y sus versiones</);
  assert.match(versions, />Subir nueva versión</);
  assert.match(attachments, /aria-label="Documentos del contrato"/);
  assert.match(attachments, />Versiones del contrato</);
  assert.match(attachments, />Anexos y sus versiones</);
  assert.match(attachments, />Subir nueva versión</);
  assert.match(versions, /ContractVersionUploadPanel/);
  assert.match(versions, /original/);
});

test('las operaciones contractuales permanecen visibles dentro de la pantalla de contratos', async () => {
  const shell = await source('../components/modules/clm/contract-shell.tsx');
  const versions = await source('../components/modules/clm/versions-manage.tsx');

  assert.doesNotMatch(shell, /<details/);
  assert.match(versions, /aria-label="Gestión del contrato"/);
  assert.match(versions, />Convenios modificatorios</);
  assert.match(versions, />Órdenes de cambio</);
  assert.match(versions, />Negociación</);
  assert.match(versions, />Firma</);
});

test('la aprobación distribuye los hallazgos en sus módulos', async () => {
  const extraction = await source('../../api/src/modules/clm/contract-extraction.service.ts');
  const ollama = await source('../../api/src/modules/ai-query/ollama-chat.service.ts');

  for (const category of [
    'penalties',
    'guarantees',
    'deliverables',
    'obligations',
    'payments',
    'milestones',
  ]) {
    assert.match(ollama, new RegExp(category));
  }
  assert.match(extraction, /getRepository\(ContractRecord\)/);
  assert.match(extraction, /penaltiesCreated/);
  assert.match(extraction, /guaranteesCreated/);
  assert.match(extraction, /getRepository\(ContractObligation\)/);
  assert.match(extraction, /getRepository\(ContractMilestone\)/);
  assert.match(extraction, /getRepository\(ContractPayment\)/);
  assert.match(extraction, /getRepository\(ContractDeliverable\)/);
});

test('existe un área final para seguimiento de entregables', async () => {
  const shell = await source('../components/modules/clm/contract-shell.tsx');
  const page = await source('../components/modules/clm/deliverables-manage.tsx');

  assert.match(shell, /label: 'Entregables'/);
  assert.match(page, /Confirmar entrega/);
  assert.match(page, /Aceptar entregable/);
  assert.match(page, /Criterios de aceptación/);
});
