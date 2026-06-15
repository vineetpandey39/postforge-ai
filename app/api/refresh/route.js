import { requirePostforgeAccess } from '../../lib/access';
import { extractJson, FRESHNESS_DAYS, getFreshness, isValidHttpUrl, parseItemDate, PILLAR_FRESHNESS_DAYS, jsonResponse, normalizeItem } from '../../lib/validation';

export const maxDuration = 120;

const SOURCE_HINTS = 'official company blogs OR Reuters OR The Verge OR TechCrunch OR VentureBeat OR CNBC OR Bloomberg OR Google Blog OR OpenAI Blog OR Anthropic News OR Meta AI Blog OR Microsoft Blog';
const AI_MARKET = 'OpenAI OR Anthropic Claude OR Google Gemini DeepMind OR Meta AI Llama OR Microsoft Copilot OR xAI Grok OR Perplexity OR Mistral OR Cohere OR Runway OR ElevenLabs OR Stability AI';

const QUERIES = {
  news: `latest AI announcements from multiple companies in the last 7 days (${AI_MARKET}) ${SOURCE_HINTS}`,
  tool: `AI tool launches and major AI creator tool updates published in the last 14 days (${AI_MARKET}) ${SOURCE_HINTS}`,
  income: `AI creator economy income case study real numbers published in the last 90 days credible source`,
  transformation: `AI workplace productivity career transformation study or report published in the last 90 days credible source`,
  automation: `AI automation workflow case study time saved cost saved published in the last 90 days credible source`
};

const TARGETED_QUERIES = {
  news: [
    'Anthropic Claude official AI news announcement last 7 days',
    'Google Gemini DeepMind AI announcement last 7 days',
    'Meta AI Llama announcement last 7 days',
    'Microsoft Copilot AI announcement last 7 days',
    'OpenAI official AI announcement last 7 days',
    'Perplexity Mistral Cohere Runway ElevenLabs AI announcement last 7 days',
    'Reuters The Verge TechCrunch latest artificial intelligence company news last 7 days'
  ],
  tool: [
    'Anthropic Claude AI tool update launch last 14 days',
    'Google Gemini AI tool update launch last 14 days',
    'Meta AI Llama AI tool update launch last 14 days',
    'Microsoft Copilot AI tool update launch last 14 days',
    'OpenAI ChatGPT Codex AI tool update launch last 14 days',
    'Perplexity Mistral Cohere Runway ElevenLabs AI tool launch last 14 days'
  ]
};

const refreshCache = globalThis.__postforgeRefreshCache || new Map();
globalThis.__postforgeRefreshCache = refreshCache;

const COMPANY_ALIASES = [
  ['anthropic', ['anthropic', 'claude']],
  ['openai', ['openai', 'chatgpt', 'codex']],
  ['google', ['google', 'gemini', 'deepmind']],
  ['meta', ['meta ai', 'llama', 'meta']],
  ['microsoft', ['microsoft', 'copilot']],
  ['xai', ['xai', 'grok']],
  ['perplexity', ['perplexity']],
  ['mistral', ['mistral']],
  ['cohere', ['cohere']],
  ['runway', ['runway']],
  ['elevenlabs', ['elevenlabs', 'eleven labs']],
  ['stability', ['stability ai', 'stable diffusion']]
];

const EVERGREEN_PATH_HINTS = [
  '/products/',
  '/product/',
  '/models/',
  '/model/',
  '/grok',
  '/chatgpt',
  '/claude',
  '/gemini',
  '/copilot'
];

