export const maxDuration = 300;

// ── Pillar palettes (color/mood only — NOT layout) ──────────────────────────
const PILLAR_PALETTE = {
  news:           'deep charcoal background (#0E0E10), one bold accent color (warm red #E03131) used sparingly, off-white text (#F5F5F5). Editorial, serious, premium — NOT a tabloid.',
  tool:           'clean off-white background (#FAFAF7), near-black text (#111), one electric accent (cobalt blue #2D5BFF or lime #84CC16). Minimal Swiss tech-product look.',
  income:         'rich dark green-black background (#0B1B12), warm gold accent (#E6B450), cream text (#F4EFE6). Quiet-luxury wealth feel, NOT flashy.',
  transformation: 'warm cream background (#F3EDE3), soft ink text (#2A2520), terracotta accent (#C26B4A). Calm, editorial, journal-like.',
  automation:     'midnight navy background (#0A1228), cyan/electric-blue accent (#38BDF8), pale text (#E8EEF7). Clean futuristic tech, NOT busy.',
};

// ── Layout archetypes — rotated so every slide looks DIFFERENT ───────────────
// Each is a distinct, well-known editorial/social composition. We cycle through them.
const LAYOUT_ARCHETYPES = [
  'BIG-TYPE CENTER: the headline is the entire design — set enormous, tightly kerned, centered, filling ~70% of the frame. Generous margins. One thin accent rule under it. Nothing else competes.',
  'TOP-ANCHOR + NEGATIVE SPACE: headline locked to the top third in a tight block, the lower two-thirds left almost empty except for one small minimalist line-icon or a single thin accent shape. Lots of breathing room.',
  'SPLIT BLOCK: a solid accent-color band occupies the lower 40% of the frame; headline sits in the band in the contrasting color, the upper 60% is plain background with a small kicker word top-left.',
  'GIANT STAT: one number/percentage/figure is the hero — set massive in the accent color, centered; a short 2-3 word label sits directly beneath it in small caps. Minimal everything else.',
  'CORNER KICKER + LEFT RAG: a tiny label in the top-left corner, headline set left-aligned (ragged right) starting from the vertical middle, occupying the left two-thirds. Clean column of empty space on the right.',
  'FRAMED EDITORIAL: a thin 1px border inset from the edges frames the whole slide like a magazine page; headline centered within, set in a refined large weight, one small accent dot or underline.',
];

const COVER_ARCHETYPES = [
  'POSTER SHOUT: a single 2-4 word phrase set absolutely massive, centered, filling the frame edge to edge, tightly stacked on 2-3 lines. Maximum contrast. One word may be in the accent color for emphasis. No icons, no clutter.',
  'REDACTED REVEAL: the phrase is centered and large; ONE key word is covered by a solid accent-color bar (as if censored/redacted), creating curiosity. Clean background, nothing else.',
  'OVERSIZED QUESTION: a short curiosity question set very large and centered, the final word dropped to its own line in the accent color, with a single oversized "?" as a graphic element. Minimal.',
  'TOP-TEASER: the phrase sits in the top half in huge type; the bottom half is empty except for a single thin downward arrow or chevron hinting "keep swiping". Lots of negative space.',
];

