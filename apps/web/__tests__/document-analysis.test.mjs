import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (path) => readFile(new URL(path, import.meta.url), 'utf8');

test('documentos expone transcripción e índice desde el listado y el detalle', async () => {
  const pages = await source('../components/modules/documents-pages.tsx');

  assert.match(pages, /Transcripción e índice/);
  assert.match(pages, /DocumentAnalysisPage/);
  assert.match(pages, /Índice importante/);
  assert.match(pages, /Fragmentos transcritos/);
});

test('cada carga inicia el análisis y abre su seguimiento', async () => {
  const pages = await source('../components/modules/documents-pages.tsx');

  assert.match(pages, /analysis\/reindex/);
  assert.match(pages, /router\.push\(`\/documents\/\$\{created\.id\}\/analysis`\)/);
  assert.match(pages, /router\.push\(`\/documents\/\$\{documentId\}\/analysis`\)/);
});

test('la ruta de análisis conserva el permiso de lectura documental', async () => {
  const route = await source('../app/documents/[id]/analysis/page.tsx');

  assert.match(route, /PermissionKey\.DocumentsView/);
  assert.match(route, /DocumentAnalysisPage/);
});
