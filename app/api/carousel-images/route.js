export const maxDuration = 300;

// Pillar-specific visual aesthetics for consistent branding across slides
const PILLAR_AESTHETICS = {
  news: 'dark charcoal/black background, electric red and white accents, bold condensed sans-serif typography, breaking-news ticker graphic elements, glitch/urgency visual motifs',
  tool: 'clean white or off-white background, bold black sans-serif typography, neon green or electric blue accent shapes, minimal tech-product iconography, lots of negative space used intentionally',
  income: 'deep green or near-black background, gold/yellow accent typography and icons, dollar/upward-arrow/chart motifs, premium wealth aesthetic',
  transformation: 'warm cream or beige background, soft serif or rounded sans typography, terracotta/dusty-rose accents, hand-drawn arrows or sketch elements, diary/journal feel',
  automation: 'dark navy background, electric blue and cyan accents, circuit-board/node/flow-diagram graphic motifs, futuristic clean tech feel',
};

// Master prompt builders
function buildHookPrompt(hook, pillarId) {
  const aesthetic = PILLAR_AESTHETICS[pillarId] || PILLAR_AESTHETICS.news;
  return `Create a vertical 4:5 Instagram carousel COVER slide (cover/slide 1 of 6). This must be an EXTREME, scroll-stopping, curiosity-bomb visual — the kind of slide that makes someone stop scrolling instantly because it feels urgent, secretive, or shocking (e.g. the visual mood of "wait... WHAT?", "they don't want you to see this", "delete this before it's too late", "this shouldn't be public").

VISUAL STYLE: ${aesthetic}. Bold, dense, layered graphic composition — no empty/boring space. Use dramatic contrast, glow effects, warning/alert iconography (exclamation marks, eye icons, lock/unlock icons, redacted bars, glitch effects) where appropriate to amplify urgency.

TEXT RULE — EXTREMELY IMPORTANT: Include ONLY 3 to 6 words of text maximum, rendered as MASSIVE, ultra-bold display typography that dominates the frame. The text must be a punchy curiosity-hook DERIVED FROM (but shorter than) this idea: "${hook}". Do not write any other sentences, paragraphs, or captions anywhere on the image.

BRANDING: At the very bottom edge of the image, include the small text "@aibyvineet" in a clean, subtle, consistent sans-serif font — small enough not to distract from the main hook text.

No realistic human faces. No watermarks other than @aibyvineet. 2026 viral Instagram aesthetic, ultra-high contrast, thumb-stopping.`;
}

function buildContentSlidePrompt(slideNumber, title, body, pillarId, totalSlides) {
  const aesthetic = PILLAR_AESTHETICS[pillarId] || PILLAR_AESTHETICS.news;
  return `Create a vertical 4:5 Instagram carousel CONTENT slide (slide ${slideNumber} of ${totalSlides}). This slide continues a viral carousel series — it must visually match the cover slide's color palette and style for brand consistency, but WITHOUT the extreme "shock" framing of the cover. It should feel like a clean, premium, high-value information reveal.

VISUAL STYLE: ${aesthetic}. Dense, concise, intentional composition — use icons, simple data-visualization shapes (arrows, charts, graphs, badges, numbered elements), or abstract graphic shapes to ILLUSTRATE the concept visually. Avoid large empty/blank areas — every part of the frame should feel designed and purposeful, but NOT cluttered.

TEXT RULE — EXTREMELY IMPORTANT: Include very minimal text only:
- One short bold headline (3-7 words max), derived from: "${title}"
- Optionally ONE short supporting line (under 10 words), derived from: "${body}"
Do NOT write full sentences or paragraphs on the image. Typography should be bold, large, and easy to read at a glance — dense visuals carry the rest of the meaning, not text.

BRANDING: At the very bottom edge of the image, include the small text "@aibyvineet" in a clean, subtle, consistent sans-serif font matching the rest of the series.

No realistic human faces unless essential to the concept. No extra watermarks. 2026 viral Instagram aesthetic, consistent with the rest of this carousel series.`;
}

async function generateImage(apiKey, prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1536', // closest portrait ratio to 4:5 IG carousel
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
    const { hook, slides, pillarId } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return Response.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    if (!hook || !Array.isArray(slides)) return Response.json({ error: 'hook and slides are required' }, { status: 400 });

    const totalSlides = 1 + slides.length; // cover + content slides

    // Build all prompts
    const prompts = [
      { index: 0, label: 'Cover (Hook)', prompt: buildHookPrompt(hook, pillarId) },
      ...slides.map((s, i) => ({
        index: i + 1,
        label: s.title || `Slide ${i + 2}`,
        prompt: buildContentSlidePrompt(i + 2, s.title, s.body, pillarId, totalSlides),
      })),
    ];

    // Generate sequentially in small batches of 2 to respect rate limits
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
