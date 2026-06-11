export async function POST(request) {
  try {
    const { pillar, pillarFull } = await request.json();
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });

    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const queries = {
      news: `breaking AI news announcements from this week ${today} — site:techcrunch.com OR site:theverge.com OR site:reuters.com OpenAI Google Anthropic Meta Microsoft`,
      tool: `AI tool product launches and updates announced this week ${today} — new releases, version updates, beta launches for content creators`,
      income: `creator earnings AI side hustle case study published this week ${today} real numbers`,
      transformation: `AI workplace career transformation story published this week ${today}`,
      automation: `AI automation case study workflow published this week ${today} time saved results`,
    };

    // Known old models/tools that aggregator sites often re-surface as "new" — model must NOT present these as current
    const STALE_REFERENCE_LIST = `Examples of items that are OLD and must NEVER be presented as new/latest/recent (these were all released well before ${today}, mostly in 2024-2025): GPT-4, GPT-4o, GPT-4.5 (Feb 2025), GPT-3.5, Claude 3, Claude 3.5, Claude 3.7, Gemini 1.5, Gemini 2.0, Gemini 2.5, Llama 3, Llama 3.1, Sora (Dec 2024), DALL-E 3. If any source mentions these as if they are new releases, that source is STALE/recycled content — discard it entirely and find a genuinely current item instead.`;

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
            content: `You are a rigorous real-time content researcher and fact-checker. Today's actual date is ${today}.

YOUR TASK: Search the web for genuinely fresh content from the last 7 days (between ${sevenDaysAgo} and ${today} only).

CRITICAL ANTI-STALENESS RULES:
1. Many AI newsletters and aggregator blogs (e.g. "AI Pulse", "Daily AI Updates", "Launch AI Jam") republish or reference OLD product launches as if they're breaking news. You MUST verify each item's actual recency using your own knowledge before including it.
2. ${STALE_REFERENCE_LIST}
3. For EVERY item, ask yourself: "Based on my training knowledge, was this specific announcement/launch/event ACTUALLY new within the last 7 days, or is this a recycled/evergreen mention of something older?" If you're not confident it's genuinely from the last 7 days, EXCLUDE it.
4. Prefer items from primary sources (official company blogs, TechCrunch, The Verge, Reuters, Bloomberg) over generic AI newsletter aggregators, which are the most common source of stale repackaged content.
5. The "date" field you return MUST be the article's actual publish date — never default to today's date just because that's when you searched.

Return ONLY a valid JSON array of exactly 6 objects. Each object: {id (unique string), tag (emoji + 1-2 words), date (actual verified publish date), source (real publication name — prefer primary sources), headline (real headline), summary (2-3 sentences with real, verifiable facts)}.

Return ONLY the raw JSON array starting with [. No markdown, no backticks, no explanation. If you cannot find 6 genuinely fresh items, return fewer rather than padding with stale ones.`,
          },
          {
            role: 'user',
            content: `Search for: "${queries[pillar]}" and return up to 6 genuinely recent (last 7 days) items as a JSON array for the "${pillarFull}" Instagram content pillar. Today is ${today}. Apply the anti-staleness verification to every single item before including it.`,
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
