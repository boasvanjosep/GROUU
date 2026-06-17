const MAX_BODY_BYTES = 4 * 1024 * 1024;

const isAllowedGasUrl = (value) => {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'script.google.com' &&
      url.pathname.startsWith('/macros/s/') &&
      url.pathname.endsWith('/exec')
    );
  } catch {
    return false;
  }
};

const sendJson = (res, status, body) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(status).json(body);
};

export default async function handler(req, res) {
  const selfHost = req.headers['host'] || '';
  const origin = req.headers['origin'];
  const referer = req.headers['referer'] || req.headers['referrer'];

  // Default Deny: request tanpa Origin maupun Referer (cURL, Postman, dll) ditolak.
  if (!origin && !referer) {
    return sendJson(res, 403, {
      success: false,
      error: 'Akses ditolak: header Origin/Referer tidak ditemukan.'
    });
  }

  // Host-matching checks removed to prevent false positives in Vercel production
  // Vercel can sometimes route requests through internal domains or x-forwarded-host
  // causing mismatch between origin/referer and req.headers['host'].

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return sendJson(res, 204, {});
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    return sendJson(res, 413, { success: false, error: 'Payload too large (Header check).' });
  }

  const actualBodyLength = JSON.stringify(req.body || {}).length;
  if (actualBodyLength > MAX_BODY_BYTES) {
    return sendJson(res, 413, { success: false, error: 'Payload too large (Body check).' });
  }

  const { gasUrl, payload, grouuToken } = req.body || {};

  if (!isAllowedGasUrl(gasUrl)) {
    return sendJson(res, 400, { success: false, error: 'Invalid Google Apps Script URL.' });
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return sendJson(res, 400, { success: false, error: 'Invalid request payload.' });
  }

  if (!grouuToken || typeof grouuToken !== 'string' || !grouuToken.trim()) {
    return sendJson(res, 401, { success: false, error: 'Unauthorized: grouuToken is required.' });
  }

  const upstreamPayload = { ...payload, grouuToken };

  const upstream = await fetch(gasUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
      'Accept': 'application/json, text/plain;q=0.9',
    },
    body: JSON.stringify(upstreamPayload),
    redirect: 'follow',
  });

  const text = await upstream.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = { raw: 'Non-JSON response from upstream.' };
  }

  if (!upstream.ok) {
    return sendJson(res, upstream.status, {
      success: false,
      error: `Apps Script returned HTTP ${upstream.status}.`,
      data: parsed,
    });
  }

  if (parsed && typeof parsed === 'object' && 'success' in parsed) {
    return sendJson(res, 200, parsed);
  }

  return sendJson(res, 200, { success: true, data: parsed });
}