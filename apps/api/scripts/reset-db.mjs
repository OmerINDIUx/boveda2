import mysql from 'mysql2/promise';

const database = process.env.MYSQL_DATABASE ?? 'holocron';

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? ''
});

try {
  process.stdout.write(`Recreando base de datos: ${database}\n`);
  await connection.query(`DROP DATABASE IF EXISTS \`${database}\``);
  await connection.query(
    `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  process.stdout.write(`Base recreada: ${database}\n`);
} finally {
  await connection.end();
}
