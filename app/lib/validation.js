export const PILLARS = [
  { id: 'news', label: 'News', full: 'AI News Breakdown', color: '#3B82F6' },
  { id: 'tool', label: 'Tools', full: 'AI Tool Drop', color: '#F59E0B' },
  { id: 'income', label: 'Income', full: 'AI Income Update', color: '#10B981' },
  { id: 'transformation', label: 'Transform', full: 'AI Transformation', color: '#8B5CF6' },
  { id: 'automation', label: 'Automation', full: 'AI Automation Win', color: '#38BDF8' }
];

export const FORMATS = ['Carousel', 'Reel Script', 'Story Hook', 'Caption Only'];

export function jsonResponse(payload, status = 200) {
  return Response.json(payload, { status });
}

export function extractJson(text, type = 'object') {
  const clean = String(text || '').replace(/```json|```/g, '').trim();
  const regex = type === 'array' ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
  const match = clean.match(regex);
  if (!match) throw new Error('Model did not return valid JSON.');
  return JSON.parse(match[0]);
}

export function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeItem(item, index, pillar) {
  const normalized = {
    id: String(item.id || `${pillar}-${Date.now()}-${index}`),
    tag: String(item.tag || 'AI').slice(0, 30),
    date: String(item.date || '').slice(0, 80),
    source: String(item.source || '').slice(0, 80),
    headline: String(item.headline || '').slice(0, 180),
    summary: String(item.summary || '').slice(0, 600),
    url: String(item.url || ''),
    verified: Boolean(item.verified),
    pillar
  };
  normalized.verified = Boolean(
    normalized.verified &&
    normalized.source &&
    normalized.date &&
    normalized.headline &&
    normalized.summary &&
    isValidHttpUrl(normalized.url)
  );
  return normalized;
}

export function requireVerifiedItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Select at least one verified source item.');
  }
  const invalid = items.filter(item => !item?.verified || !isValidHttpUrl(item?.url));
  if (invalid.length) {
    throw new Error('Generation blocked: all selected items must be source-verified and include a valid URL. Refresh live content first.');
  }
}
