const http = require('http');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const port = Number(process.env.PORT || 3001);
const jwtSecret = process.env.JWT_SECRET || 'change-me';
const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';

const db = mysql.createPool({
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT || 3306),
  database: process.env.MYSQL_DATABASE || 'holocron',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  waitForConnections: true,
  connectionLimit: 10
});

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': webOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS'
  });
  res.end(JSON.stringify(data));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function loadUserByEmail(email) {
  const [users] = await db.query('SELECT id, name, email, password_hash, active FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1', [
    email
  ]);
  const user = users[0];
  if (!user) return null;

  const [roles] = await db.query(
    `SELECT roles.id, roles.\`key\`, roles.name
     FROM roles
     INNER JOIN role_user ON role_user.role_id = roles.id
     WHERE role_user.user_id = ? AND roles.deleted_at IS NULL`,
    [user.id]
  );
  const [permissions] = await db.query(
    `SELECT DISTINCT permissions.\`key\`
     FROM permissions
     INNER JOIN role_permissions ON role_permissions.permission_id = permissions.id
     INNER JOIN role_user ON role_user.role_id = role_permissions.role_id
     WHERE role_user.user_id = ?`,
    [user.id]
  );

  return { ...user, roles, permissions: permissions.map((permission) => permission.key) };
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: user.roles.map((role) => role.key),
    permissions: user.permissions
  };
}

function readAuth(req) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return null;

  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

async function handle(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});

  if (req.method === 'POST' && req.url === '/api/auth/login') {
    const body = await readJson(req);
    const user = await loadUserByEmail(body.email || '');
    if (!user || !user.active || !(await bcrypt.compare(body.password || '', user.password_hash))) {
      return send(res, 401, { message: 'Credenciales invalidas' });
    }

    const payload = publicUser(user);
    return send(res, 200, { accessToken: jwt.sign(payload, jwtSecret, { expiresIn: '8h' }), user: payload });
  }

  if (req.method === 'POST' && req.url === '/api/auth/logout') {
    if (!readAuth(req)) return send(res, 401, { message: 'No autenticado' });
    return send(res, 200, { ok: true });
  }

  if (req.method === 'GET' && req.url === '/api/users/me') {
    const session = readAuth(req);
    if (!session) return send(res, 401, { message: 'No autenticado' });
    const user = await loadUserByEmail(session.email);
    if (!user?.active) return send(res, 401, { message: 'Usuario inactivo' });
    return send(res, 200, publicUser(user));
  }

  return send(res, 404, { message: 'Ruta no encontrada' });
}

http
  .createServer((req, res) => {
    handle(req, res).catch((error) => {
      console.error(error);
      send(res, 500, { message: 'Error interno' });
    });
  })
  .listen(port, () => {
    console.log(`Holocron API dev server listo en http://localhost:${port}/api`);
  });
