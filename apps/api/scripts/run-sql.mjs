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
  // Ensure migration tracking table exists
  await connection.query(`CREATE TABLE IF NOT EXISTS _migrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);

  if (mode === 'migrations') {
    const [rows] = await connection.query('SELECT filename FROM _migrations');
    const applied = new Set(rows.map(r => r.filename));

    const files = (await fs.readdir(sourceDir))
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        process.stdout.write(`Saltando ${file} (ya aplicado)\n`);
        continue;
      }
      const sql = await fs.readFile(path.join(sourceDir, file), 'utf8');
      process.stdout.write(`Aplicando ${mode}: ${file}\n`);
      try {
        await connection.query(sql);
      } catch (err) {
        // If table/column already exists, skip; otherwise rethrow
        if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_COLUMN_DUPLICATE' || err.code === 'ER_DUP_KEYNAME' || (err.errno === 1050) || (err.errno === 1060) || (err.errno === 1061)) {
          process.stdout.write(`  ↳ Saltado (ya existe): ${err.sqlMessage}\n`);
        } else {
          throw err;
        }
      }
      await connection.query('INSERT INTO _migrations (filename) VALUES (?)', [file]);
    }
  } else {
    // Seeders run all every time
    const files = (await fs.readdir(sourceDir)).filter((file) => file.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = await fs.readFile(path.join(sourceDir, file), 'utf8');
      process.stdout.write(`Aplicando ${mode}: ${file}\n`);
      await connection.query(sql);
    }
  }
  process.stdout.write(`Completado: ${mode}\n`);
} finally {
  await connection.end();
}
