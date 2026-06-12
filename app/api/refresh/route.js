import { extractJson, jsonResponse, normalizeItem } from '../../lib/validation';

export const maxDuration = 120;

const SOURCE_HINTS = 'official company blog OR Reuters OR The Verge OR TechCrunch OR VentureBeat OR CNBC OR Bloomberg OR Google Blog OR OpenAI Blog OR Anthropic News OR Meta AI Blog OR Microsoft Blog';

const QUERIES = {
  news: `latest AI company announcements and AI product news from the last 14 days ${SOURCE_HINTS}`,
  tool: `latest AI tool launches for creators automation video image coding from the last 14 days ${SOURCE_HINTS}`,
  income: `recent creator economy AI income case study real numbers from the last 30 days credible source`,
  transformation: `recent AI workplace productivity career transformation study from the last 30 days credible source`,
  automation: `recent AI automation workflow case study time saved cost saved from the last 30 days credible source`
};

export async function POST(request) {
  try {
    const { pillar = 'news', pillarFull = 'AI Content' } = await request.json();
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return jsonResponse({ error: 'OPENAI_API_KEY is not configured.' }, 500);

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
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
            content: `You are a strict fact-checking researcher for an Instagram AI content tool. Today is ${today}. Return only real, source-backed items. Do not include rumors, fictional model names, unverified claims, or old launches repackaged as new. Prefer primary sources and reputable publications. Return raw JSON only.`
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
    const items = parsed
      .map((item, index) => normalizeItem(item, index, pillar))
      .filter(item => item.verified)
      .slice(0, 6);

    if (!items.length) {
      return jsonResponse({ error: 'No verified recent items found. Try another pillar or refresh later.' }, 404);
    }

    return jsonResponse({ items, refreshedAt: new Date().toISOString() });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
