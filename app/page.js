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

  const currentItems = useMemo(() => items[pillar.id] || [], [items, pillar.id]);
  const selectedItems = currentItems.filter(item => selected.includes(item.id));
  const publishReady = images.filter(img => img.success && img.imageUrl).length;
  const hasReadyAssets = !!images.length || assetMode === 'canva' || !!canvaStatus;

  function resetWorkspace(nextStatus = `Refresh verified sources for this ${PILLAR_FRESHNESS_DAYS[pillar.id] || 7}-day window.`) {
    setSelected([]);
    setOutput(null);
    setImages([]);
    setImageStatus('');
    setCanvaStatus('');
    setCanvaResult(null);
    setLastCanvaTemplateId('');
    setPostStatus('');
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
            {output && <Button variant="secondary" onClick={() => copy(output.hook, 'hook')}>{copied === 'hook' ? 'Copied' : 'Copy hook'}</Button>}
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
              <h2>{assetMode === 'canva' ? 'Canva Design' : assetMode === 'template' ? 'Template Backup' : 'Carousel Images'}</h2>
            </div>
            {assetMode === 'ai' ? (
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

          {assetMode === 'canva' ? (
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
