export async function POST(request) {
  try {
    const { pillar, pillarFull } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const queries = {
      news: `top AI news ${today}`,
      tool: `new AI tools income ${today}`,
      income: `AI passive income examples ${today}`,
      transformation: `AI income transformation stories 2026`,
      automation: `AI automation results 2026`,
    };

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        system: `Researcher. Today: ${today}. Return ONLY a JSON array of 6 items: [{id,tag,date,source,headline,summary}]. No markdown.`,
        messages: [{
          role: 'user',
          content: `Generate 6 current specific items about "${queries[pillar]}" for "${pillarFull}" Instagram pillar. Use real names and numbers.`,
        }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error ${res.status}: ${err.slice(0, 150)}`);
    }

    const data = await res.json();
    const text = (data.content || []).find(b => b.type === 'text')?.text || '';
    const match = text.replace(/```json|```/g, '').match(/\[[\s\S]*\]/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) return Response.json(parsed);
    }

    throw new Error('Could not parse response');
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
