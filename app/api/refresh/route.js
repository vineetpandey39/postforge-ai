export async function POST(request) {
  try {
    const { pillar, pillarFull } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const queries = {
      news: `top AI news ${today}`,
      tool: `new AI tools for creators and income ${today}`,
      income: `AI passive income real examples ${today}`,
      transformation: `AI life and income transformation stories 2026`,
      automation: `AI automation workflow results 2026`,
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a content researcher. Today is ${today}. Return ONLY a JSON object with a single key "items" containing an array of 6 objects. Each object must have: id (string), tag (emoji + word), date (string), source (string), headline (string), summary (2-3 sentences with real facts and numbers).`,
          },
          {
            role: 'user',
            content: `Generate 6 current, specific items about "${queries[pillar]}" for the "${pillarFull}" Instagram content pillar. Use real company names, real numbers, specific facts.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 150)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(text);
    const items = parsed.items || parsed;

    if (Array.isArray(items) && items.length > 0) {
      return Response.json(items);
    }

    throw new Error('Could not parse response');
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
