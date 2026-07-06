import fs from 'fs/promises';
import path from 'path';
import mysql from 'mysql2/promise';

const mode = process.argv[2];
if (!mode || !['migrations', 'seeders'].includes(mode)) {
  console.error('Uso: node scripts/run-sql.mjs <migrations|seeders>');
  process.exit(1);
}

const root = process.cwd();
const sourceDir = mode === 'migrations' ? path.join(root, 'src', 'database', 'migrations') : path.join(root, 'src', 'database', 'seeders');

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? '',
  database: process.env.MYSQL_DATABASE ?? 'holocron',
  multipleStatements: true
});

try {
  const files = (await fs.readdir(sourceDir)).filter((file) => file.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = await fs.readFile(path.join(sourceDir, file), 'utf8');
    process.stdout.write(`Aplicando ${mode}: ${file}\n`);
    await connection.query(sql);
  }
  process.stdout.write(`Completado: ${mode}\n`);
} finally {
  await connection.end();
}
