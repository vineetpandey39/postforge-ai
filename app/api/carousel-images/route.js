import { put } from '@vercel/blob';
import { jsonResponse } from '../../lib/validation';

export const maxDuration = 300;

const PILLAR_PALETTE = {
  news: [
    'black glass newsroom with electric red, white, and amber urgency accents',
    'deep navy editorial command center with cobalt, silver, and warning-orange highlights',
    'dark magazine cover style with crimson headline accents and clean white typography'
  ],
  tool: [
    'graphite SaaS lab with cobalt blue, lime highlights, and crisp white UI panels',
    'bright white premium product launch board with black type and electric blue accents',
    'deep violet developer workspace with cyan holograms and sharp glassmorphism'
  ],
  income: [
    'black and emerald wealth dashboard with gold accents and high-contrast finance visuals',
    'midnight blue creator business cockpit with teal charts and warm gold signal lights',
    'cream and black luxury finance editorial with restrained green performance accents'
  ],
  transformation: [
    'warm black-to-gold cinematic portal with soft cream typography',
    'deep plum and rose creator transformation scene with elegant editorial contrast',
    'charcoal journal-meets-tech dashboard with terracotta and ivory highlights'
  ],
  automation: [
    'midnight automation command center with cyan circuitry and white workflow nodes',
    'black and orange robotic workflow floor with steel UI panels and amber sparks',
    'deep indigo operations map with teal, white, and magenta routing signals'
  ]
};

const VISUAL_SYSTEMS = [
  'giant glowing AI robot head emerging from circuit-board smoke, angled blockbuster composition',
  'rocket launch from a holographic dashboard, floating metrics, neon blast, depth and motion',
  'secret vault opening with AI icons, warning tape, data particles, forbidden discovery mood',
  'holographic phone screen exploding into workflow nodes, tool icons, green laser grid',
  'cinematic control room with floating panels, arrows, graphs, and a single hero object',
  'futuristic archive/bookmark vault with glowing save icon, locked-in creator advantage'
];

const ROLE_DIRECTIONS = {
  cover: 'open loop cover: hide the full answer, create mystery, threat, secret, or forbidden discovery energy',
  problem: 'problem/tension slide: show a visible gap, bottleneck, risk, or unfair advantage forming',
  proof: 'proof slide: show evidence, source-backed signal, date, chart, receipt, or verified event as the hero',
  reveal: 'reveal/mechanism slide: show the hidden system, connection, or mechanism behind the update',
  solution: 'solution/play slide: show the action path, workflow, next move, or creator playbook',
  closure: 'closure/save slide: show a locked vault, saved file, checklist, or final advantage worth saving'
};

function safeText(value, fallback = '') {
  return String(value || fallback).replace(/[{}]/g, '').replace(/\s+/g, ' ').trim().slice(0, 90);
}

function pickPalette(pillarId, layoutIndex) {
  const palettes = PILLAR_PALETTE[pillarId] || PILLAR_PALETTE.news;
  return palettes[layoutIndex % palettes.length];
}

function imagePrompt({ type, role = 'proof', text, subline, stat, visual, body, contentBrief, source, pillarId, layoutIndex }) {
  const palette = pickPalette(pillarId, layoutIndex);
  const visualSystem = visual || VISUAL_SYSTEMS[layoutIndex % VISUAL_SYSTEMS.length];
  const isCover = role === 'cover' || layoutIndex === 0;
  const roleDirection = ROLE_DIRECTIONS[role] || ROLE_DIRECTIONS.proof;
  const factualContext = [
    body ? `Slide meaning: ${safeText(body, '').slice(0, 180)}` : '',
    contentBrief ? `Must communicate visually: ${safeText(contentBrief, '').slice(0, 180)}` : '',
    source ? `Source context: ${safeText(source)}` : ''
  ].filter(Boolean).join('\n');
  const textRules = [
    `MAIN TEXT EXACTLY: "${safeText(text)}"`,
    subline ? `SMALL TEXT EXACTLY: "${safeText(subline)}"` : '',
    stat ? `FEATURED STAT EXACTLY: "${safeText(stat)}"` : '',
    'BOTTOM HANDLE EXACTLY: "@aibyvineet"'
  ].filter(Boolean).join('; ');

  return `MASTER PROMPT FOR ${type.toUpperCase()}:
Create a vertical 3:4 Instagram carousel image, 1024x1536.
Goal: stop-scroll viral AI creator content that feels ahead of every other creator.
Style: cinematic high-contrast AI/tech editorial poster, dense premium visuals, crisp 3D depth, dramatic lighting, sharp futuristic UI details, not a generic template.
Palette and mood: ${palette}.
Narrative role: ${roleDirection}.
Content that the image MUST match:
${factualContext || 'Use the text and visual concept as the only content source.'}
Core visual concept tied to this content: ${visualSystem}.
Composition: ${isCover
    ? 'extreme hook cover, massive curiosity, one dominant cinematic object, diagonal energy, danger/secret/reveal feeling, do not fully explain the story yet, thumbnail-readable from far away'
    : 'follow-up story slide, dense but organized visual metaphor, one clear hero object, supporting holograms/icons/charts, each slide should advance the story and make the viewer swipe again'}.
Typography: huge bold condensed sans-serif, high contrast with the selected palette, minimal words only, no body paragraphs.
Text to render: ${textRules}.
Strict rules: render no other words, no random labels, no fake brand logos, no invented statistics, no watermarks, no misspelled text, no clutter over the main text, keep @aibyvineet small and centered at the bottom, make the image visibly about the actual slide content rather than a generic AI poster.`;
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

async function uploadImage(dataUrl, index) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;

  const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
  const buffer = Buffer.from(base64, 'base64');
  const filename = `postforge/carousels/${Date.now()}-${index}.png`;
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType: 'image/png'
  });

  return blob.url;
}

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return jsonResponse({ error: 'OPENAI_API_KEY is not configured.' }, 500);

    const { hook, cover_text, cover_subtext, cover_visual_prompt, slides = [], pillarId = 'news' } = await request.json();
    if (!Array.isArray(slides) || !slides.length) return jsonResponse({ error: 'Carousel slides are required.' }, 400);

    const prompts = [
      { index: 0, label: 'Hook / Open Loop', prompt: imagePrompt({ type: 'cover', role: 'cover', text: cover_text || hook, subline: cover_subtext || '', visual: cover_visual_prompt, body: hook, contentBrief: cover_visual_prompt, pillarId, layoutIndex: 0 }) },
      ...slides.map((slide, i) => ({
        index: i + 1,
        label: `${slide.role ? `${safeText(slide.role)} / ` : ''}${slide.slide_headline || slide.title || `Slide ${i + 1}`}`,
        prompt: imagePrompt({
          type: `slide ${i + 1}`,
          role: slide.role,
          text: slide.slide_headline || slide.title,
          subline: slide.slide_subline || '',
          stat: slide.slide_stat || '',
          visual: slide.visual_prompt || slide.body || '',
          body: slide.body || '',
          contentBrief: slide.content_brief || '',
          source: slide.source || '',
          pillarId,
          layoutIndex: i + 1
        })
      }))
    ];

    const results = [];
    for (const p of prompts) {
      try {
        const image = await generateImage(apiKey, p.prompt);
        const imageUrl = await uploadImage(image, p.index);
        results.push({ index: p.index, label: p.label, image, imageUrl, success: true });
      } catch (error) {
        results.push({ index: p.index, label: p.label, error: error.message, success: false });
      }
    }

    return jsonResponse({ images: results, successCount: results.filter(r => r.success).length, totalCount: results.length });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