function safe(t) {
  return String(t || '').replace(/["{}]/g, '').replace(/\s+/g, ' ').trim();
}

// Cover prompt — renders ONLY the exact provided words
function buildCoverPrompt(coverText, coverSub, pillarId, variantSeed) {
  const palette = PILLAR_PALETTE[pillarId] || PILLAR_PALETTE.news;
  const archetype = COVER_ARCHETYPES[variantSeed % COVER_ARCHETYPES.length];
  const cover = safe(coverText);
  const sub = safe(coverSub);

  return `Design a single vertical 4:5 Instagram carousel COVER (portrait). Flat 2D graphic design / typographic poster — NOT a photo, NOT 3D.

COLOR & MOOD: ${palette}

COMPOSITION (follow this exactly): ${archetype}

THE ONLY TEXT ALLOWED ON THE IMAGE — render these characters EXACTLY, spelled correctly, with NO other words anywhere:
• MAIN: ${cover}
${sub ? `• SMALL KICKER: ${sub}` : '• (no kicker)'}
• TINY HANDLE at the very bottom center: @aibyvineet

ABSOLUTE RULES:
- Do NOT add any words, sentences, captions, labels, taglines, or repeated text other than the lines listed above. No "BREAKING NEWS", no lorem-ipsum, no duplicated phrases, no scattered words in corners.
- Spell every word correctly. Keep total word count tiny.
- No exclamation/warning icons, no eye icons, no lock icons, no glitch noise unless the composition explicitly calls for one simple accent shape.
- High-end, restrained, modern editorial aesthetic. Strong typography is the design. Clean kerning, professional layout, lots of intentional negative space.
- No realistic human faces. No photographic textures. No watermarks other than @aibyvineet.`;
}

// Content slide prompt — renders ONLY the exact provided words, varied layout
function buildSlidePrompt(slideNumber, totalSlides, headline, subline, stat, pillarId, variantSeed) {
  const palette = PILLAR_PALETTE[pillarId] || PILLAR_PALETTE.news;
  const archetype = stat
    ? LAYOUT_ARCHETYPES[3] // GIANT STAT layout when a stat exists
    : LAYOUT_ARCHETYPES[variantSeed % LAYOUT_ARCHETYPES.length];
  const h = safe(headline);
  const s = safe(subline);
  const st = safe(stat);

  return `Design a single vertical 4:5 Instagram carousel slide (slide ${slideNumber} of ${totalSlides}), part of a consistent series. Flat 2D graphic design / typographic poster — NOT a photo, NOT 3D.

COLOR & MOOD (must match the rest of the series): ${palette}

COMPOSITION (follow this exactly): ${archetype}

THE ONLY TEXT ALLOWED ON THE IMAGE — render these EXACTLY, spelled correctly, nothing else:
• HEADLINE: ${h}
${st ? `• FEATURED FIGURE (make this the visual hero, very large, in the accent color): ${st}` : ''}
${s ? `• SMALL SUBLINE: ${s}` : '• (no subline)'}
• TINY HANDLE at the very bottom center: @aibyvineet

ABSOLUTE RULES:
- Render ONLY the text lines listed above. Do NOT invent extra words, sentences, paragraphs, repeated phrases, or filler. No scattered or duplicated text anywhere.
- Spell every word correctly. Keep it minimal — the layout and color carry the design, not dense text.
- Consistent with a premium editorial carousel series: same palette, same typographic family feel, but THIS slide must use the distinct composition described above so it does not look identical to the other slides.
- Allowed graphics: at most ONE simple flat line-icon or geometric accent shape if it suits the layout. No exclamation/eye/lock icons, no glitch, no noise.
- No realistic human faces. No photographic textures. No watermarks other than @aibyvineet.`;
}

async function generateImage(apiKey, prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1536',
      quality: 'medium',
      n: 1,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Image API error ${res.status}: ${err.slice(0, 200)}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image returned');
  return b64;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { hook, slides, pillarId } = body;
    // New explicit text fields (fall back gracefully to old fields if missing)
    const coverText = body.cover_text || hook;
    const coverSub = body.cover_subtext || '';

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    if (!coverText || !Array.isArray(slides)) return Response.json({ error: 'cover text and slides are required' }, { status: 400 });

    const totalSlides = 1 + slides.length;

    // Build prompts. variantSeed offsets each slide to a different layout archetype.
    const prompts = [
      { index: 0, label: 'Cover', prompt: buildCoverPrompt(coverText, coverSub, pillarId, 0) },
      ...slides.map((s, i) => ({
        index: i + 1,
        label: s.slide_headline || s.title || `Slide ${i + 2}`,
        prompt: buildSlidePrompt(
          i + 2, totalSlides,
          s.slide_headline || s.title,
          s.slide_subline || '',
          s.slide_stat || '',
          pillarId,
          i + 1 // seed -> different layout per slide
        ),
      })),
    ];

    const results = [];
    const BATCH_SIZE = 2;
    for (let i = 0; i < prompts.length; i += BATCH_SIZE) {
      const batch = prompts.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(async (p) => {
          try {
            const b64 = await generateImage(apiKey, p.prompt);
            return { index: p.index, label: p.label, image: `data:image/png;base64,${b64}`, success: true };
          } catch (e) {
            return { index: p.index, label: p.label, error: e.message, success: false };
          }
        })
      );
      results.push(...batchResults);
    }

    results.sort((a, b) => a.index - b.index);
    return Response.json({
      images: results,
      successCount: results.filter(r => r.success).length,
      totalCount: results.length,
    });

  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
