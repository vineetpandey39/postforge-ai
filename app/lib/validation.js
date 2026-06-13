export const PILLARS = [
  { id: 'news', label: 'News', full: 'AI News Breakdown', color: '#3B82F6' },
  { id: 'tool', label: 'Tools', full: 'AI Tool Drop', color: '#F59E0B' },
  { id: 'income', label: 'Income', full: 'AI Income Update', color: '#10B981' },
  { id: 'transformation', label: 'Transform', full: 'AI Transformation', color: '#8B5CF6' },
  { id: 'automation', label: 'Automation', full: 'AI Automation Win', color: '#38BDF8' }
];

export const FORMATS = ['Carousel', 'Reel Script', 'Story Hook', 'Caption Only'];
export const FRESHNESS_DAYS = 7;

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

export function parseItemDate(value) {
  const text = String(value || '').trim();
  const isoMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  const parsed = isoMatch ? new Date(`${isoMatch[0]}T00:00:00Z`) : new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getFreshness(itemDate, now = new Date(), days = FRESHNESS_DAYS) {
  const parsed = parseItemDate(itemDate);
  if (!parsed) return { fresh: false, ageDays: null, publishedAt: '' };

  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const itemUtc = Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  const ageDays = Math.floor((todayUtc - itemUtc) / 86400000);

  return {
    fresh: ageDays >= 0 && ageDays <= days,
    ageDays,
    publishedAt: new Date(itemUtc).toISOString().slice(0, 10)
  };
}

export function normalizeItem(item, index, pillar) {
  const freshness = getFreshness(item.date);
  const normalized = {
    id: String(item.id || `${pillar}-${Date.now()}-${index}`),
    tag: String(item.tag || 'AI').slice(0, 30),
    date: String(item.date || '').slice(0, 80),
    publishedAt: freshness.publishedAt,
    ageDays: freshness.ageDays,
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
    freshness.fresh &&
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
  const invalid = items.filter(item => !item?.verified || !isValidHttpUrl(item?.url) || !getFreshness(item?.publishedAt || item?.date).fresh);
  if (invalid.length) {
    throw new Error('Generation blocked: all selected items must be source-verified, include a valid URL, and be published in the last 7 days. Refresh live content first.');
  }
}
