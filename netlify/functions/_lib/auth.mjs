// Autenticación del panel: usuarios con hash scrypt en ADMIN_USERS y tokens firmados con ADMIN_SECRET.
import crypto from 'node:crypto';

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

function secret() {
  const s = process.env.ADMIN_SECRET;
  if (!s || s.length < 32) throw new Error('ADMIN_SECRET no configurado');
  return s;
}

function users() {
  try {
    return JSON.parse(process.env.ADMIN_USERS || '{}');
  } catch {
    return {};
  }
}

// Formato del hash: scrypt$<salt base64>$<hash base64>
export function hashPassword(password, salt = crypto.randomBytes(16)) {
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(username, password) {
  const all = users();
  const key = Object.keys(all).find((u) => u.toLowerCase() === String(username || '').toLowerCase());
  // Calcula un hash aunque el usuario no exista para no revelar qué usuarios existen por tiempo de respuesta
  const stored = key ? all[key] : hashPassword('x');
  const [, saltB64, hashB64] = stored.split('$');
  const expected = Buffer.from(hashB64, 'base64');
  const actual = crypto.scryptSync(String(password || ''), Buffer.from(saltB64, 'base64'), 64);
  const ok = crypto.timingSafeEqual(expected, actual);
  return ok && key ? key : null;
}

export function signToken(username) {
  const payload = b64url(JSON.stringify({ u: username, exp: Date.now() + TOKEN_TTL_MS }));
  const sig = b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = b64url(crypto.createHmac('sha256', secret()).update(payload).digest());
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    if (!users()[data.u]) return null;
    return data.u;
  } catch {
    return null;
  }
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

// Devuelve el usuario autenticado o una Response 401 lista para devolver
export function requireUser(req) {
  const header = req.headers.get('authorization') || '';
  const user = verifyToken(header.replace(/^Bearer\s+/i, ''));
  return user || json({ error: 'Sesión expirada. Vuelve a entrar.' }, 401);
}
