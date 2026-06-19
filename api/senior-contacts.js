const { SENIOR_EMAILS } = require('./_private/data');
const { readBearerToken, verifyToken } = require('./_private/auth');

function send(res, status, body) {
  res.status(status).json(body);
}

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return send(res, 405, { ok: false, message: 'Method not allowed.' });
  }

  const session = verifyToken(readBearerToken(req));

  if (!session) {
    return send(res, 401, { ok: false, message: 'Verification is required.' });
  }

  return send(res, 200, { ok: true, contacts: SENIOR_EMAILS });
};
