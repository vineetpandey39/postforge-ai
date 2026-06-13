import { jsonResponse } from '../../lib/validation';

export const maxDuration = 120;

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v23.0';

function cleanEnvValue(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/^INSTAGRAM_ACCESS_TOKEN\s*=\s*/i, '')
    .replace(/^Bearer\s+/i, '')
    .replace(/\s+/g, '');
}

function tokenHint(token) {
  if (!token) return 'missing';
  return `length ${token.length}, starts ${token.slice(0, 4)}, ends ${token.slice(-4)}`;
}

function graphBaseUrl(accessToken) {
  return accessToken.startsWith('IG') ? 'https://graph.instagram.com' : 'https://graph.facebook.com';
}

function getFiveHashtags(value) {
  const tags = String(value || '')
    .match(/#[a-zA-Z0-9_]+/g)
    ?.map(tag => tag.toLowerCase()) || [];
  const unique = [...new Set(tags)];
  const fallback = ['#aitools', '#aiautomation', '#aiforcreators', '#creatorbusiness', '#buildinpublic'];
  return [...unique, ...fallback.filter(tag => !unique.includes(tag))].slice(0, 5);
}

async function graphPost(baseUrl, path, params) {
  const res = await fetch(`${baseUrl}/${GRAPH_VERSION}/${path}`, {
    method: 'POST',
    body: new URLSearchParams(params)
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Instagram API failed ${res.status}`);
  }
  return data;
}

async function graphGet(baseUrl, path, params) {
  const query = new URLSearchParams(params);
  const res = await fetch(`${baseUrl}/${GRAPH_VERSION}/${path}?${query}`);
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || `Instagram API failed ${res.status}`);
  }
  return data;
}

export async function POST(request) {
  try {
    const accessToken = cleanEnvValue(process.env.INSTAGRAM_ACCESS_TOKEN);
    const igUserId = cleanEnvValue(process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.INSTAGRAM_USER_ID);

    if (!accessToken) return jsonResponse({ error: 'INSTAGRAM_ACCESS_TOKEN is not configured.' }, 500);
    if (!igUserId) return jsonResponse({ error: 'INSTAGRAM_BUSINESS_ACCOUNT_ID is not configured.' }, 500);
    const baseUrl = graphBaseUrl(accessToken);

    const { imageUrls = [], caption = '', cta = '', hashtags = '' } = await request.json();
    const urls = imageUrls.filter(Boolean).slice(0, 10);
    if (urls.length < 2) {
      return jsonResponse({ error: 'At least 2 public image URLs are required for an Instagram carousel. Set BLOB_READ_WRITE_TOKEN and regenerate images.' }, 400);
    }

    const finalHashtags = getFiveHashtags(hashtags).join(' ');
    const finalCaption = [caption, cta, finalHashtags].filter(Boolean).join('\n\n').slice(0, 2200);

    const children = [];
    for (const imageUrl of urls) {
      const child = await graphPost(baseUrl, `${igUserId}/media`, {
        image_url: imageUrl,
        is_carousel_item: 'true',
        access_token: accessToken
      });
      children.push(child.id);
    }

    const carousel = await graphPost(baseUrl, `${igUserId}/media`, {
      media_type: 'CAROUSEL',
      children: children.join(','),
      caption: finalCaption,
      access_token: accessToken
    });

    const published = await graphPost(baseUrl, `${igUserId}/media_publish`, {
      creation_id: carousel.id,
      access_token: accessToken
    });

    let permalink = null;
    try {
      const media = await graphGet(baseUrl, published.id, {
        fields: 'permalink',
        access_token: accessToken
      });
      permalink = media.permalink || null;
    } catch {
      permalink = null;
    }

    return jsonResponse({ success: true, id: published.id, permalink, hashtags: finalHashtags, apiHost: baseUrl });
  } catch (error) {
    const message = error.message.includes('Cannot parse access token')
      ? `${error.message}. Check Vercel has only the raw Page access token value, then redeploy. Token seen by server: ${tokenHint(cleanEnvValue(process.env.INSTAGRAM_ACCESS_TOKEN))}.`
      : error.message;
    return jsonResponse({ error: message }, 500);
  }
}
