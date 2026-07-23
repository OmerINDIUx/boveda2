import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { URL } from 'node:url';

async function source(relativePath) {
  return readFile(new URL(relativePath, import.meta.url), 'utf8');
}

test('el detalle muestra carga, error recuperable y datos parciales', async () => {
  const detail = await source('../components/modules/clm/detail.tsx');

  assert.match(detail, /Skeleton/);
  assert.match(detail, /Reintentar/);
  assert.match(detail, /sectionErrors/);
  assert.doesNotMatch(detail, /buildFallbackDetail/);
});

test('los módulos presentan errores independientes sin ocultar el resto del contrato', async () => {
  const modules = await Promise.all([
    source('../components/modules/clm/attachments-manage.tsx'),
    source('../components/modules/clm/versions-manage.tsx'),
    source('../components/modules/clm/payments-workspace.tsx'),
    source('../components/modules/clm/negotiations-manage.tsx'),
    source('../components/modules/clm/compliance-manage.tsx'),
  ]);

  modules.forEach((contents) => assert.match(contents, /SectionLoadWarning/));
});

test('pagos integra la sincronización ERP y las rutas usan los módulos activos', async () => {
  const payments = await source('../components/modules/clm/payments-workspace.tsx');
  const paymentRoute = await source('../app/clm/[id]/payments/page.tsx');
  const detailRoute = await source('../app/clm/[id]/page.tsx');

  assert.match(payments, /sync-erp/);
  assert.match(payments, /erpSyncStatus/);
  assert.match(paymentRoute, /PaymentsWorkspace/);
  assert.match(detailRoute, /ContractDetailPage/);
});

test('el alta de contrato usa los campos simplificados y renovación condicional', async () => {
  const form = await source('../components/modules/clm/form.tsx');

  assert.match(form, /\{p\.name\}/);
  assert.doesNotMatch(form, /\{p\.code\} · \{p\.name\}/);
  assert.match(form, /label="Nombre del contrato"/);
  assert.match(form, /label="Proveedor interno"/);
  assert.match(form, /¿Necesita renovación\?/);
  assert.match(form, /\{form\.renewable \? \(/);
  assert.match(form, /label="Fecha de renovación"/);
  assert.match(form, /label="Días de preaviso"/);
  assert.match(form, /label="Monto \(opcional\)"/);
  assert.match(form, /amount: '0'/);
  assert.doesNotMatch(form, /label="Tipo"/);
  assert.doesNotMatch(form, /Contrato padre \(id\)/);
  assert.doesNotMatch(form, /selectedTagIds|\/tags/);
});
