import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

test('README documenta instalacion, seeds y usuarios demo', async () => {
  const readme = await fs.readFile(new URL('../README.md', import.meta.url), 'utf8');
  assert.match(readme, /db:migrate/);
  assert.match(readme, /db:seed/);
  assert.match(readme, /admin@holocron\.local/);
  assert.match(readme, /viewer@holocron\.local/);
});

test('existen archivos demo para visor e IA', async () => {
  for (const file of [
    '../apps/api/storage/uploads/seed-architecture-spec.txt',
    '../apps/api/storage/uploads/seed-legal-observations.txt',
    '../apps/api/storage/uploads/seed-contract-summary.txt',
    '../apps/api/storage/uploads/seed-contract-annex.txt'
  ]) {
    const content = await fs.readFile(new URL(file, import.meta.url), 'utf8');
    assert.ok(content.length > 20);
  }
});

test('seed demo crea usuarios y datos centrales', async () => {
  const seed = await fs.readFile(new URL('../apps/api/src/database/seeders/001_demo_v1.sql', import.meta.url), 'utf8');
  assert.match(seed, /pm@holocron\.local/);
  assert.match(seed, /reviewer@holocron\.local/);
  assert.match(seed, /viewer@holocron\.local/);
  assert.match(seed, /INSERT IGNORE INTO documents/);
  assert.match(seed, /INSERT IGNORE INTO contracts/);
  assert.match(seed, /INSERT IGNORE INTO approval_requests/);
});

test('sidebar esta filtrado por permisos', async () => {
  const sidebar = await fs.readFile(new URL('../apps/web/components/layout/sidebar.tsx', import.meta.url), 'utf8');
  assert.match(sidebar, /hasPermission/);
  assert.match(sidebar, /visibleItems/);
});
