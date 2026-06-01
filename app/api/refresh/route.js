// app/api/refresh/route.js
// Server-side — API key never exposed to browser

const PILLAR_QUERIES = {
  news: 'latest AI news breakthroughs today OpenAI Google Anthropic',
  tool: 'best new AI tools creators passive income automation',
  income: 'making passive income with AI real results examples',
  transformation: 'AI life transformation income success stories 2026',
  automation: 'AI automation workflows real results time saved money',
};

export async function POST(request) {
  try {
    const { pillar, pillarFull } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Try with web search first
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: `You are a real-time content researcher. Today is ${today}.
Search the web and return ONLY a JSON array of 6-8 real recent items.
Each item: {id, tag (emoji+word), date, source, headline, summary (2-3 sentences)}.
Return ONLY the raw JSON array starting with [. No markdown, no backticks, no explanation.`,
        messages: [{ role: 'user', content: `Search: "${PILLAR_QUERIES[pillar]}" for the "${pillarFull}" Instagram pillar. Return 6-8 real items as JSON array.` }],
      }),
    });

    const data = await res.json();
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    const fullText = textBlocks.map(b => b.text).join('\n');
    const match = fullText.replace(/```json|```/g, '').match(/\[[\s\S]*\]/);

    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Response.json(parsed);
      }
    }

    // Fallback: generate without web search
    const fallback = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Generate 6-8 current, realistic content items for Instagram. Today: ${today}. Use real company names, real numbers, specific facts from your knowledge. Return ONLY a JSON array: [{id,tag,date,source,headline,summary}]. No markdown.`,
        messages: [{ role: 'user', content: `Generate for "${pillarFull}" pillar about: ${PILLAR_QUERIES[pillar]}` }],
      }),
    });
    const fd = await fallback.json();
    const ft = (fd.content || []).find(b => b.type === 'text')?.text || '';
    const fm = ft.replace(/```json|```/g, '').match(/\[[\s\S]*\]/);
    if (fm) return Response.json(JSON.parse(fm[0]));

    throw new Error('Both search and fallback failed');
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