const DATE_META_PATTERNS = [
  /property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i,
  /name=["']date["'][^>]*content=["']([^"']+)["']/i,
  /name=["']pubdate["'][^>]*content=["']([^"']+)["']/i,
  /itemprop=["']datePublished["'][^>]*content=["']([^"']+)["']/i,
  /"datePublished"\s*:\s*"([^"]+)"/i,
  /<time[^>]*datetime=["']([^"']+)["']/i,
  /last updated(?: on)?\s*[:\-]?\s*([a-z]+\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2})/i,
  /published(?: on)?\s*[:\-]?\s*([a-z]+\s+\d{1,2},\s+\d{4}|\d{1,2}\s+[a-z]+\s+\d{4}|\d{4}-\d{2}-\d{2})/i
];

function intEnv(name, fallback) {
  const parsed = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function daySeed(today) {
  return Math.floor((Date.parse(today) || Date.now()) / 86400000);
}

function rotate(values, offset) {
  if (!values.length) return [];
  return values.map((_, index) => values[(index + offset) % values.length]);
}

function queryBudgetFor(pillar) {
  const fallback = pillar === 'news' || pillar === 'tool' ? 3 : 1;
  return intEnv('POSTFORGE_REFRESH_SEARCH_BUDGET', fallback);
}

function fallbackBudgetFor() {
  return intEnv('POSTFORGE_REFRESH_FALLBACK_SEARCH_BUDGET', 2);
}

function selectQueries(pillar, today, usedQueries = new Set(), extra = false) {
  const primary = QUERIES[pillar] || QUERIES.news;
  const targeted = TARGETED_QUERIES[pillar] || [];
  const budget = extra ? fallbackBudgetFor() : queryBudgetFor(pillar);
  const rotated = rotate(targeted, daySeed(today) % Math.max(targeted.length, 1));
  const candidates = extra ? rotated : [primary, ...rotated];
  return candidates.filter(query => !usedQueries.has(query)).slice(0, budget);
}

function cacheKey({ pillar, since, today }) {
  return `${pillar}:${since}:${today}`;
}

function getCachedRefresh(key) {
  const cacheMinutes = intEnv('POSTFORGE_REFRESH_CACHE_MINUTES', 45);
  const cached = refreshCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.createdAt > cacheMinutes * 60000) {
    refreshCache.delete(key);
    return null;
  }
  return cached.payload;
}

function setCachedRefresh(key, payload) {
  refreshCache.set(key, { createdAt: Date.now(), payload });
  if (refreshCache.size > 40) {
    const oldestKey = refreshCache.keys().next().value;
    refreshCache.delete(oldestKey);
  }
}

function companyKey(item) {
  const haystack = `${item.company || ''} ${item.source || ''} ${item.headline || ''} ${item.summary || ''}`.toLowerCase();
  const match = COMPANY_ALIASES.find(([, aliases]) => aliases.some(alias => haystack.includes(alias)));
  return match?.[0] || String(item.source || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
}

function diversifyItems(items, limit = 6, perCompany = 2) {
  const counts = new Map();
  const diverse = [];
  const overflow = [];

  items.forEach(item => {
    const key = companyKey(item);
    const count = counts.get(key) || 0;
    if (count < perCompany) {
      counts.set(key, count + 1);
      diverse.push(item);
    } else {
      overflow.push(item);
    }
  });

  return [...diverse, ...overflow].slice(0, limit);
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = `${String(item.url || '').toLowerCase()}|${String(item.headline || '').toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(html) {
  const title = String(html || '').match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';
  return stripHtml(title).slice(0, 220);
}

function extractEvidenceDate(html) {
  const source = String(html || '').slice(0, 240000);
  for (const pattern of DATE_META_PATTERNS) {
    const match = source.match(pattern);
    if (match?.[1]) {
      const parsed = parseItemDate(match[1]);
      if (parsed) return parsed.toISOString().slice(0, 10);
    }
  }
  return '';
}

function meaningfulTokens(value) {
  const stop = new Set(['the', 'and', 'for', 'with', 'from', 'into', 'that', 'this', 'will', 'soon', 'new', 'latest', 'launches', 'launch', 'announces', 'announced', 'introduces', 'unveils', 'adds', 'major', 'could', 'your', 'about']);
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2 && !stop.has(token));
}

function textOverlapScore(needle, haystack) {
  const tokens = [...new Set(meaningfulTokens(needle))].slice(0, 18);
  if (!tokens.length) return 0;
  const page = String(haystack || '').toLowerCase();
  const hits = tokens.filter(token => page.includes(token)).length;
  return hits / tokens.length;
}

function looksEvergreen(item) {
  try {
    const url = new URL(item.url);
    const path = url.pathname.toLowerCase().replace(/\/+$/, '');
    const headline = String(item.headline || '').toLowerCase();
    const launchy = /\b(launch|launches|unveil|unveils|announce|announces|introduced|introduces|dropped|released)\b/.test(headline);
    return launchy && EVERGREEN_PATH_HINTS.some(hint => path === hint || path.endsWith(hint) || path.includes(`${hint}/`));
  } catch {
    return false;
  }
}

async function verifySourceItem(item, pillar, freshnessDays) {
  if (!item.verified || !isValidHttpUrl(item.url)) {
    return { ...item, verified: false, verificationReason: 'Missing verified source URL.' };
  }

  try {
    const res = await fetch(item.url, {
      headers: {
        'User-Agent': 'PostForgeAI/1.0 source verifier',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(9000)
    });

    if (!res.ok) {
      return { ...item, verified: false, verificationReason: `Source returned HTTP ${res.status}.` };
    }

    const html = await res.text();
    const pageText = stripHtml(html).slice(0, 120000);
    const title = extractTitle(html);
    const evidenceDate = extractEvidenceDate(html);
    const itemFreshness = getFreshness(item.publishedAt || item.date, new Date(), freshnessDays);
    const evidenceFreshness = evidenceDate ? getFreshness(evidenceDate, new Date(), freshnessDays) : null;
    const headlineScore = textOverlapScore(item.headline, `${title} ${pageText}`);
    const summaryScore = textOverlapScore(item.summary, pageText);
    const evergreen = looksEvergreen(item);

    if (evergreen && !evidenceDate) {
      return { ...item, verified: false, verificationReason: 'Rejected evergreen product page presented as a fresh launch.' };
    }

    if (!itemFreshness.fresh) {
      return { ...item, verified: false, verificationReason: 'Claimed item date is outside the freshness window.' };
    }

    if (evidenceDate && !evidenceFreshness?.fresh) {
      return { ...item, verified: false, verificationReason: `Source page date ${evidenceDate} is outside the freshness window.` };
    }

    if (!evidenceDate && (pillar === 'news' || pillar === 'tool')) {
      return { ...item, verified: false, verificationReason: 'No publish/update date found on the source page.' };
    }

    if (headlineScore < 0.28 || summaryScore < 0.18) {
      return { ...item, verified: false, verificationReason: 'Source page does not sufficiently support the headline/summary.' };
    }

    return {
      ...item,
      date: evidenceDate || item.date,
      publishedAt: evidenceDate || item.publishedAt,
      verified: true,
      verification: {
        sourceChecked: true,
        sourceTitle: title,
        sourceDate: evidenceDate || item.publishedAt,
        headlineScore: Number(headlineScore.toFixed(2)),
        summaryScore: Number(summaryScore.toFixed(2))
      }
    };
  } catch (error) {
    return { ...item, verified: false, verificationReason: `Source verification failed: ${error.message}` };
  }
}

async function verifySourceItems(items, pillar, freshnessDays) {
  const checked = [];
  for (const item of items) {
    checked.push(await verifySourceItem(item, pillar, freshnessDays));
  }
  return checked;
}

async function repairSearchJson({ openaiKey, rawText, pillarFull, since, today }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Convert the supplied research text into strict JSON only. Return {"items":[...]} with only source-backed items published from ${since} through ${today}. If the text has no reliable items, return {"items":[]}.`
        },
        {
          role: 'user',
          content: `Pillar: ${pillarFull}\n\nResearch text:\n${String(rawText || '').slice(0, 12000)}\n\nEach item needs: id, tag, company, date, source, headline, summary, url, verified.`
        }
      ]
    })
  });

  if (!res.ok) return [];
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || '{"items":[]}';
  const parsed = JSON.parse(content);
  return Array.isArray(parsed) ? parsed : parsed.items || [];
}

