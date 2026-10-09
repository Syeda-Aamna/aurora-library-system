import { Router } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { isPreviewDemoMode } from './runtime.js';

const router = Router();
const cookieName = 'aurora_admin_session';
const sessionLifetime = 12 * 60 * 60 * 1000;
const attempts = new Map();

function sessionSecret() { return process.env.SESSION_SECRET || ''; }
function sign(payload) { return createHmac('sha256', sessionSecret()).update(payload).digest('base64url'); }
function sessionToken(email) {
  const payload = Buffer.from(JSON.stringify({ email, expires: Date.now() + sessionLifetime })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
function validSession(token) {
  if (!token || sessionSecret().length < 32) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return null;
  const expected = Buffer.from(sign(payload));
  const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return data.email && data.expires > Date.now() ? data : null;
  } catch { return null; }
}
function cookieOptions(req) {
  const localHttp = ['localhost', '127.0.0.1', '::1'].includes(req.hostname) && process.env.PUBLIC_HTTPS_PREVIEW !== 'true';
  return { httpOnly: true, secure: !localHttp, sameSite: localHttp ? 'lax' : 'none', path: '/', maxAge: sessionLifetime };
}
function readCookie(req) {
  const entry = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith(`${cookieName}=`));
  return entry ? decodeURIComponent(entry.slice(cookieName.length + 1)) : '';
}
function equalSecret(a, b) {
  const left = Buffer.from(String(a)); const right = Buffer.from(String(b));
  return left.length === right.length && timingSafeEqual(left, right);
}
function rateLimited(ip) {
  const now = Date.now();
  const state = attempts.get(ip);
  if (!state || state.resetAt < now) { attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 }); return false; }
  state.count += 1;
  return state.count > 8;
}

router.get('/session', (req, res) => {
  const session = validSession(readCookie(req));
  res.json({ authenticated: Boolean(session), role: session ? 'admin' : null, email: session?.email || null });
});

router.post('/admin/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const ip = req.ip || 'unknown';
  if (rateLimited(ip)) return res.status(429).json({ error: 'Too many sign-in attempts. Wait 15 minutes and try again.' });
  const expectedEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const expectedPassword = String(process.env.ADMIN_PASSWORD || '');
  if (sessionSecret().length < 32 || !expectedEmail || !expectedPassword) return res.status(503).json({ error: 'Administrator sign-in is not configured yet.' });
  if (!equalSecret(email, expectedEmail) || !equalSecret(password, expectedPassword)) return res.status(401).json({ error: 'The email or password is incorrect.' });
  attempts.delete(ip);
  res.cookie(cookieName, sessionToken(expectedEmail), cookieOptions(req));
  res.json({ authenticated: true, role: 'admin', email: expectedEmail });
});

router.post('/admin/demo-login', (req, res) => {
  if (!isPreviewDemoMode()) return res.status(404).json({ error: 'Preview demo sign-in is unavailable.' });
  if (sessionSecret().length < 32) return res.status(503).json({ error: 'The preview session is not configured.' });
  const email = 'preview-librarian@aurora.test';
  res.cookie(cookieName, sessionToken(email), cookieOptions(req));
  res.json({ authenticated: true, role: 'admin', email, demoMode: true });
});

router.post('/logout', (req, res) => {
  const { maxAge: _maxAge, ...options } = cookieOptions(req);
  res.clearCookie(cookieName, options);
  res.json({ ok: true });
});

export function requireAdmin(req, res, next) {
  const session = validSession(readCookie(req));
  if (!session) return res.status(401).json({ error: 'Administrator sign-in is required.' });
  req.admin = { email: session.email };
  next();
}

export default router;
