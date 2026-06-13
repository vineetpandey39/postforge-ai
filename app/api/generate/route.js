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
- Slide 1 stays minimal. Slides 2-5 need one short image_body_text insight, 14-24 words, that explains the actual point in plain English.
- Never put long paragraphs on images. The visual metaphor should carry the density, while the image_body_text carries the key context.
- Each visual_prompt must mention the exact subject, source event, tool/company/person, and the slide role so the image cannot become generic.
- Each body must contain the real context behind the image in one short sentence.
- Every factual claim must trace back to selected sources.
- Every image must include @aibyvineet at the bottom.`,
    schema: {
      hook: 'max 12 words',
      cover_text: '3-7 words, all caps, extreme curiosity hook',
      cover_subtext: 'max 4 words or empty',
      cover_visual_prompt: 'one sentence describing a cinematic dense viral visual metaphor for the cover',
      slides: [
        { role: 'problem', title: 'short title', body: 'real context in 1 short sentence', image_body_text: '14-24 words, exact text for the image insight panel', source: 'source name', source_url: 'url', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'specific visual prompt tied to the actual subject and problem', content_brief: 'what this slide must communicate visually' },
        { role: 'proof', title: 'short title', body: 'real proof in 1 short sentence', image_body_text: '14-24 words, exact text for the image insight panel', source: 'source name', source_url: 'url', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'specific visual prompt tied to the actual verified proof', content_brief: 'what this slide must communicate visually' },
        { role: 'reveal', title: 'short title', body: 'real mechanism in 1 short sentence', image_body_text: '14-24 words, exact text for the image insight panel', source: 'source name', source_url: 'url', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'specific visual prompt tied to the actual mechanism', content_brief: 'what this slide must communicate visually' },
        { role: 'solution', title: 'short title', body: 'real creator move in 1 short sentence', image_body_text: '14-24 words, exact text for the image insight panel', source: 'source name or empty', source_url: 'url or empty', slide_headline: '2-5 words all caps', slide_subline: 'under 5 words', slide_stat: 'real stat or empty', visual_prompt: 'specific visual prompt tied to the actual recommended move', content_brief: 'what this slide must communicate visually' },
        { role: 'closure', title: 'CTA title', body: 'save/follow/action step + follow @aibyvineet', image_body_text: '10-18 words, save/follow reason for the image insight panel', source: '', source_url: '', slide_headline: 'SAVE THIS NOW', slide_subline: 'FOLLOW @aibyvineet', slide_stat: '', visual_prompt: 'specific save-worthy final visual tied to the carousel topic', content_brief: 'what the viewer should remember and save' }
      ],
      caption: '150 chars max',
      cta: 'one CTA',
      canva_brief: 'one visual direction sentence',
      hashtags: 'exactly 5 different relevant Instagram hashtags, space-separated, no generic spam',
      hashtag_strategy: 'one sentence explaining why these 5 hashtags fit this post'
    }
  },
  'Reel Script': {
    instructions: `Create a faceless 22-35 second Instagram Reel script that feels viral from frame 1.

