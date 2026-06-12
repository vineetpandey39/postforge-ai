import { jsonResponse } from '../../lib/validation';

export const maxDuration = 300;

const PILLAR_PALETTE = {
  news: 'deep charcoal background, warm red accent, off-white text, premium editorial',
  tool: 'off-white background, near-black text, cobalt blue or lime accent, clean Swiss tech look',
  income: 'dark green-black background, warm gold accent, cream text, quiet-luxury wealth feel',
  transformation: 'warm cream background, soft ink text, terracotta accent, calm editorial journal style',
  automation: 'midnight navy background, cyan electric-blue accent, pale text, clean futuristic tech'
};

const LAYOUTS = [
  'huge centered type, lots of margin, one thin underline',
  'top third headline with large negative space below',
  'split block layout with solid accent band at bottom',
  'giant stat as hero with small label beneath',
  'left-aligned editorial column with empty right side',
  'thin border frame with centered headline'
];

function safeText(value, fallback = '') {
  return String(value || fallback).replace(/[{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 80);
}

function imagePrompt({ type, text, subline, stat, pillarId, layoutIndex }) {
  const palette = PILLAR_PALETTE[pillarId] || PILLAR_PALETTE.news;
  const layout = LAYOUTS[layoutIndex % LAYOUTS.length];
  return `Create a vertical 3:4 Instagram carousel ${type}. Flat 2D typographic poster, no photo, no people. Palette: ${palette}. Layout: ${layout}. Only render this text exactly: MAIN: ${safeText(text)}${subline ? `; SMALL: ${safeText(subline)}` : ''}${stat ? `; FEATURED STAT: ${safeText(stat)}` : ''}; HANDLE: @aibyvineet. Do not add any other words, icons, fake UI, watermarks, paragraphs, or repeated text. Premium minimalist design, high readability.`;
}

async function generateImage(apiKey, prompt) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-image-1', prompt, size: '1024x1536', quality: 'medium', n: 1 })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Image API failed ${res.status}: ${err.slice(0, 240)}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error('Image API returned no image.');
  return `data:image/png;base64,${b64}`;
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return jsonResponse({ error: 'OPENAI_API_KEY is not configured.' }, 500);

    const { hook, cover_text, cover_subtext, slides = [], pillarId = 'news' } = await request.json();
    if (!Array.isArray(slides) || !slides.length) return jsonResponse({ error: 'Carousel slides are required.' }, 400);

    const prompts = [
      { index: 0, label: 'Cover', prompt: imagePrompt({ type: 'cover', text: cover_text || hook, subline: cover_subtext || '', pillarId, layoutIndex: 0 }) },
      ...slides.map((slide, i) => ({
        index: i + 1,
        label: slide.slide_headline || slide.title || `Slide ${i + 1}`,
        prompt: imagePrompt({
          type: `slide ${i + 1}`,
          text: slide.slide_headline || slide.title,
          subline: slide.slide_subline || '',
          stat: slide.slide_stat || '',
          pillarId,
          layoutIndex: i + 1
        })
      }))
    ];

    const results = [];
    for (const p of prompts) {
      try {
        const image = await generateImage(apiKey, p.prompt);
        results.push({ index: p.index, label: p.label, image, success: true });
      } catch (error) {
        results.push({ index: p.index, label: p.label, error: error.message, success: false });
      }
    }

    return jsonResponse({ images: results, successCount: results.filter(r => r.success).length, totalCount: results.length });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