async function fetchCandidates({ openaiKey, query, pillarFull, since, today, limit = 6 }) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-search-preview',
      web_search_options: {},
      messages: [
        {
          role: 'system',
          content: `You are a strict fact-checking researcher for an Instagram AI content tool. Today is ${today}. Return only real, source-backed items published from ${since} through ${today}. For news/tool tabs prefer official announcements and reputable publications. Do not include rumors, fictional model names, unverified claims, recycled old launches, undated posts, or articles outside this date window. Return raw JSON only.`
        },
        {
          role: 'user',
          content: `Search query: ${query}\n\nReturn up to ${limit} candidate items for "${pillarFull}". Each item must be JSON with: id, tag, company, date, source, headline, summary, url, verified.\nRules:\n- url must be the exact article/source URL.\n- date must be the actual publish/announcement date, not today's date unless actually published today.\n- verified must be true only if the claim is supported by the URL.\n- If fewer reliable items exist, return fewer.\n- Return ONLY a JSON array.`
        }
      ]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI refresh failed ${res.status}: ${err.slice(0, 240)}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  try {
    return extractJson(text, 'array');
  } catch {
    return repairSearchJson({ openaiKey, rawText: text, pillarFull, since, today });
  }
}

export async function POST(request) {
  try {
    const blocked = requirePostforgeAccess(request);
    if (blocked) return blocked;

    const { pillar = 'news', pillarFull = 'AI Content', force = false } = await request.json();
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return jsonResponse({ error: 'OPENAI_API_KEY is not configured.' }, 500);

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const freshnessDays = PILLAR_FRESHNESS_DAYS[pillar] || FRESHNESS_DAYS;
    const since = new Date(now.getTime() - freshnessDays * 86400000).toISOString().slice(0, 10);
    const key = cacheKey({ pillar, since, today });
    const cached = force ? null : getCachedRefresh(key);
    if (cached) {
      return jsonResponse({ ...cached, cached: true });
    }

    const usedQueries = new Set();
    const queries = selectQueries(pillar, today, usedQueries);
    queries.forEach(query => usedQueries.add(query));
    let candidateGroups = await Promise.all(
      queries.map(query => fetchCandidates({ openaiKey, query, pillarFull, since, today, limit: pillar === 'news' || pillar === 'tool' ? 4 : 8 }).catch(() => []))
    );
    let parsed = uniqueItems(candidateGroups.flat());
    let normalized = parsed.map((item, index) => normalizeItem(item, index, pillar, freshnessDays));
    let verified = await verifySourceItems(normalized, pillar, freshnessDays);
    let items = diversifyItems(verified.filter(item => item.verified), 6, pillar === 'news' || pillar === 'tool' ? 2 : 3);
    let staleCount = verified.filter(item => !item.verified).length;

    if (items.length < 3) {
      const fallbackQueries = selectQueries(pillar, today, usedQueries, true);
      fallbackQueries.forEach(query => usedQueries.add(query));
      if (fallbackQueries.length) {
        const fallbackGroups = await Promise.all(
          fallbackQueries.map(query => fetchCandidates({ openaiKey, query, pillarFull, since, today, limit: 4 }).catch(() => []))
        );
        candidateGroups = [...candidateGroups, ...fallbackGroups];
        parsed = uniqueItems(candidateGroups.flat());
        normalized = parsed.map((item, index) => normalizeItem(item, index, pillar, freshnessDays));
        verified = await verifySourceItems(normalized, pillar, freshnessDays);
        items = diversifyItems(verified.filter(item => item.verified), 6, pillar === 'news' || pillar === 'tool' ? 2 : 3);
        staleCount = verified.filter(item => !item.verified).length;
      }
    }

    if (!items.length) {
      return jsonResponse({ error: `No verified items from the last ${freshnessDays} days found. ${staleCount ? `${staleCount} stale or unverified result(s) were rejected.` : 'Try another pillar or refresh later.'}` }, 404);
    }

    const payload = {
      items,
      refreshedAt: new Date().toISOString(),
      since,
      freshnessDays,
      rejected: staleCount,
      sourceChecked: true,
      cached: false,
      searchCalls: usedQueries.size
    };
    setCachedRefresh(key, payload);
    return jsonResponse(payload);
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
