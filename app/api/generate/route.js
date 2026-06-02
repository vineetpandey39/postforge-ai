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

    // Extract key topics from selected items for hashtag generation
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
        system: `You are a top Instagram growth strategist and SEO expert for @aibyvineet.
Today is ${today}.
You specialize in viral content for the AI income, passive income, and transformation niche.
CRITICAL RULES:
- Use ONLY the verified content provided. Never fabricate facts.
- Generate hashtags that are DYNAMICALLY relevant to the specific topics in the post
- Hashtag strategy: mix of high-volume (1M+ posts), mid-volume (100K-1M), niche-specific (10K-100K), and trending
- Never use generic filler hashtags — every hashtag must be relevant to THIS specific post
- Respond ONLY with valid JSON — no markdown, no backticks.`,
        messages: [{
          role: 'user',
          content: `Create an Instagram ${format} post for the "${pillarFull}" pillar.
${PILLAR_FOCUS[pillarId] || ''}

VERIFIED CONTENT (use ONLY these facts):
${context}

TOPICS IN THIS POST: ${topics}

Return exactly this JSON:
{
  "hook": "Scroll-stopping first line max 12 words based on real content",
  "slides": [
    {"title": "Bold title", "body": "2-3 punchy lines from verified content only", "source": "source name"},
    {"title": "Bold title", "body": "2-3 punchy lines", "source": "source name"},
    {"title": "Bold title", "body": "2-3 punchy lines", "source": "source name"},
    {"title": "Bold title", "body": "2-3 punchy lines", "source": "source name"},
    {"title": "CTA title", "body": "Actionable takeaway + follow @aibyvineet", "source": ""}
  ],
  "caption": "150-200 char Instagram caption, emoji-rich, ends with engaging question to drive comments",
  "cta": "Strong call to action",
  "canva_brief": "Visual direction for this specific post and pillar",
  "hashtags": "30 dynamically generated hashtags specifically relevant to THIS post's topics — mix of: 8 high-volume viral tags (1M+ posts) directly related to topic, 12 mid-volume niche tags (100K-1M posts) for discoverability, 6 micro-niche tags (10K-100K) for community reach, 4 trending/timely tags relevant to today's AI landscape. Format: #tag1 #tag2 ... all on one line. Make every single hashtag count for THIS specific content.",
  "hashtag_strategy": "Brief explanation of why these hashtags were chosen for this specific post"
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
    throw new Error('Parse failed');

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
