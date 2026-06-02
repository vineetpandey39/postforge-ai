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

    // Use OpenAI Responses API with built-in web search
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-search-preview',
        tools: [{ type: 'web_search' }],
        input: `Search the web RIGHT NOW for: "${queries[pillar]}"

Today's date is ${today}. Find 6 real, recent news items from the last 7 days only.

Return ONLY a valid JSON array of exactly 6 objects. Each object must have:
- id: unique short string
- tag: emoji + 1-2 words describing category  
- date: actual date of the news item
- source: actual publication name
- headline: real headline from the search results
- summary: 2-3 sentences with specific real facts, numbers, company names from the actual articles

Return ONLY the JSON array starting with [. No markdown, no explanation.`,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();

    // Extract text from Responses API output
    const outputText = (data.output || [])
      .filter(b => b.type === 'message')
      .flatMap(b => b.content || [])
      .filter(c => c.type === 'output_text')
      .map(c => c.text)
      .join('\n');

    const clean = outputText.replace(/```json|```/g, '').trim();
    const match = clean.match(/\[[\s\S]*\]/);

    if (match) {
      const parsed = JSON.parse(match[0]);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Response.json(parsed);
      }
    }

    throw new Error('Could not parse web search results');

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
