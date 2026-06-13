import { extractJson, FRESHNESS_DAYS, PILLAR_FRESHNESS_DAYS, jsonResponse, normalizeItem } from '../../lib/validation';

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

export async function POST(request) {
  try {
    const { pillar = 'news', pillarFull = 'AI Content' } = await request.json();
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return jsonResponse({ error: 'OPENAI_API_KEY is not configured.' }, 500);

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const freshnessDays = PILLAR_FRESHNESS_DAYS[pillar] || FRESHNESS_DAYS;
    const since = new Date(now.getTime() - freshnessDays * 86400000).toISOString().slice(0, 10);
    const query = QUERIES[pillar] || QUERIES.news;

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
            content: `You are a strict fact-checking researcher for an Instagram AI content tool. Today is ${today}. Return only real, source-backed items published from ${since} through ${today}. For news/tool tabs prefer announcements across the whole AI market: Anthropic/Claude, Google/Gemini, Meta/Llama, Microsoft/Copilot, xAI/Grok, Perplexity, Mistral, Cohere, Runway, ElevenLabs, Stability AI, and OpenAI. Do not over-sample OpenAI; use at most 2 items from any one company unless there are no other fresh verified items. For income/transformation/automation prefer credible source-backed case studies, reports, and real examples. Do not include rumors, fictional model names, unverified claims, recycled old launches, undated posts, or articles outside this date window. Prefer primary sources and reputable publications. Return raw JSON only.`
          },
          {
            role: 'user',
            content: `Search query: ${query}\n\nReturn up to 8 candidate items for the pillar "${pillarFull}" so the app can choose a diverse top 6. Each item must be JSON with: id, tag, company, date, source, headline, summary, url, verified.\nRules:\n- For News and Tools, include multiple AI companies when fresh verified items exist. Target 1 item each from Anthropic/Claude, Google/Gemini, Meta/Llama, Microsoft/Copilot, xAI/Grok, Perplexity, Mistral/Cohere/Runway/ElevenLabs, and OpenAI.\n- Never return more than 2 items from the same company.\n- url must be the exact article/source URL.\n- date must be the actual publish/announcement date, not today's date unless actually published today.\n- verified must be true only if the claim is supported by the URL.\n- If fewer than 6 reliable items exist, return fewer.\n- Return ONLY a JSON array.`
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
    let parsed;
    try {
      parsed = extractJson(text, 'array');
    } catch {
      parsed = await repairSearchJson({ openaiKey, rawText: text, pillarFull, since, today });
    }
    const normalized = parsed.map((item, index) => normalizeItem(item, index, pillar, freshnessDays));
    const items = diversifyItems(normalized.filter(item => item.verified), 6, pillar === 'news' || pillar === 'tool' ? 2 : 3);
    const staleCount = normalized.filter(item => !item.verified).length;

    if (!items.length) {
      return jsonResponse({ error: `No verified items from the last ${freshnessDays} days found. ${staleCount ? `${staleCount} stale or unverified result(s) were rejected.` : 'Try another pillar or refresh later.'}` }, 404);
    }

    return jsonResponse({ items, refreshedAt: new Date().toISOString(), since, freshnessDays, rejected: staleCount });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
