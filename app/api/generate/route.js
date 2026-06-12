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
    instructions: `Create a 6-image Instagram carousel using a top-creator curiosity arc.
The carousel must not feel like news cards. It must feel like a swipe-worthy story with an open loop.

Required story arc:
1. Cover / open loop: do NOT reveal the whole news. Create an extreme curiosity hook that makes viewers need slide 2. Pattern examples: "WAIT... WHAT?", "THIS QUIETLY CHANGES AI", "CHECK THIS BEFORE IT'S GONE", "THE PART NOBODY SAW", "SHHH... WATCH THIS". Do not reuse examples verbatim. Use 3-7 words only.
2. Problem / tension: name the pain, risk, hidden shift, or unfair advantage created by the update.
3. Proof / why now: use one verified fact, date, number, source, or concrete event that proves this is real.
4. Reveal / mechanism: explain the hidden mechanism or why this matters in one sharp idea.
5. Solution / play: tell creators/builders what move to make now.
6. Closure / save: make the viewer save, follow, or act, while closing the open loop.

Text discipline:
- Image text must be minimal: headline 2-5 words, subline under 5 words, optional stat only if real.
- Never put paragraphs on images. The visual metaphor should carry the density.
- Every factual claim must trace back to selected sources.
- Every image must include @aibyvineet at the bottom.`,
    schema: {
      hook: 'max 12 words',
      cover_text: '3-7 words, all caps, extreme curiosity hook',
      cover_subtext: 'max 4 words or empty',
      cover_visual_prompt: 'one sentence describing a cinematic dense viral visual metaphor for the cover',
      slides: [
        { role: 'problem', title: 'short title', body: '1 short line naming the tension', source: 'source name', source_url: 'url', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'dense cinematic problem/tension visual metaphor' },
        { role: 'proof', title: 'short title', body: '1 short line with verified proof', source: 'source name', source_url: 'url', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'dense cinematic proof/evidence visual metaphor' },
        { role: 'reveal', title: 'short title', body: '1 short line revealing the hidden mechanism', source: 'source name', source_url: 'url', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'dense cinematic reveal/mechanism visual metaphor' },
        { role: 'solution', title: 'short title', body: '1 short line telling the creator move', source: 'source name or empty', source_url: 'url or empty', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'dense cinematic solution/playbook visual metaphor' },
        { role: 'closure', title: 'CTA title', body: 'save/follow/action step + follow @aibyvineet', source: '', source_url: '', slide_headline: 'SAVE THIS NOW', slide_subline: 'FOLLOW @aibyvineet', slide_stat: '', visual_prompt: 'premium save-worthy final slide with futuristic archive, bookmark, or vault visual' }
      ],
      caption: '150 chars max',
      cta: 'one CTA',
      canva_brief: 'one visual direction sentence',
      hashtags: 'exactly 5 different relevant Instagram hashtags, space-separated, no generic spam',
      hashtag_strategy: 'one sentence explaining why these 5 hashtags fit this post'
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

function normalizeFiveHashtags(value, pillarId) {
  const tags = String(value || '')
    .match(/#[a-zA-Z0-9_]+/g)
    ?.map(tag => tag.toLowerCase()) || [];
  const fallbackByPillar = {
    news: ['#ainews', '#aitools', '#technews', '#aiforcreators', '#futureofwork'],
    tool: ['#aitools', '#aiautomation', '#productivitytools', '#creatorstack', '#buildinpublic'],
    income: ['#aiincome', '#creatorbusiness', '#digitalincome', '#sidehustleideas', '#aiforcreators'],
    transformation: ['#aiforcreators', '#futureofwork', '#creatormindset', '#worksmart', '#digitalcreator'],
    automation: ['#aiautomation', '#workflowautomation', '#nocodetools', '#creatorstack', '#aitools']
  };
  const fallback = fallbackByPillar[pillarId] || fallbackByPillar.news;
  const unique = [...new Set(tags)];
  return [...unique, ...fallback.filter(tag => !unique.includes(tag))].slice(0, 5).join(' ');
}

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
        system: 'You are a factual Instagram growth strategist. Use ONLY the provided verified sources. Never fabricate product names, earnings, dates, prices, statistics, claims, or source URLs. Hashtags must be exactly 5, relevant to this post, and varied each generation. Return only valid JSON.',
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
    parsed.hashtags = normalizeFiveHashtags(parsed.hashtags, pillarId);
    return jsonResponse({ ...parsed, _format: format, _verified_sources: selectedItems.map(({ source, headline, url, date }) => ({ source, headline, url, date })) });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
