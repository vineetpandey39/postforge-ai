import { extractJson, jsonResponse, requireVerifiedItems } from '../../lib/validation';

export const maxDuration = 120;

const PILLAR_FOCUS = {
  news: 'Explain why the update matters to creators and AI income builders. Be urgent, but do not exaggerate.',
  tool: 'Focus on practical use cases, time saved, cost saved, and how to start.',
  income: 'Use only provided numbers. Do not invent earnings, averages, or timelines.',
  transformation: 'Focus on identity shift and practical behavior change without fake statistics.',
  automation: 'Focus on exact workflow steps, tools, and realistic time savings from the source.'
};

const FORMAT_CONFIG = {
  Carousel: {
    instructions: `Create a 6-image Instagram carousel plan: 1 extreme hook cover plus 5 follow-up slides.
Use very few words on the images. Make the visual direction do the heavy lifting.
Cover hook must feel pattern-breaking, urgent, and curiosity-heavy, for example: "WAIT... WHAT?", "CHECK THIS BEFORE IT'S GONE", "THIS CHANGES EVERYTHING", "SHHH... WATCH THIS", "INSTAGRAM MAY HATE THIS".
Do not reuse those examples verbatim every time; create a fresh hook from the verified source.
Slides 2-6 should continue the update with dense, premium, futuristic visual concepts and concise text only.
Every factual claim must trace back to selected sources. Every image must include @aibyvineet at the bottom.`,
    schema: {
      hook: 'max 12 words',
      cover_text: '3-7 words, all caps, extreme curiosity hook',
      cover_subtext: 'max 4 words or empty',
      cover_visual_prompt: 'one sentence describing a cinematic dense viral visual metaphor for the cover',
      slides: [
        { title: 'short title', body: '1 short line', source: 'source name', source_url: 'url', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'dense cinematic visual metaphor, no text instructions' },
        { title: 'short title', body: '1 short line', source: 'source name', source_url: 'url', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'dense cinematic visual metaphor, no text instructions' },
        { title: 'short title', body: '1 short line', source: 'source name', source_url: 'url', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'dense cinematic visual metaphor, no text instructions' },
        { title: 'short title', body: '1 short line', source: 'source name', source_url: 'url', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'dense cinematic visual metaphor, no text instructions' },
        { title: 'CTA title', body: 'action step + follow @aibyvineet', source: '', source_url: '', slide_headline: 'SAVE THIS NOW', slide_subline: 'FOLLOW @aibyvineet', slide_stat: '', visual_prompt: 'premium save-worthy final slide with futuristic archive, bookmark, or vault visual' }
      ],
      caption: '150 chars max',
      cta: 'one CTA',
      canva_brief: 'one visual direction sentence',
      hashtags: '20-30 relevant hashtags',
      hashtag_strategy: 'one sentence'
    }
  },
  'Reel Script': {
    instructions: 'Create a 30-45 second Reel script with timestamps. Use only selected sources.',
    schema: { hook: 'max 12 words', script_segments: [{ timestamp: '0-3s', visual: 'visual', voiceover: 'exact words', source: 'source', source_url: 'url' }], caption: 'short caption', cta: 'CTA', music_suggestion: 'BGM mood', hashtags: 'hashtags', hashtag_strategy: 'strategy' }
  },
  'Story Hook': {
    instructions: 'Create a 4-frame Instagram Story sequence with poll/question sticker ideas.',
    schema: { hook: 'max 12 words', stories: [{ story_number: 1, type: 'hook/context/value/cta', text_overlay: 'text', sticker_suggestion: 'sticker', visual_direction: 'visual', source: 'source', source_url: 'url' }], caption: 'short caption', cta: 'CTA', hashtags: 'hashtags', hashtag_strategy: 'strategy' }
  },
  'Caption Only': {
    instructions: 'Create a standalone Instagram caption. No slides or script.',
    schema: { hook: 'max 12 words', caption_body: '400-600 chars', caption: 'complete caption', cta: 'CTA', canva_brief: 'single image direction', hashtags: 'hashtags', hashtag_strategy: 'strategy' }
  }
};

const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4-6';

export async function POST(request) {
  try {
    const { selectedItems, pillarFull, pillarId = 'news', format = 'Carousel' } = await request.json();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return jsonResponse({ error: 'ANTHROPIC_API_KEY is not configured.' }, 500);

    requireVerifiedItems(selectedItems);

    const config = FORMAT_CONFIG[format] || FORMAT_CONFIG.Carousel;
    const model = process.env.ANTHROPIC_MODEL || DEFAULT_ANTHROPIC_MODEL;
    const context = selectedItems.map((item, i) => `${i + 1}. ${item.headline}\nSource: ${item.source}\nDate: ${item.date}\nURL: ${item.url}\nSummary: ${item.summary}`).join('\n\n');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 1800,
        system: 'You are a factual Instagram growth strategist. Use ONLY the provided verified sources. Never fabricate product names, earnings, dates, prices, statistics, claims, or source URLs. Return only valid JSON.',
        messages: [{
          role: 'user',
          content: `Format: ${format}\nPillar: ${pillarFull}\nFocus: ${PILLAR_FOCUS[pillarId] || ''}\nInstructions: ${config.instructions}\n\nVerified sources:\n${context}\n\nReturn exactly this JSON shape, adapted with real content only:\n${JSON.stringify(config.schema, null, 2)}`
        }]
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Anthropic generation failed ${res.status}: ${err.slice(0, 240)}`);
    }

    const data = await res.json();
    const text = (data.content || []).find(block => block.type === 'text')?.text || '';
    const parsed = extractJson(text, 'object');
    return jsonResponse({ ...parsed, _format: format, _verified_sources: selectedItems.map(({ source, headline, url, date }) => ({ source, headline, url, date })) });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
