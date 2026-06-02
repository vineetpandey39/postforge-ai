export async function POST(request) {
  try {
    const { selectedItems, pillarFull, pillarId, format } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const PILLAR_FOCUS = {
      news: 'Focus on what this means for AI income builders. Make it urgent and actionable.',
      tool: 'Focus on practical use cases, time/money saved, how to start today.',
      income: 'Focus on specific numbers and replicable steps. Make reader believe they can do this.',
      transformation: 'Focus on identity shift and emotional resonance.',
      automation: 'Focus on exact steps, time saved, cost per output.',
    };

    const context = selectedItems
      .map((item, i) => `${i + 1}. [${item.source} — ${item.date}] ${item.headline}\n   ${item.summary}`)
      .join('\n\n');

    const topics = selectedItems.map(i => i.headline).join(', ');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: `You are a top Instagram growth strategist for @aibyvineet (AI income, passive income, transformation niche).
Today is ${today}. Use ONLY provided content. Never fabricate. Return ONLY valid JSON — no markdown, no backticks, no extra text.`,
        messages: [{
          role: 'user',
          content: `Create an Instagram ${format} for "${pillarFull}". ${PILLAR_FOCUS[pillarId] || ''}

VERIFIED CONTENT:
${context}

POST TOPICS: ${topics}

Return ONLY this JSON structure with no deviations:
{
  "hook": "max 12 word scroll-stopping hook from real content",
  "slides": [
    {"title": "slide title", "body": "2-3 lines from verified content", "source": "source name"},
    {"title": "slide title", "body": "2-3 lines", "source": "source name"},
    {"title": "slide title", "body": "2-3 lines", "source": "source name"},
    {"title": "slide title", "body": "2-3 lines", "source": "source name"},
    {"title": "CTA title", "body": "action step + follow @aibyvineet", "source": ""}
  ],
  "caption": "150 char max caption with emojis ending in question",
  "cta": "one strong call to action",
  "canva_brief": "visual direction in one sentence",
  "hashtags": "30 hashtags relevant to this specific post topics separated by spaces",
  "hashtag_strategy": "one sentence explaining hashtag mix chosen"
}`,
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = (data.content || []).find(b => b.type === 'text')?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return Response.json(JSON.parse(match[0]));
    throw new Error(`Parse failed. Raw: ${text.slice(0, 300)}`);

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
