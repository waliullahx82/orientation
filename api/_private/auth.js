const crypto = require('crypto');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function getTokenSecret() {
  if (process.env.ORIENTATION_TOKEN_SECRET) return process.env.ORIENTATION_TOKEN_SECRET;
  if (process.env.VERCEL === '1' || process.env.NODE_ENV === 'production') return '';
  return 'orientation-local-dev-secret';
}

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function signPayload(payload) {
  const secret = getTokenSecret();
  if (!secret) throw new Error('Missing ORIENTATION_TOKEN_SECRET');
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('base64url');
}

function createToken(reg) {
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS).toISOString();
  const payload = base64Url(JSON.stringify({ reg, exp: expiresAt }));
  const signature = signPayload(payload);
  return { token: `${payload}.${signature}`, expiresAt };
}

function verifyToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;
  if (!payload || !signature) return null;

  let expected;
  try {
    expected = signPayload(payload);
  } catch (_) {
    return null;
  }
  const provided = Buffer.from(signature);
  const valid = Buffer.from(expected);

  if (provided.length !== valid.length || !crypto.timingSafeEqual(provided, valid)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed.reg || !parsed.exp || Date.parse(parsed.exp) <= Date.now()) return null;
    return parsed;
  } catch (_) {
    return null;
  }
}

function readBearerToken(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1] || '';
}

module.exports = { THIRTY_DAYS_MS, createToken, verifyToken, readBearerToken };
