const { JUNIORS } = require('./_private/data');
const { createToken } = require('./_private/auth');

function send(res, status, body) {
  res.status(status).json(body);
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body !== 'string') return {};

  try {
    return JSON.parse(req.body);
  } catch (_) {
    return {};
  }
}

module.exports = function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return send(res, 405, { ok: false, message: 'Method not allowed.' });
  }

  const body = readBody(req);
  const reg = String(body.reg || '').replace(/\D/g, '');

  if (!reg || !JUNIORS[reg]) {
    return send(res, 404, {
      ok: false,
      message: 'We could not verify that registration number. Please check it and try again.',
    });
  }

  let token;
  let expiresAt;
  try {
    ({ token, expiresAt } = createToken(reg));
  } catch (_) {
    return send(res, 503, {
      ok: false,
      message: 'Verification is not configured yet. Please try again later.',
    });
  }

  return send(res, 200, { ok: true, name: JUNIORS[reg], token, expiresAt });
};
