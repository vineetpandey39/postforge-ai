import { extractJson, FRESHNESS_DAYS, jsonResponse, normalizeItem } from '../../lib/validation';

export const maxDuration = 120;

const SOURCE_HINTS = 'official company blog OR Reuters OR The Verge OR TechCrunch OR VentureBeat OR CNBC OR Bloomberg OR Google Blog OR OpenAI Blog OR Anthropic News OR Meta AI Blog OR Microsoft Blog';

const QUERIES = {
  news: `AI company announcements and AI product news published in the last 7 days ${SOURCE_HINTS}`,
  tool: `AI tool launches for creators automation video image coding published in the last 7 days ${SOURCE_HINTS}`,
  income: `AI creator economy income case study with real numbers published in the last 7 days credible source`,
  transformation: `AI workplace productivity or career transformation study published in the last 7 days credible source`,
  automation: `AI automation workflow case study time saved cost saved published in the last 7 days credible source`
};

export async function POST(request) {
  try {
    const { pillar = 'news', pillarFull = 'AI Content' } = await request.json();
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return jsonResponse({ error: 'OPENAI_API_KEY is not configured.' }, 500);

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const since = new Date(now.getTime() - FRESHNESS_DAYS * 86400000).toISOString().slice(0, 10);
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
            content: `You are a strict fact-checking researcher for an Instagram AI content tool. Today is ${today}. Return only real, source-backed items published from ${since} through ${today}. Do not include rumors, fictional model names, unverified claims, recycled old launches, undated posts, or articles outside this date window. Prefer primary sources and reputable publications. Return raw JSON only.`
          },
          {
            role: 'user',
            content: `Search query: ${query}\n\nReturn up to 6 items for the pillar "${pillarFull}". Each item must be JSON with: id, tag, date, source, headline, summary, url, verified.\nRules:\n- url must be the exact article/source URL.\n- date must be the actual publish/announcement date, not today's date unless actually published today.\n- verified must be true only if the claim is supported by the URL.\n- If fewer than 6 reliable items exist, return fewer.\n- Return ONLY a JSON array.`
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
    const parsed = extractJson(text, 'array');
    const normalized = parsed.map((item, index) => normalizeItem(item, index, pillar));
    const items = normalized.filter(item => item.verified).slice(0, 6);
    const staleCount = normalized.filter(item => !item.verified).length;

    if (!items.length) {
      return jsonResponse({ error: `No verified items from the last ${FRESHNESS_DAYS} days found. ${staleCount ? `${staleCount} stale or unverified result(s) were rejected.` : 'Try another pillar or refresh later.'}` }, 404);
    }

    return jsonResponse({ items, refreshedAt: new Date().toISOString(), since, freshnessDays: FRESHNESS_DAYS, rejected: staleCount });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
