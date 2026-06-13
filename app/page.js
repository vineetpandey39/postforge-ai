'use client';

import { useMemo, useState } from 'react';
import './globals.css';
import { FORMATS, PILLAR_FRESHNESS_DAYS, PILLARS } from './lib/validation';

const HASHTAGS_FALLBACK = '#AItools #AIautomation #AIforcreators #buildinpublic #creatorbusiness';

function Button({ children, onClick, disabled, variant = 'primary', className = '' }) {
  return (
    <button className={`btn ${variant} ${className}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function Panel({ children, className = '' }) {
  return <section className={`panel ${className}`}>{children}</section>;
}

function Metric({ label, value, tone = '' }) {
  return (
    <div className={`metric ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function itemAge(item) {
  if (typeof item.ageDays !== 'number') return '7d verified';
  if (item.ageDays === 0) return 'Today';
  if (item.ageDays === 1) return '1 day old';
  return `${item.ageDays} days old`;
}

function reelCopy(output) {
  if (!output?.script_segments?.length) return '';
  return output.script_segments
    .map(segment => `${segment.timestamp} ${segment.beat || ''}\nOn-screen: ${segment.on_screen_text || ''}\nVoiceover: ${segment.voiceover || ''}\nVisual: ${segment.visual || ''}\nEdit: ${segment.edit_note || ''}`)
    .join('\n\n');
}

function segmentDurationMs(timestamp, fallback = 3600) {
  const nums = String(timestamp || '').match(/\d+/g)?.map(Number) || [];
  if (nums.length >= 2 && nums[1] > nums[0]) {
    return Math.min(6500, Math.max(1800, (nums[1] - nums[0]) * 1000));
  }
  return fallback;
}

function loadCanvasImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  words.forEach(word => {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });

  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((row, index) => ctx.fillText(row, x, y + index * lineHeight));
  return Math.min(lines.length, maxLines) * lineHeight;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export default function PostForge() {
  const [pillar, setPillar] = useState(PILLARS[0]);
  const [format, setFormat] = useState('Carousel');
  const [items, setItems] = useState({ news: [], tool: [], income: [], transformation: [], automation: [] });
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState('Refresh the last 7 days of verified sources to begin.');
  const [freshnessDays, setFreshnessDays] = useState(PILLAR_FRESHNESS_DAYS.news);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [rejected, setRejected] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState(null);
  const [images, setImages] = useState([]);
  const [imageStatus, setImageStatus] = useState('');
  const [assetMode, setAssetMode] = useState('ai');
  const [canvaStatus, setCanvaStatus] = useState('');
  const [canvaResult, setCanvaResult] = useState(null);
  const [lastCanvaTemplateId, setLastCanvaTemplateId] = useState('');
  const [posting, setPosting] = useState(false);
  const [postStatus, setPostStatus] = useState('');
  const [copied, setCopied] = useState('');
  const [reelAssets, setReelAssets] = useState([]);
  const [reelStatus, setReelStatus] = useState('');
  const [reelVideoUrl, setReelVideoUrl] = useState('');
  const [renderingReel, setRenderingReel] = useState(false);

  const currentItems = useMemo(() => items[pillar.id] || [], [items, pillar.id]);
  const selectedItems = currentItems.filter(item => selected.includes(item.id));
  const publishReady = images.filter(img => img.success && img.imageUrl).length;
  const hasReadyAssets = !!images.length || !!reelAssets.length || assetMode === 'canva' || !!canvaStatus;

  function resetWorkspace(nextStatus = `Refresh verified sources for this ${PILLAR_FRESHNESS_DAYS[pillar.id] || 7}-day window.`) {
    setSelected([]);
    setOutput(null);
    setImages([]);
    setImageStatus('');
    setCanvaStatus('');
    setCanvaResult(null);
    setLastCanvaTemplateId('');
    setPostStatus('');
    setReelAssets([]);
    setReelStatus('');
    setReelVideoUrl('');
    setStatus(nextStatus);
  }

  function selectPillar(next) {
    setPillar(next);
    const days = PILLAR_FRESHNESS_DAYS[next.id] || 7;
    setFreshnessDays(days);
    resetWorkspace(`Refresh verified sources for this ${days}-day window.`);
  }

  async function refresh() {
    setLoading(true);
    const activeWindow = PILLAR_FRESHNESS_DAYS[pillar.id] || 7;
    resetWorkspace(`Searching the last ${activeWindow} days for ${pillar.full}...`);
    try {
      const res = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillar: pillar.id, pillarFull: pillar.full })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Refresh failed');
      setItems(prev => ({ ...prev, [pillar.id]: data.items }));
      setLastRefresh(data.refreshedAt || new Date().toISOString());
      setFreshnessDays(data.freshnessDays || activeWindow);
      setRejected(data.rejected || 0);
      setStatus(`Loaded ${data.items.length} verified source${data.items.length === 1 ? '' : 's'} from the last ${data.freshnessDays || activeWindow} days.`);
    } catch (error) {
      setItems(prev => ({ ...prev, [pillar.id]: [] }));
      setStatus(`Refresh failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function generate() {
    if (!selectedItems.length) return;
    setGenerating(true);
    setOutput(null);
    setImages([]);
    setImageStatus('');
    setCanvaStatus('');
    setCanvaResult(null);
    setLastCanvaTemplateId('');
    setPostStatus('');
    setReelAssets([]);
    setReelStatus('');
    setReelVideoUrl('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedItems, pillarFull: pillar.full, pillarId: pillar.id, format })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Generation failed');
      setOutput(data);
    } catch (error) {
      setStatus(`Generation failed: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  }

  async function generateImages() {
    if (!output?.slides?.length) return;
    setImageStatus('Generating 6 high-engagement carousel images...');
    setImages([]);
    setCanvaStatus('');
    setCanvaResult(null);
    setPostStatus('');
    setAssetMode('ai');
    try {
      const res = await fetch('/api/carousel-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook: output.hook,
          cover_text: output.cover_text,
          cover_subtext: output.cover_subtext,
          cover_visual_prompt: output.cover_visual_prompt,
          slides: output.slides,
          pillarId: pillar.id
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Image generation failed');
      setImages(data.images || []);
      if (data.uploadErrors?.length) {
        setImageStatus(`${data.successCount}/${data.totalCount} images generated. Blob upload blocked: ${data.uploadErrors[0]}`);
      } else {
        setImageStatus(`${data.successCount}/${data.totalCount} images generated. ${data.publicUrlCount ? 'Instagram-ready URLs created.' : 'Add BLOB_READ_WRITE_TOKEN for posting.'}`);
      }
    } catch (error) {
      setImageStatus(error.message);
    }
  }

  async function generateReelAssets() {
    if (!output?.script_segments?.length) return;
    setAssetMode('reel');
    setReelStatus('Generating faceless vertical Reel scenes...');
    setReelAssets([]);
    setReelVideoUrl('');
    setImages([]);
    setImageStatus('');
    setCanvaStatus('');
    setCanvaResult(null);
    setPostStatus('');
    try {
      const res = await fetch('/api/reel-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ output, pillarId: pillar.id })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Reel asset generation failed');
      setReelAssets(data.assets || []);
      setReelStatus(`${data.successCount}/${data.totalCount} faceless Reel scenes generated. Render a preview when ready.`);
    } catch (error) {
      setReelStatus(`Reel assets failed: ${error.message}`);
    }
  }

  async function renderReelPreview() {
    const readyAssets = reelAssets.filter(asset => asset.success && asset.image);
    if (!readyAssets.length) return;
    if (!window.MediaRecorder) {
      setReelStatus('Your browser does not support MediaRecorder. Download the scene assets and edit in CapCut/Canva.');
      return;
    }

    setRenderingReel(true);
    setReelVideoUrl('');
    setReelStatus('Rendering vertical Reel preview in your browser...');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext('2d');
      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      recorder.ondataavailable = event => {
        if (event.data?.size) chunks.push(event.data);
      };

      const finished = new Promise(resolve => {
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          resolve(URL.createObjectURL(blob));
        };
      });

      recorder.start();

      for (const asset of readyAssets) {
        const image = await loadCanvasImage(asset.image);
        const duration = segmentDurationMs(asset.timestamp);
        const start = performance.now();
        let elapsed = 0;

        while (elapsed < duration) {
          elapsed = performance.now() - start;
          const progress = Math.min(1, elapsed / duration);
          const scale = 1.08 + progress * 0.06;
          const drawW = canvas.width * scale;
          const drawH = (image.height / image.width) * drawW;
          const drawX = (canvas.width - drawW) / 2;
          const drawY = (canvas.height - drawH) / 2 - progress * 28;

          ctx.fillStyle = '#05070d';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, drawX, drawY, drawW, drawH);

          const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
          gradient.addColorStop(0, 'rgba(0,0,0,.68)');
          gradient.addColorStop(.34, 'rgba(0,0,0,.12)');
          gradient.addColorStop(.72, 'rgba(0,0,0,.22)');
          gradient.addColorStop(1, 'rgba(0,0,0,.78)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = 'rgba(8,12,22,.74)';
          ctx.strokeStyle = 'rgba(255,255,255,.16)';
          ctx.lineWidth = 3;
          roundRect(ctx, 70, 1048, 940, 452, 34);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 92px Arial';
          wrapCanvasText(ctx, asset.on_screen_text || 'WATCH THIS', 80, 170, 920, 96, 4);

          ctx.fillStyle = '#dbeafe';
          ctx.font = '700 44px Arial';
          wrapCanvasText(ctx, asset.voiceover || '', 105, 1138, 870, 58, 5);

          ctx.fillStyle = 'rgba(255,255,255,.22)';
          roundRect(ctx, 80, 1662, 920, 10, 5);
          ctx.fill();
          ctx.fillStyle = '#60a5fa';
          roundRect(ctx, 80, 1662, 920 * ((readyAssets.indexOf(asset) + progress) / readyAssets.length), 10, 5);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = '900 38px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('@aibyvineet', canvas.width / 2, 1815);
          ctx.textAlign = 'left';

          await new Promise(requestAnimationFrame);
        }
      }

      recorder.stop();
      const url = await finished;
      setReelVideoUrl(url);
      setReelStatus('Reel preview rendered. Download WebM, then add trending audio manually in Instagram/CapCut.');
    } catch (error) {
      setReelStatus(`Reel render failed: ${error.message}`);
    } finally {
      setRenderingReel(false);
    }
  }

  async function generateTemplateImages() {
    if (!output?.slides?.length) return;
    setImageStatus('Generating editable template backup...');
    setImages([]);
    setPostStatus('');
    setAssetMode('template');
    try {
      const res = await fetch('/api/template-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook: output.hook,
          cover_text: output.cover_text,
          cover_subtext: output.cover_subtext,
          slides: output.slides,
          pillarId: pillar.id
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Template generation failed');
      setImages(data.images || []);
      setImageStatus(`${data.successCount}/${data.totalCount} editable SVG template images generated.`);
    } catch (error) {
      setImageStatus(error.message);
    }
  }

  async function createCanvaDesign({ avoidLastTemplate = false } = {}) {
    if (!output?.slides?.length) return;
    setAssetMode('canva');
    setCanvaStatus('Creating an editable Canva carousel from the generated content...');
    setCanvaResult(null);
    setImages([]);
    setImageStatus('');
    setPostStatus('');
    try {
      const res = await fetch('/api/canva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook: output.hook,
          cover_text: output.cover_text,
          cover_subtext: output.cover_subtext,
          slides: output.slides,
          caption: output.caption,
          cta: output.cta,
          hashtags: output.hashtags || HASHTAGS_FALLBACK,
          avoidTemplateId: avoidLastTemplate ? lastCanvaTemplateId : ''
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setCanvaResult(data);
        throw new Error(data.error || 'Canva design creation failed');
      }
      setCanvaResult(data);
      setLastCanvaTemplateId(data.template?.id || '');
      setCanvaStatus(`Editable Canva design created${data.template?.name ? ` with ${data.template.name}` : ''}. Open it, tune the visual template, then export if you want a manual backup.`);
    } catch (error) {
      setCanvaStatus(`Canva failed: ${error.message}`);
    }
  }

  async function postToInstagram() {
    const imageUrls = images.filter(img => img.success && img.imageUrl).map(img => img.imageUrl);
    if (imageUrls.length < 2) {
      setPostStatus('Posting needs public image URLs. Add BLOB_READ_WRITE_TOKEN in Vercel and regenerate images.');
      return;
    }

    setPosting(true);
    setPostStatus('Publishing carousel to Instagram...');
    try {
      const res = await fetch('/api/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrls,
          caption: output?.caption || '',
          cta: output?.cta || '',
          hashtags: output?.hashtags || HASHTAGS_FALLBACK
        })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Instagram publishing failed');
      setPostStatus(data.permalink ? `Published: ${data.permalink}` : `Published to Instagram. Media ID: ${data.id}`);
    } catch (error) {
      setPostStatus(`Instagram publish failed: ${error.message}`);
    } finally {
      setPosting(false);
    }
  }

  function copy(text, key) {
    navigator.clipboard.writeText(text || '');
    setCopied(key);
    setTimeout(() => setCopied(''), 1200);
  }

  function download(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function downloadAsset(img) {
    const extension = img.type === 'template' ? 'svg' : 'png';
    download(img.image, `postforge-slide-${img.index + 1}.${extension}`);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Verified AI content cockpit</p>
          <h1>PostForge AI</h1>
          <p className="subhead">Find fresh sources, generate a curiosity-led carousel, create images, and publish to Instagram.</p>
          <div className="hero-badges">
            <span>🔎 Fresh sources</span>
            <span>🧲 Curiosity arc</span>
            <span>🎨 AI + template assets</span>
            <span>🚀 Instagram ready</span>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="floating-card card-a">
            <span>HOOK</span>
            <strong>THE GAP IS HERE</strong>
          </div>
          <div className="floating-card card-b">
            <span>PROOF</span>
            <strong>5 SOURCES</strong>
          </div>
          <div className="floating-card card-c">
            <span>POST</span>
            <strong>@aibyvineet</strong>
          </div>
        </div>
      </header>

      <Panel className="control-panel">
        <div className="pillar-tabs">
          {PILLARS.map(p => (
            <button key={p.id} className={`tab ${pillar.id === p.id ? 'active' : ''}`} style={{ '--accent': p.color }} onClick={() => selectPillar(p)}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="action-row">
          <select value={format} onChange={e => setFormat(e.target.value)}>
            {FORMATS.map(f => <option key={f}>{f}</option>)}
          </select>
          <Button onClick={refresh} disabled={loading}>{loading ? 'Checking sources...' : `Refresh ${pillar.full}`}</Button>
          <Button onClick={generate} disabled={generating || !selectedItems.length} variant="strong">{generating ? 'Writing...' : `Generate (${selectedItems.length})`}</Button>
        </div>

        <div className="metrics">
          <Metric label="Fresh window" value={`${freshnessDays} days`} tone="green" />
          <Metric label="Verified items" value={currentItems.length} />
          <Metric label="Selected" value={selectedItems.length} />
          <Metric label="Rejected stale" value={rejected} tone={rejected ? 'amber' : ''} />
        </div>

        <p className={`status ${status.includes('failed') ? 'error' : ''}`}>{status}</p>
      </Panel>

      <section className="workspace">
        <Panel>
          <div className="panel-head">
            <div>
              <p className="eyebrow">{pillar.full}</p>
              <h2>Verified Source Feed</h2>
            </div>
            {lastRefresh && <span className="small-note">Updated {new Date(lastRefresh).toLocaleTimeString()}</span>}
          </div>

          {!currentItems.length && (
            <div className="empty-state">
              <strong>No sources loaded</strong>
              <span>Refresh to fetch source-backed items inside this tab's verified freshness window.</span>
            </div>
          )}

          <div className="source-list">
            {currentItems.map(item => {
              const isSelected = selected.includes(item.id);
              return (
                <article key={item.id} className={`source-card ${isSelected ? 'selected' : ''}`} onClick={() => setSelected(prev => isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id])}>
                  <div className="source-meta">
                    {item.company && <span>{item.company}</span>}
                    <span>{item.source}</span>
                    <span>{item.publishedAt || item.date}</span>
                    <span className="fresh-badge">{itemAge(item)}</span>
                  </div>
                  <h3>{item.headline}</h3>
                  <p>{item.summary}</p>
                  <div className="source-actions">
                    <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Open source</a>
                    <span>{isSelected ? 'Selected' : 'Click to select'}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel>
          <div className="panel-head">
            <div>
              <p className="eyebrow">Creation plan</p>
              <h2>Generated Output</h2>
            </div>
            {output && (
              <Button variant="secondary" onClick={() => copy(output.script_segments ? reelCopy(output) : output.hook, output.script_segments ? 'reel' : 'hook')}>
                {copied === 'reel' ? 'Copied script' : copied === 'hook' ? 'Copied' : output.script_segments ? 'Copy script' : 'Copy hook'}
              </Button>
            )}
          </div>

          {!output && (
            <div className="empty-state">
              <strong>No post yet</strong>
              <span>Select verified sources, then generate a carousel plan.</span>
            </div>
          )}

          {output && (
            <div className="output-stack">
              <div className="hook-card">
                <span>Hook</span>
                <strong>{output.hook}</strong>
              </div>

              {output.slides && (
                <div className="story-arc">
                  {output.slides.map((s, i) => (
                    <article key={i} className="arc-step">
                      <span>{i + 2}. {s.role || 'slide'}</span>
                      <strong>{s.title}</strong>
                      <p>{s.body}</p>
                      {s.source_url && <a href={s.source_url} target="_blank" rel="noreferrer">{s.source}</a>}
                    </article>
                  ))}
                  <div className="asset-actions">
                    <Button onClick={() => { setAssetMode('ai'); generateImages(); }}>Generate AI Images</Button>
                    <Button variant="secondary" onClick={() => createCanvaDesign()}>Create Editable Canva</Button>
                  </div>
                  {imageStatus && <p className="small-note">{imageStatus}</p>}
                  {canvaStatus && <p className={`small-note ${canvaStatus.includes('failed') ? 'error' : ''}`}>{canvaStatus}</p>}
                </div>
              )}

              {output.script_segments && (
                <div className="story-arc reel-script">
                  {output.reel_angle && (
                    <article className="arc-step feature-step">
                      <span>Reel angle</span>
                      <strong>{output.reel_angle}</strong>
                      {output.cold_open_visual && <p>{output.cold_open_visual}</p>}
                    </article>
                  )}
                  {output.script_segments.map((s, i) => (
                    <article key={i} className="arc-step">
                      <span>{s.timestamp} / {s.beat || 'beat'}</span>
                      <strong>{s.on_screen_text || s.visual}</strong>
                      {s.voiceover && <p><b>Voiceover:</b> {s.voiceover}</p>}
                      {s.visual && <p><b>Visual:</b> {s.visual}</p>}
                      {s.edit_note && <p><b>Edit:</b> {s.edit_note}</p>}
                      {s.source_url && <a href={s.source_url} target="_blank" rel="noreferrer">{s.source || 'Open source'}</a>}
                    </article>
                  ))}
                  {output.shot_list?.length && (
                    <article className="arc-step">
                      <span>Faceless B-roll prompts</span>
                      {output.shot_list.map((shot, i) => <p key={i}>{i + 1}. {shot}</p>)}
                    </article>
                  )}
                  {output.music_suggestion && (
                    <article className="arc-step">
                      <span>Audio mood</span>
                      <strong>{output.music_suggestion}</strong>
                    </article>
                  )}
                  <div className="asset-actions">
                    <Button onClick={generateReelAssets}>Generate Reel Assets</Button>
                    <Button variant="secondary" onClick={renderReelPreview} disabled={!reelAssets.some(asset => asset.success) || renderingReel}>
                      {renderingReel ? 'Rendering...' : 'Render Reel Preview'}
                    </Button>
                  </div>
                  {reelStatus && <p className={`small-note ${reelStatus.includes('failed') ? 'error' : ''}`}>{reelStatus}</p>}
                </div>
              )}

              {output.stories && (
                <div className="story-arc">
                  {output.stories.map((s, i) => (
                    <article key={i} className="arc-step">
                      <span>Story {s.story_number || i + 1} / {s.type}</span>
                      <strong>{s.text_overlay}</strong>
                      {s.visual_direction && <p>{s.visual_direction}</p>}
                      {s.sticker_suggestion && <p><b>Sticker:</b> {s.sticker_suggestion}</p>}
                      {s.source_url && <a href={s.source_url} target="_blank" rel="noreferrer">{s.source || 'Open source'}</a>}
                    </article>
                  ))}
                </div>
              )}

              {output.caption_body && (
                <div className="hook-card">
                  <span>Caption body</span>
                  <p>{output.caption_body}</p>
                </div>
              )}

              <div className="caption-box">
                <div>
                  <span>Caption</span>
                  <p>{output.caption}</p>
                </div>
                <div>
                  <span>CTA</span>
                  <p>{output.cta}</p>
                </div>
                <div>
                  <span>5 hashtags</span>
                  <p>{output.hashtags || HASHTAGS_FALLBACK}</p>
                </div>
              </div>
            </div>
          )}
        </Panel>
      </section>

      {hasReadyAssets && (
        <Panel className="image-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Ready assets</p>
              <h2>{assetMode === 'canva' ? 'Canva Design' : assetMode === 'template' ? 'Template Backup' : assetMode === 'reel' ? 'Reel Assets' : 'Carousel Images'}</h2>
            </div>
            {assetMode === 'reel' ? (
              <Button onClick={renderReelPreview} disabled={renderingReel || !reelAssets.some(asset => asset.success)} variant="strong">
                {renderingReel ? 'Rendering...' : 'Render Reel Preview'}
              </Button>
            ) : assetMode === 'ai' ? (
              <Button onClick={postToInstagram} disabled={posting || publishReady < 2} variant="strong">
                {posting ? 'Posting...' : 'Post Carousel to Instagram'}
              </Button>
            ) : assetMode === 'canva' && canvaResult?.editUrl ? (
              <a className="btn strong link-btn" href={canvaResult.editUrl} target="_blank" rel="noreferrer">Open in Canva</a>
            ) : (
              <span className="small-note">Editable backup route. Use AI images for direct Instagram posting.</span>
            )}
          </div>

          {postStatus && <p className={`status ${postStatus.includes('failed') || postStatus.includes('needs') ? 'error' : ''}`}>{postStatus}</p>}

          {assetMode === 'reel' ? (
            <div className="reel-maker">
              {reelVideoUrl && (
                <div className="reel-preview">
                  <video src={reelVideoUrl} controls playsInline />
                  <a className="btn strong link-btn" href={reelVideoUrl} download="postforge-reel-preview.webm">Download Reel Preview</a>
                </div>
              )}
              <div className="image-grid">
                {reelAssets.map(asset => (
                  <article key={asset.index} className="image-card">
                    <span>{asset.label}</span>
                    {asset.success ? <img src={asset.image} alt={asset.label} /> : <p className="status error">{asset.error}</p>}
                    {asset.voiceover && <p className="small-note">{asset.voiceover}</p>}
                    {asset.success && <Button variant="secondary" onClick={() => download(asset.image, `postforge-reel-scene-${asset.index + 1}.png`)}>Download Scene</Button>}
                  </article>
                ))}
              </div>
            </div>
          ) : assetMode === 'canva' ? (
            <div className="canva-card">
              {canvaResult?.thumbnailUrl && <img src={canvaResult.thumbnailUrl} alt="Canva design preview" />}
              <div>
                <span className="eyebrow">Editable route</span>
                <h3>{canvaResult?.editUrl ? 'Your Canva carousel is ready' : 'Canva setup needed'}</h3>
                <p>{canvaStatus || 'Create an editable Canva design from the generated carousel copy.'}</p>
                {canvaResult?.template && (
                  <p className="template-pill">Template: {canvaResult.template.name} · {canvaResult.template.style}</p>
                )}
                {canvaResult?.editUrl && <a href={canvaResult.editUrl} target="_blank" rel="noreferrer">Open editable design</a>}
                {canvaResult?.viewUrl && <a href={canvaResult.viewUrl} target="_blank" rel="noreferrer">View design</a>}
                {output?.slides?.length && (
                  <Button variant="secondary" onClick={() => createCanvaDesign({ avoidLastTemplate: true })}>
                    Try Different Canva Template
                  </Button>
                )}
                {canvaResult?.setup && (
                  <ul>
                    {canvaResult.setup.map(step => <li key={step}>{step}</li>)}
                  </ul>
                )}
                {canvaResult?.canvaPrompt && (
                  <Button variant="secondary" onClick={() => copy(canvaResult.canvaPrompt, 'canvaPrompt')}>
                    {copied === 'canvaPrompt' ? 'Copied Canva prompt' : 'Copy Canva fallback prompt'}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="image-grid">
              {images.map(img => (
                <article key={img.index} className="image-card">
                  <span>{img.label}</span>
                  {img.success ? <img src={img.image} alt={img.label} /> : <p className="status error">{img.error}</p>}
                  {img.uploadError && <p className="status error">Public URL not created. Use a public Vercel Blob store for Instagram posting.</p>}
                  {img.success && <Button variant="secondary" onClick={() => downloadAsset(img)}>Download {img.type === 'template' ? 'SVG' : 'PNG'}</Button>}
                </article>
              ))}
            </div>
          )}
        </Panel>
      )}
    </main>
  );
}
