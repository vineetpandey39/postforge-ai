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
    const focus = PILLAR_FOCUS[pillarId] || '';

    // ── Format-specific JSON schemas and instructions ─────────────────────
    const FORMAT_CONFIG = {
      Carousel: {
        instructions: `Create a 5-slide Instagram carousel. CRITICAL: also produce the EXACT minimal on-image text for each slide. These on-image text fields will be rendered VERBATIM onto generated images, so they must be extremely short, punchy, and self-contained — no markdown, no quotes, no emojis inside them, no trailing punctuation unless it's a single "?" or "!".`,
        schema: `{
  "hook": "max 12 word scroll-stopping hook from real content",
  "cover_text": "THE EXACT words to print huge on the cover slide. 2-5 words ONLY. All caps. A curiosity bomb. No punctuation except one optional ? or !. Example: 'AI JUST CHANGED EVERYTHING' or 'NOBODY TOLD YOU THIS'",
  "cover_subtext": "optional tiny kicker line, max 3 words, or empty string",
  "slides": [
    {"title": "slide title", "body": "2-3 lines from verified content", "source": "source name", "slide_headline": "EXACT 2-5 word headline to print on this slide, all caps, no punctuation", "slide_subline": "optional one short phrase under 6 words to print smaller, or empty string", "slide_stat": "a single number/stat/percentage to feature visually if relevant (e.g. '$200B', '3X', '84%'), or empty string"},
    {"title": "slide title", "body": "2-3 lines", "source": "source name", "slide_headline": "2-5 words", "slide_subline": "under 6 words or empty", "slide_stat": "stat or empty"},
    {"title": "slide title", "body": "2-3 lines", "source": "source name", "slide_headline": "2-5 words", "slide_subline": "under 6 words or empty", "slide_stat": "stat or empty"},
    {"title": "slide title", "body": "2-3 lines", "source": "source name", "slide_headline": "2-5 words", "slide_subline": "under 6 words or empty", "slide_stat": "stat or empty"},
    {"title": "CTA title", "body": "action step + follow @aibyvineet", "source": "", "slide_headline": "EXACT 2-4 word CTA, e.g. 'FOLLOW FOR MORE' or 'SAVE THIS NOW', all caps", "slide_subline": "@aibyvineet", "slide_stat": ""}
  ],
  "caption": "150 char max caption with emojis ending in question",
  "cta": "one strong call to action",
  "canva_brief": "visual direction in one sentence",
  "hashtags": "30 hashtags relevant to this specific post topics separated by spaces",
  "hashtag_strategy": "one sentence explaining hashtag mix chosen"
}`,
      },
      'Reel Script': {
        instructions: `Create a 30-45 second vertical video Reel script with shot-by-shot breakdown. NO carousel slides — this is a spoken/visual video script for one continuous Reel.`,
        schema: `{
  "hook": "max 12 word scroll-stopping spoken hook for the first 1-2 seconds, from real content",
  "script_segments": [
    {"timestamp": "0-3s", "visual": "what's on screen / B-roll / text overlay description", "voiceover": "exact words to say or on-screen text", "source": "source name or empty"},
    {"timestamp": "3-10s", "visual": "...", "voiceover": "...", "source": "source name or empty"},
    {"timestamp": "10-20s", "visual": "...", "voiceover": "...", "source": "source name or empty"},
    {"timestamp": "20-35s", "visual": "...", "voiceover": "...", "source": "source name or empty"},
    {"timestamp": "35-45s", "visual": "CTA visual — follow @aibyvineet text overlay", "voiceover": "verbal CTA + follow @aibyvineet", "source": ""}
  ],
  "caption": "150 char max caption with emojis ending in question",
  "cta": "one strong call to action",
  "canva_brief": "visual direction for thumbnail/cover frame in one sentence",
  "music_suggestion": "type of trending audio/BGM mood that fits this Reel (e.g. 'upbeat tech trending sound' or 'suspenseful build-up audio')",
  "hashtags": "30 hashtags relevant to this specific Reel topic separated by spaces",
  "hashtag_strategy": "one sentence explaining hashtag mix chosen"
}`,
      },
      'Story Hook': {
        instructions: `Create content for a sequence of 3-4 Instagram Stories (vertical, full-screen, ephemeral 24h format). Each story is a single full-screen moment — punchy, interactive, uses stickers/polls/questions. NOT a carousel post.`,
        schema: `{
  "hook": "max 12 word scroll-stopping opening line for story 1, from real content",
  "stories": [
    {"story_number": 1, "type": "hook", "text_overlay": "big bold text for this story frame", "sticker_suggestion": "e.g. 'Poll: Yes/No' or 'Question sticker' or 'Countdown' or 'none'", "visual_direction": "what background/visual for this frame", "source": "source name or empty"},
    {"story_number": 2, "type": "context", "text_overlay": "...", "sticker_suggestion": "...", "visual_direction": "...", "source": "source name or empty"},
    {"story_number": 3, "type": "value", "text_overlay": "...", "sticker_suggestion": "...", "visual_direction": "...", "source": "source name or empty"},
    {"story_number": 4, "type": "cta", "text_overlay": "Follow @aibyvineet for more + swipe up / link sticker", "sticker_suggestion": "Link sticker or Follow sticker", "visual_direction": "CTA visual direction", "source": ""}
  ],
  "caption": "short caption if cross-posting to feed as story highlight, 100 char max with emojis",
  "cta": "one strong call to action",
  "canva_brief": "visual direction for the story series cover/highlight icon in one sentence",
  "hashtags": "10-15 relevant hashtags for story sharing separated by spaces",
  "hashtag_strategy": "one sentence explaining hashtag mix chosen"
}`,
      },
      'Caption Only': {
        instructions: `Create ONLY a standalone Instagram caption (no slides, no script, no stories) — a strong, scroll-stopping written post that works with any single image or could stand alone as a text post.`,
        schema: `{
  "hook": "max 12 word scroll-stopping opening line of the caption, from real content",
  "caption_body": "Full Instagram caption body, 3-5 short paragraphs/lines with line breaks, emoji-rich, tells a complete story or makes a complete point based on verified content. 400-600 characters total including hook.",
  "caption": "the complete ready-to-post caption combining hook + caption_body + cta, formatted with line breaks, 150-300 chars summary version",
  "cta": "one strong call to action driving comments or saves",
  "canva_brief": "visual direction for a single accompanying image in one sentence",
  "hashtags": "30 hashtags relevant to this specific post topic separated by spaces",
  "hashtag_strategy": "one sentence explaining hashtag mix chosen"
}`,
      },
    };

    const config = FORMAT_CONFIG[format] || FORMAT_CONFIG.Carousel;

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
        system: `You are a top Instagram/Reels growth strategist for @aibyvineet (AI income, passive income, transformation niche).
Today is ${today}. Use ONLY provided content. Never fabricate. Return ONLY valid JSON — no markdown, no backticks, no extra text.`,
        messages: [{
          role: 'user',
          content: `Format requested: "${format}" for the "${pillarFull}" pillar.
${config.instructions}
${focus}

VERIFIED CONTENT:
${context}

POST TOPICS: ${topics}

Return ONLY this JSON structure with no deviations:
${config.schema}`,
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
    if (match) {
      const parsed = JSON.parse(match[0]);
      return Response.json({ ...parsed, _format: format });
    }
    throw new Error(`Parse failed. Raw: ${text.slice(0, 300)}`);

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
