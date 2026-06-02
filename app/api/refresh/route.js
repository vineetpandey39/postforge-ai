export async function POST(request) {
  try {
    const { pillar, pillarFull } = await request.json();
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const queries = {
      news: `top AI news today ${today} — latest announcements OpenAI Google Anthropic Meta`,
      tool: `new AI tools launched this week ${today} for creators and income`,
      income: `people making money with AI this week ${today} real examples results`,
      transformation: `AI transforming careers businesses this week ${today} real stories`,
      automation: `AI automation wins this week ${today} real results time saved`,
    };

    // gpt-4o-search-preview uses Chat Completions API with web_search_options
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-search-preview',
        web_search_options: {},
        messages: [
          {
            role: 'system',
            content: `You are a real-time content researcher. Today is ${today}.
Search the web and find 6 real, recent news items from the last 7 days only.
Return ONLY a valid JSON array of exactly 6 objects.
Each object must have: id (unique string), tag (emoji + 1-2 words), date (real date of article), source (real publication name), headline (real headline), summary (2-3 sentences with real facts).
Return ONLY the raw JSON array starting with [. No markdown, no backticks, no explanation.`,
          },
          {
            role: 'user',
            content: `Search for: "${queries[pillar]}" and return 6 real recent items as a JSON array for the "${pillarFull}" Instagram content pillar.`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);

    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) return Response.json(parsed);
    }

    throw new Error(`Could not parse response: ${text.slice(0, 200)}`);

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
