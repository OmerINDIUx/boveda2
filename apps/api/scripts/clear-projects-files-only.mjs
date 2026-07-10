import { readFile } from 'fs/promises';
import { join } from 'path';
import mysql from 'mysql2/promise';

const envPath = join(process.cwd(), '.env');
const envRaw = await readFile(envPath, 'utf8').catch(() => '');
const env = Object.fromEntries(
  envRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const connection = await mysql.createConnection({
  host: env.MYSQL_HOST || '127.0.0.1',
  port: Number(env.MYSQL_PORT || 3306),
  user: env.MYSQL_USER || 'root',
  password: env.MYSQL_PASSWORD || '',
  database: env.MYSQL_DATABASE || 'holocron',
  multipleStatements: false,
});

const tables = [
  'response_time_records',
  'email_workflow_actions',
  'sla_definitions',
  'project_email_attachments',
  'project_emails',
  'project_email_threads',
  'project_email_addresses',
  'bulk_upload_items',
  'bulk_uploads',
  'upload_catalogs',
  'document_embeddings',
  'document_chunks',
  'document_classifications',
  'document_entities',
  'document_qa_cache',
  'document_query_history',
  'document_comments',
  'document_audit_logs',
  'document_permissions',
  'document_metadata',
  'document_suggested_questions',
  'document_summaries',
  'approval_request_actions',
  'approval_requests',
  'approval_steps',
  'approval_workflows',
  'rfi_attachments',
  'rfi_history',
  'rfi_comments',
  'rfis',
  'rfi_templates',
  'nomenclature_counters',
  'nomenclature_rules',
  'contract_tags',
  'contract_custom_values',
  'contract_signature_requests',
  'contract_negotiations',
  'contract_amendments',
  'contract_payments',
  'contract_attachments',
  'contract_comments',
  'contract_milestones',
  'contract_obligations',
  'contract_audit_logs',
  'contract_versions',
  'contract_import_logs',
  'contracts',
  'document_versions',
  'documents',
  'folders',
  'project_users',
  'projects',
];

try {
  const [rows] = await connection.query('SHOW TABLES');
  const existing = new Set(
    rows.map((row) => {
      const [value] = Object.values(row);
      return value;
    })
  );
  const targets = tables.filter((table) => existing.has(table));

  await connection.query('SET FOREIGN_KEY_CHECKS = 0');

  const summary = [];
  for (const table of targets) {
    const [[before]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
    await connection.query(`DELETE FROM \`${table}\``);
    const [[after]] = await connection.query(`SELECT COUNT(*) AS count FROM \`${table}\``);
    summary.push({ table, before: Number(before.count), after: Number(after.count) });
  }

  await connection.query('SET FOREIGN_KEY_CHECKS = 1');

  console.log(JSON.stringify({ database: env.MYSQL_DATABASE || 'holocron', summary }, null, 2));
} finally {
  await connection.end();
}
