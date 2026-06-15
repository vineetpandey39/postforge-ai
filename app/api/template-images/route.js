import { requirePostforgeAccess } from '../../lib/access';
import { jsonResponse } from '../../lib/validation';

export const maxDuration = 60;

const THEMES = {
  news: ['#07080d', '#ef4444', '#f8fafc', '#f59e0b'],
  tool: ['#07111f', '#38bdf8', '#f8fafc', '#a3e635'],
  income: ['#07130f', '#22c55e', '#fef3c7', '#fbbf24'],
  transformation: ['#130a18', '#ec4899', '#fff7ed', '#f97316'],
  automation: ['#07111f', '#06b6d4', '#f8fafc', '#8b5cf6']
};

const ROLES = {
  cover: 'OPEN LOOP',
  problem: 'TENSION',
  proof: 'PROOF',
  reveal: 'REVEAL',
  solution: 'PLAY',
  closure: 'SAVE'
};

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function lines(value, max = 16, count = 4) {
  const words = String(value || '').trim().split(/\s+/).filter(Boolean);
  const rows = [];
  let row = '';
  for (const word of words) {
    if (`${row} ${word}`.trim().length > max && row) {
      rows.push(row);
      row = word;
    } else {
      row = `${row} ${word}`.trim();
    }
  }
  if (row) rows.push(row);
  return rows.slice(0, count);
}

function svgToDataUrl(svg) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function makeSvg({ index, role, headline, subline, stat, body, source, pillarId }) {
  const [bg, accent, text, second] = THEMES[pillarId] || THEMES.news;
  const titleLines = lines(headline, 13, 4);
  const bodyLines = lines(body, 34, 3);
  const roleLabel = ROLES[role] || `SLIDE ${index + 1}`;
  const statText = stat ? esc(stat) : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
  <defs>
    <radialGradient id="glow" cx="50%" cy="38%" r="65%">
      <stop offset="0%" stop-color="${accent}" stop-opacity=".38"/>
      <stop offset="48%" stop-color="${second}" stop-opacity=".16"/>
      <stop offset="100%" stop-color="${bg}" stop-opacity="1"/>
    </radialGradient>
    <linearGradient id="bar" x1="0" x2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${second}"/>
    </linearGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000" flood-opacity=".55"/></filter>
  </defs>
  <rect width="1024" height="1536" fill="${bg}"/>
  <rect width="1024" height="1536" fill="url(#glow)"/>
  <g opacity=".18" stroke="${text}" stroke-width="2">
    ${Array.from({ length: 12 }).map((_, i) => `<path d="M${70 + i * 82} 180 V1320"/>`).join('')}
    ${Array.from({ length: 9 }).map((_, i) => `<path d="M90 ${260 + i * 120} H934"/>`).join('')}
  </g>
  <g filter="url(#shadow)">
    <rect x="76" y="96" width="872" height="1344" rx="46" fill="rgba(0,0,0,.38)" stroke="${accent}" stroke-opacity=".65" stroke-width="3"/>
    <rect x="76" y="96" width="872" height="18" rx="9" fill="url(#bar)"/>
  </g>
  <text x="112" y="178" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900" letter-spacing="3">${esc(roleLabel)}</text>
  <circle cx="854" cy="170" r="54" fill="none" stroke="${accent}" stroke-width="5"/>
  <text x="854" y="187" text-anchor="middle" fill="${text}" font-family="Arial, Helvetica, sans-serif" font-size="46" font-weight="900">${index + 1}</text>

  <g transform="translate(112 286)">
    ${titleLines.map((line, i) => `<text x="0" y="${i * 104}" fill="${i === titleLines.length - 1 ? accent : text}" font-family="Arial Black, Impact, Arial, sans-serif" font-size="88" font-weight="900">${esc(line.toUpperCase())}</text>`).join('')}
  </g>

  ${subline ? `<text x="112" y="762" fill="${second}" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="800">${esc(subline)}</text>` : ''}
  ${statText ? `<g transform="translate(112 840)"><rect width="420" height="118" rx="28" fill="${accent}" fill-opacity=".16" stroke="${accent}" stroke-width="3"/><text x="34" y="76" fill="${text}" font-family="Arial Black, Arial, sans-serif" font-size="46" font-weight="900">${statText}</text></g>` : ''}

  <g transform="translate(112 1030)">
    ${bodyLines.map((line, i) => `<text x="0" y="${i * 52}" fill="${text}" fill-opacity=".88" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700">${esc(line)}</text>`).join('')}
  </g>

  <g transform="translate(112 1250)">
    <rect width="800" height="2" fill="${accent}" opacity=".55"/>
    <text x="0" y="58" fill="${text}" fill-opacity=".72" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700">${esc(source || 'Verified source')}</text>
  </g>

  <text x="512" y="1390" text-anchor="middle" fill="${text}" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="900">@aibyvineet</text>
</svg>`;
}

export async function POST(request) {
  try {
    const blocked = requirePostforgeAccess(request);
    if (blocked) return blocked;

    const { hook, cover_text, cover_subtext, slides = [], pillarId = 'news' } = await request.json();
    if (!Array.isArray(slides) || !slides.length) return jsonResponse({ error: 'Carousel slides are required.' }, 400);

    const cards = [
      {
        index: 0,
        label: 'Template / Open Loop',
        svg: makeSvg({
          index: 0,
          role: 'cover',
          headline: cover_text || hook,
          subline: cover_subtext || 'Swipe to see',
          body: hook,
          pillarId
        })
      },
      ...slides.map((slide, i) => ({
        index: i + 1,
        label: `Template / ${slide.role || `Slide ${i + 1}`}`,
        svg: makeSvg({
          index: i + 1,
          role: slide.role,
          headline: slide.slide_headline || slide.title,
          subline: slide.slide_subline || '',
          stat: slide.slide_stat || '',
          body: slide.body || '',
          source: slide.source || '',
          pillarId
        })
      }))
    ];

    return jsonResponse({
      images: cards.map(card => ({
        index: card.index,
        label: card.label,
        image: svgToDataUrl(card.svg),
        svg: card.svg,
        success: true,
        type: 'template'
      })),
      successCount: cards.length,
      totalCount: cards.length
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
