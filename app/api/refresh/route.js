export async function POST(request) {
  try {
    const { pillar, pillarFull } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const queries = {
      news: `latest AI news ${today} OpenAI Google Anthropic`,
      tool: `best new AI tools creators income ${today}`,
      income: `making passive income with AI real examples ${today}`,
      transformation: `AI life transformation income success stories 2026`,
      automation: `AI automation workflows real results 2026`,
    };

    // Try with web search
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'web-search-2025-03-05',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          system: `You are a real-time content researcher. Today is ${today}.
Search the web and return ONLY a JSON array of 6-8 real recent items.
Each item: {id, tag (emoji+word), date, source, headline, summary (2-3 sentences)}.
Return ONLY the raw JSON array starting with [. No markdown, no backticks.`,
          messages: [{ role: 'user', content: `Search: "${queries[pillar]}" for "${pillarFull}" Instagram pillar. Return 6-8 real items as JSON array.` }],
        }),
      });

      if (!res.ok) throw new Error(`Anthropic API error: ${res.status}`);
      const data = await res.json();
      const textBlocks = (data.content || []).filter(b => b.type === 'text');
      const fullText = textBlocks.map(b => b.text).join('\n');
      const match = fullText.replace(/```json|```/g, '').match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length > 0) return Response.json(parsed);
      }
    } catch(e) {
      console.error('Web search failed:', e.message);
    }

    // Fallback: generate fresh content without web search
    const fallbackRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: `You are a content researcher. Today is ${today}.
Generate 6-8 current, specific content items for an Instagram page about AI income.
Use real company names, real numbers, specific facts from your most recent knowledge.
Return ONLY a JSON array: [{id,tag,date,source,headline,summary}]. No markdown, no backticks.`,
        messages: [{
          role: 'user',
          content: `Generate 6-8 current items about "${queries[pillar]}" for the "${pillarFull}" Instagram pillar. Today: ${today}. Be specific with real names and numbers.`,
        }],
      }),
    });

    if (!fallbackRes.ok) {
      const errText = await fallbackRes.text();
      throw new Error(`Fallback API error ${fallbackRes.status}: ${errText.slice(0, 200)}`);
    }

    const fd = await fallbackRes.json();
    const ft = (fd.content || []).find(b => b.type === 'text')?.text || '';
    const fm = ft.replace(/```json|```/g, '').match(/\[[\s\S]*\]/);
    if (fm) return Response.json(JSON.parse(fm[0]));

    throw new Error(`Could not parse fallback response: ${ft.slice(0, 200)}`);

  } catch (e) {
    console.error('Refresh error:', e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
