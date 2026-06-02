export async function POST(request) {
  try {
    const { hook, slides, canva_brief, pillarId } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return Response.json({ error: 'API key not configured' }, { status: 500 });

    const slidesText = (slides || [])
      .map((s, i) => `Slide ${i + 1}: ${s.title} — ${s.body}`)
      .join('\n');

    // Pillar-specific viral aesthetics for 2026
    const pillarAesthetics = {
      news: {
        style: 'Bold breaking news editorial — deep black background, electric red accent headlines, white body text, newspaper-style typography. URGENT feel.',
        template: 'Dark breaking news Instagram carousel 2026 viral',
      },
      tool: {
        style: 'Clean tech product showcase — pure white background, bold black sans-serif headlines, neon green or electric blue accents. Minimal, premium.',
        template: 'Clean tech product viral Instagram carousel 2026',
      },
      income: {
        style: 'Money aesthetic — dark green background with gold accents, or clean white with bold green numbers. Wealth signaling, aspirational.',
        template: 'Money income viral Instagram carousel 2026',
      },
      transformation: {
        style: 'Warm cream background, soft serif typography, dusty rose or terracotta accents. Emotional, personal, diary-like feel.',
        template: 'Transformation personal story viral Instagram carousel 2026',
      },
      automation: {
        style: 'Dark navy background, electric blue circuit-board accents, clean monospace font for code snippets. Tech-forward, futuristic.',
        template: 'Dark tech automation viral Instagram carousel 2026',
      },
    };

    const aesthetic = pillarAesthetics[pillarId] || pillarAesthetics.news;

    const prompt = `Search for the latest viral Instagram carousel templates trending in 2026 for the "${pillarId}" content niche. Then create a 5-slide Instagram carousel post for @aibyvineet.

CRITICAL REQUIREMENTS:
- Format: PORTRAIT 3:4 ratio (1080x1440px) — Instagram carousel standard
- Style: ${aesthetic.style}
- Search for: "${aesthetic.template}" to find the most viral current template style
- Apply the most trending layout from search results

CONTENT TO USE:
Hook/Cover Slide: ${hook}
${slidesText}

DESIGN RULES:
- Slide 1: Full-bleed hook text — massive bold typography, stops the scroll
- Slides 2-4: Clean content layout — title + body text, consistent branding
- Slide 5: Strong CTA — "Follow @aibyvineet" prominently placed
- Every slide: @aibyvineet handle at bottom
- Consistent color palette across all slides
- ${canva_brief}

Generate this as a multi-page Canva design with exactly 5 pages at 1080x1440px portrait format.`;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        mcp_servers: [{ type: 'url', url: 'https://mcp.canva.com/mcp', name: 'canva-mcp' }],
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${err.slice(0, 200)}`);
    }

    const data = await res.json();
    const allText = (data.content || [])
      .map(b => b.type === 'text' ? b.text : b.type === 'mcp_tool_result' ? JSON.stringify(b.content) : '')
      .join('\n');

    const urlMatch = allText.match(/https:\/\/www\.canva\.com\/d\/[^\s"')>]+/);

    return Response.json({
      canvaUrl: urlMatch?.[0] || null,
      success: !!urlMatch,
      pillarId,
      aesthetic: aesthetic.style,
      message: urlMatch ? 'Portrait 3:4 carousel created' : 'Design created — check Canva account',
    });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
