import { requirePostforgeAccess } from '../../lib/access';
import { jsonResponse } from '../../lib/validation';

export const maxDuration = 120;

function clean(value) {
  return String(value || '').trim().replace(/^['"]|['"]$/g, '');
}

function text(value, max = 180) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function getCanvaData({ hook, cover_text, cover_subtext, slides = [], caption = '', cta = '', hashtags = '' }) {
  const data = {
    cover_headline: { type: 'text', text: text(cover_text || hook, 80) },
    cover_subline: { type: 'text', text: text(cover_subtext || 'Swipe to unlock', 60) },
    handle: { type: 'text', text: '@aibyvineet' },
    caption: { type: 'text', text: text(caption, 500) },
    cta: { type: 'text', text: text(cta, 180) },
    hashtags: { type: 'text', text: text(hashtags, 180) }
  };

  slides.slice(0, 5).forEach((slide, index) => {
    const n = index + 1;
    data[`slide_${n}_role`] = { type: 'text', text: text(slide.role || `slide ${n}`, 40) };
    data[`slide_${n}_headline`] = { type: 'text', text: text(slide.slide_headline || slide.title, 80) };
    data[`slide_${n}_subline`] = { type: 'text', text: text(slide.slide_subline || slide.body, 90) };
    data[`slide_${n}_stat`] = { type: 'text', text: text(slide.slide_stat || '', 40) };
  });

  return data;
}

function filterCanvaData(data, fields = []) {
  if (!Array.isArray(fields) || !fields.length) return data;
  return fields.reduce((filtered, field) => {
    if (data[field]) filtered[field] = data[field];
    return filtered;
  }, {});
}

function parseTemplatePool() {
  const rawPool = clean(process.env.CANVA_TEMPLATE_POOL);
  const legacyId = clean(process.env.CANVA_BRAND_TEMPLATE_ID);

  if (!rawPool) {
    return legacyId ? [{ id: legacyId, name: 'Default Canva brand template', style: 'default' }] : [];
  }

  try {
    const parsed = JSON.parse(rawPool);
    if (Array.isArray(parsed)) {
      return parsed
        .map((template, index) => typeof template === 'string'
          ? { id: clean(template), name: `Canva template ${index + 1}`, style: 'mixed' }
          : {
              id: clean(template.id || template.templateId || template.brand_template_id),
              name: text(template.name || `Canva template ${index + 1}`, 80),
              style: text(template.style || template.category || 'mixed', 80),
              fields: Array.isArray(template.fields) ? template.fields.map(clean).filter(Boolean) : []
            })
        .filter(template => template.id);
    }
  } catch {
    return rawPool
      .split(',')
      .map((id, index) => ({ id: clean(id), name: `Canva template ${index + 1}`, style: 'mixed' }))
      .filter(template => template.id);
  }

  return [];
}

function pickTemplate(pool, avoidTemplateId) {
  if (!pool.length) return null;
  const candidates = pool.length > 1 && avoidTemplateId
    ? pool.filter(template => template.id !== avoidTemplateId)
    : pool;
  const usable = candidates.length ? candidates : pool;
  return usable[Math.floor(Math.random() * usable.length)];
}

function isPending(status) {
  return ['in_progress', 'pending', 'running'].includes(String(status || '').toLowerCase());
}

function isDone(status) {
  return ['success', 'completed', 'complete'].includes(String(status || '').toLowerCase());
}

async function canvaFetch(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`https://api.canva.com/rest/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error?.message || `Canva API failed ${res.status}`);
  }
  return data;
}

export async function POST(request) {
  try {
    const blocked = requirePostforgeAccess(request);
    if (blocked) return blocked;

    const accessToken = clean(process.env.CANVA_ACCESS_TOKEN);
    const body = await request.json();
    const templatePool = parseTemplatePool();
    const selectedTemplate = pickTemplate(templatePool, clean(body.avoidTemplateId));
    const canvaData = filterCanvaData(getCanvaData(body), selectedTemplate?.fields);

    if (!accessToken || !selectedTemplate) {
      return jsonResponse({
        error: 'Canva Autofill needs CANVA_ACCESS_TOKEN and at least one Canva brand template ID in Vercel.',
        setup: [
          'Create a Canva brand template with text fields named cover_headline, cover_subline, handle, slide_1_headline through slide_5_headline, slide_1_subline through slide_5_subline, slide_1_stat through slide_5_stat, caption, cta, and hashtags.',
          'Generate a Canva Connect access token with design:content:write and design:meta:read scopes.',
          'Add CANVA_ACCESS_TOKEN and CANVA_TEMPLATE_POOL to Vercel, then redeploy. CANVA_BRAND_TEMPLATE_ID still works for one fallback template.'
        ],
        canvaPrompt: `Create a 6-page Instagram carousel using a premium high-retention creator template. Use bold layered visuals, minimal text, strong contrast, and a curiosity arc. Cover: ${text(body.cover_text || body.hook)}. Slides: ${(body.slides || []).map(s => text(s.slide_headline || s.title, 50)).join(' | ')}. Add @aibyvineet at the bottom of every page.`,
        dataFields: canvaData,
        templatePoolCount: templatePool.length
      }, 400);
    }

    const created = await canvaFetch('/autofills', {
      method: 'POST',
      token: accessToken,
      body: {
        brand_template_id: selectedTemplate.id,
        data: canvaData
      }
    });

    const jobId = created.job?.id || created.id;
    if (!jobId) throw new Error('Canva did not return an autofill job ID.');

    let job = created.job || created;
    for (let attempt = 0; attempt < 12 && isPending(job.status); attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 1800));
      const polled = await canvaFetch(`/autofills/${jobId}`, { token: accessToken });
      job = polled.job || polled;
    }

    if (!isDone(job.status)) {
      return jsonResponse({ error: job.error?.message || `Canva autofill job is ${job.status}.`, jobId, job }, 502);
    }

    const design = job.result?.design;
    return jsonResponse({
      success: true,
      jobId,
      template: selectedTemplate,
      design,
      editUrl: design?.urls?.edit_url || design?.url,
      viewUrl: design?.urls?.view_url || design?.url,
      thumbnailUrl: design?.thumbnail?.url || null
    });
  } catch (error) {
    return jsonResponse({ error: error.message }, 500);
  }
}