Reel strategy:
- First 0-2 seconds must create instant pattern interrupt: danger, secret, shocking proof, or "you missed this" energy.
- Do not start with "Today we are talking about". Start with the consequence.
- Use fast cuts every 2-4 seconds.
- Every segment needs: visual, on_screen_text, voiceover, edit_note, source, source_url.
- Keep voiceover punchy and conversational in Hinglish-friendly English, but do not use slang that harms clarity.
- Make it faceless: use AI-generated B-roll, UI mockups, source proof cards, kinetic text, charts, laptop/phone scenes, and abstract product visuals.
- Use only selected sources. Do not invent product names, benchmarks, dates, numbers, or claims.
- End with a save/follow CTA tied to why the viewer should remember this.`,
    schema: {
      hook: 'max 10 words, frame-one retention hook',
      reel_angle: 'one sentence describing why viewers should care now',
      cold_open_visual: 'exact first frame visual direction',
      script_segments: [
        { timestamp: '0-2s', beat: 'pattern interrupt', on_screen_text: '3-7 words', visual: 'faceless visual direction', voiceover: 'exact words', edit_note: 'cut/motion/caption instruction', source: 'source', source_url: 'url' },
        { timestamp: '2-6s', beat: 'context', on_screen_text: '3-7 words', visual: 'faceless visual direction', voiceover: 'exact words', edit_note: 'cut/motion/caption instruction', source: 'source', source_url: 'url' },
        { timestamp: '6-12s', beat: 'proof', on_screen_text: '3-7 words', visual: 'faceless visual direction', voiceover: 'exact words', edit_note: 'cut/motion/caption instruction', source: 'source', source_url: 'url' },
        { timestamp: '12-20s', beat: 'meaning', on_screen_text: '3-7 words', visual: 'faceless visual direction', voiceover: 'exact words', edit_note: 'cut/motion/caption instruction', source: 'source', source_url: 'url' },
        { timestamp: '20-30s', beat: 'creator move', on_screen_text: '3-7 words', visual: 'faceless visual direction', voiceover: 'exact words', edit_note: 'cut/motion/caption instruction', source: 'source', source_url: 'url' },
        { timestamp: '30-35s', beat: 'save CTA', on_screen_text: '3-7 words', visual: 'faceless visual direction', voiceover: 'exact words', edit_note: 'cut/motion/caption instruction', source: '', source_url: '' }
      ],
      shot_list: ['5-7 short AI image/video scene prompts for faceless B-roll'],
      caption: 'short caption, 150 chars max',
      cta: 'one save/follow/comment CTA',
      music_suggestion: 'manual Instagram audio mood, not a specific copyrighted song',
      hashtags: 'exactly 5 different relevant Instagram hashtags, space-separated',
      hashtag_strategy: 'one sentence explaining why these 5 hashtags fit this reel'
    }
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
const GENERATION_TOOL = {
  name: 'return_postforge_generation',
  description: 'Return the completed PostForge content object using only the verified source material.',
  input_schema: {
    type: 'object',
    additionalProperties: true
  }
};

function getToolInput(data) {
  const block = (data.content || []).find(part => part.type === 'tool_use' && part.name === GENERATION_TOOL.name);
  return block?.input || null;
}

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

async function repairJson({ apiKey, model, rawText, schema }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 4000,
      system: 'Convert malformed JSON-like text into one structured object. Do not add facts, claims, sources, or fields not present in the input/schema.',
      tools: [GENERATION_TOOL],
      tool_choice: { type: 'tool', name: GENERATION_TOOL.name },
      messages: [{
        role: 'user',
        content: `Schema to match:\n${JSON.stringify(schema, null, 2)}\n\nMalformed text:\n${String(rawText || '').slice(0, 12000)}`
      }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`JSON repair failed ${res.status}: ${err.slice(0, 180)}`);
  }

  const data = await res.json();
  const toolInput = getToolInput(data);
  if (toolInput) return toolInput;

  const repaired = (data.content || []).find(block => block.type === 'text')?.text || '';
  return extractJson(repaired, 'object');
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
        max_tokens: 4000,
        system: 'You are a factual Instagram growth strategist. Use ONLY the provided verified sources. Never fabricate product names, earnings, dates, prices, statistics, claims, or source URLs. Hashtags must be exactly 5, relevant to this post, and varied each generation. Return the final content only through the provided tool.',
        tools: [GENERATION_TOOL],
        tool_choice: { type: 'tool', name: GENERATION_TOOL.name },
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
    let parsed = getToolInput(data);
    if (!parsed) {
      const text = (data.content || []).find(block => block.type === 'text')?.text || '';
      try {
        parsed = extractJson(text, 'object');
      } catch {
        parsed = await repairJson({ apiKey, model, rawText: text, schema: config.schema });
      }
    }
    parsed.hashtags = normalizeFiveHashtags(parsed.hashtags, pillarId);
    return jsonResponse({ ...parsed, _format: format, _verified_sources: selectedItems.map(({ source, headline, url, date }) => ({ source, headline, url, date })) });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
