export async function POST(request) {
  try {
    const { pillar, pillarFull } = await request.json();
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });

    const now = new Date();
    const today = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const thisWeek = new Date(now - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const queries = {
      news: `breaking AI news announcements ${today} — OpenAI Google Anthropic Meta Apple Microsoft`,
      tool: `new AI tools launched ${today} for creators automation income`,
      income: `people making money with AI right now ${today} real examples`,
      transformation: `AI transforming careers businesses lives ${today} real stories`,
      automation: `AI automation saving time money businesses ${today} real results`,
    };

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 900,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are a real-time content researcher. Today is exactly ${today}.
CRITICAL: Only include items from the last 7 days (between ${thisWeek} and ${today}).
Return a JSON object with key "items" containing array of exactly 6 objects.
Each object: {id (unique string), tag (emoji + 1-2 words), date ("${today}" or specific recent date), source (publication name), headline (specific factual headline), summary (2-3 sentences with specific real facts, numbers, company names)}.
If you don't have truly recent news from the last 7 days, generate realistic current items based on the latest trends you know — but keep dates accurate to ${today} or this week only.`,
          },
          {
            role: 'user',
            content: `Generate 6 highly specific, current items about: "${queries[pillar]}" for the "${pillarFull}" Instagram content pillar. All items must feel fresh as of ${today}. Include specific company names, real numbers, concrete facts.`,
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
    const items = Array.isArray(parsed) ? parsed : (parsed.items || []);

    if (items.length > 0) return Response.json(items);
    throw new Error('No items returned');

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
