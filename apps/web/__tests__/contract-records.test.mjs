import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('el expediente contractual expone todas las nuevas secciones', async () => {
  const shell = await read('../components/modules/clm/contract-shell.tsx');
  for (const route of [
    '/original',
    '/amendments',
    '/records/change_orders',
    '/records/claims',
    '/records/escalations',
    '/records/penalties',
    '/records/guarantees',
    '/records/retentions',
    '/records/releases',
  ]) {
    assert.match(shell, new RegExp(route.replaceAll('/', '\\/')));
  }
});

test('los registros soportan aprobación, relaciones e impacto económico', async () => {
  const service = await read('../../api/src/modules/clm/contract-records.service.ts');
  const entity = await read('../../api/src/modules/clm/entities/contract-record.entity.ts');
  assert.match(service, /async submit/);
  assert.match(service, /async decide/);
  assert.match(entity, /parentRecordId/);
  assert.match(entity, /approvalStatus/);
  assert.match(entity, /approvedAmount/);
  assert.match(entity, /approvedImpactDays/);
});
