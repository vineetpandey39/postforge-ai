import { jsonResponse } from './validation';

function safeCompare(a, b) {
  const left = String(a || '');
  const right = String(b || '');
  if (!left || !right || left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

function hostFrom(value) {
  try {
    return new URL(value).host;
  } catch {
    return '';
  }
}

function isSameOriginBrowserRequest(request) {
  const host = request.headers.get('host') || '';
  const originHost = hostFrom(request.headers.get('origin') || '');
  const refererHost = hostFrom(request.headers.get('referer') || '');
  const fetchSite = request.headers.get('sec-fetch-site') || '';

  return Boolean(
    host &&
    (originHost === host || refererHost === host) &&
    ['same-origin', 'none', ''].includes(fetchSite)
  );
}

export function requirePostforgeAccess(request) {
  const secret = process.env.POSTFORGE_API_SECRET;
  if (!secret) return null;

  const provided = request.headers.get('x-postforge-secret') || request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (safeCompare(provided, secret)) return null;
  if (isSameOriginBrowserRequest(request)) return null;

  return jsonResponse({ error: 'Unauthorized PostForge API request.' }, 401);
}
