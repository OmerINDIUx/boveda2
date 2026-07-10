import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

const email = process.argv[2] || 'admin@holocron.local';
const password = process.argv[3] || 'Holocron123!';

const hash = await bcrypt.hash(password, 12);
console.log(`New hash for password "${password}":`, hash);

const conn = await mysql.createConnection({
  host: '127.0.0.1', port: 3306, user: 'root',
  password: '', database: 'holocron'
});
const [result] = await conn.query('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?', [hash, email]);
console.log(`Updated password for ${email}. Affected rows:`, result.affectedRows);
await conn.end();
