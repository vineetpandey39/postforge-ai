'use client';

import { useMemo, useState } from 'react';
import './globals.css';
import { FORMATS, PILLARS } from './lib/validation';

const HASHTAGS_FALLBACK = '#AItools #AIautomation #AIforcreators #buildinpublic #creatorbusiness';

function Card({ children, style }) {
  return <div style={{ background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16, ...style }}>{children}</div>;
}

function Button({ children, onClick, disabled, variant = 'primary', style }) {
  const bg = variant === 'primary' ? '#6366F1' : variant === 'danger' ? '#EF4444' : 'rgba(255,255,255,0.08)';
  return <button onClick={onClick} disabled={disabled} style={{ background: bg, color: '#fff', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', fontWeight: 700, ...style }}>{children}</button>;
}

export default function PostForge() {
  const [pillar, setPillar] = useState(PILLARS[0]);
  const [format, setFormat] = useState('Carousel');
  const [items, setItems] = useState({ news: [], tool: [], income: [], transformation: [], automation: [] });
  const [selected, setSelected] = useState([]);
  const [status, setStatus] = useState('Refresh live verified content to begin.');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState(null);
  const [images, setImages] = useState([]);
  const [imageStatus, setImageStatus] = useState('');
  const [posting, setPosting] = useState(false);
  const [postStatus, setPostStatus] = useState('');
  const [copied, setCopied] = useState('');

  const currentItems = useMemo(() => items[pillar.id] || [], [items, pillar.id]);
  const selectedItems = currentItems.filter(item => selected.includes(item.id));

  function selectPillar(next) {
    setPillar(next);
    setSelected([]);
    setOutput(null);
    setImages([]);
    setImageStatus('');
    setPostStatus('');
    setStatus('Refresh live verified content to begin.');
  }

  async function refresh() {
    setLoading(true);
    setOutput(null);
    setImages([]);
    setPostStatus('');
    setSelected([]);
    setStatus(`Searching verified sources for ${pillar.full}...`);
    try {
      const res = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillar: pillar.id, pillarFull: pillar.full })
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Refresh failed');
      setItems(prev => ({ ...prev, [pillar.id]: data.items }));
      setStatus(`Loaded ${data.items.length} verified items. Select one or more to generate.`);
    } catch (error) {
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
      alert(error.message);
    } finally {
      setGenerating(false);
    }
  }

  async function generateImages() {
    if (!output?.slides?.length) return;
    setImageStatus('Generating 6 high-engagement carousel images...');
    setImages([]);
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
      setPostStatus('');
      setImageStatus(`${data.successCount}/${data.totalCount} images generated.`);
    } catch (error) {
      setImageStatus(error.message);
    }
  }

  async function postToInstagram() {
    const imageUrls = images.filter(img => img.success && img.imageUrl).map(img => img.imageUrl);
    if (imageUrls.length < 2) {
      setPostStatus('Instagram posting needs public image URLs. Add BLOB_READ_WRITE_TOKEN in Vercel and regenerate images.');
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

  return (
    <main style={{ maxWidth: 1120, margin: '0 auto', padding: 20 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32 }}>PostForge AI</h1>
          <p style={{ color: '#9CA3AF', margin: '6px 0 0' }}>Verified content generator for @aibyvineet</p>
        </div>
        <div style={{ color: '#22C55E', fontWeight: 800 }}>VERIFIED-ONLY</div>
      </header>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {PILLARS.map(p => <Button key={p.id} variant="secondary" onClick={() => selectPillar(p)} style={{ background: pillar.id === p.id ? p.color : 'rgba(255,255,255,0.07)' }}>{p.label}</Button>)}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={format} onChange={e => setFormat(e.target.value)} style={{ background: '#111827', color: '#fff', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 10, padding: '10px 12px' }}>
            {FORMATS.map(f => <option key={f}>{f}</option>)}
          </select>
          <Button onClick={refresh} disabled={loading}>{loading ? 'Refreshing...' : `Refresh ${pillar.full}`}</Button>
          <Button onClick={generate} disabled={generating || !selectedItems.length}>{generating ? 'Generating...' : `Generate (${selectedItems.length})`}</Button>
        </div>
        <p style={{ marginBottom: 0, color: status.includes('failed') ? '#FCA5A5' : '#CBD5E1' }}>{status}</p>
      </Card>

      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
        <Card>
          <h2 style={{ marginTop: 0 }}>{pillar.full} Feed</h2>
          {!currentItems.length && <p style={{ color: '#9CA3AF' }}>No preloaded fake content. Use Refresh to fetch verified live items.</p>}
          {currentItems.map(item => {
            const isSelected = selected.includes(item.id);
            return <div key={item.id} onClick={() => setSelected(prev => isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id])} style={{ padding: 12, borderRadius: 12, marginBottom: 10, cursor: 'pointer', background: isSelected ? `${pillar.color}22` : 'rgba(255,255,255,0.035)', border: `1px solid ${isSelected ? pillar.color : 'rgba(255,255,255,0.08)'}` }}>
              <div style={{ color: '#A5B4FC', fontSize: 12, fontWeight: 800 }}>{item.tag} · {item.source} · {item.date} · {item.verified ? 'Verified' : 'Unverified'}</div>
              <h3 style={{ margin: '6px 0', fontSize: 16 }}>{item.headline}</h3>
              <p style={{ margin: '0 0 8px', color: '#CBD5E1', fontSize: 14 }}>{item.summary}</p>
              <a href={item.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#60A5FA', fontSize: 12 }}>Open source</a>
            </div>;
          })}
        </Card>

        <Card>
          <h2 style={{ marginTop: 0 }}>Generated Output</h2>
          {!output && <p style={{ color: '#9CA3AF' }}>Your generated post will appear here.</p>}
          {output && <>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><h3>Hook</h3><Button variant="secondary" onClick={() => copy(output.hook, 'hook')}>{copied === 'hook' ? 'Copied' : 'Copy'}</Button></div>
            <p style={{ fontSize: 20, fontWeight: 800 }}>{output.hook}</p>

            {output.slides && <>
              <h3>Slides</h3>
              {output.slides.map((s, i) => <div key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, marginTop: 10 }}>
                <strong>{i + 1}. {s.role ? `${String(s.role).toUpperCase()} - ` : ''}{s.title}</strong>
                <p style={{ whiteSpace: 'pre-wrap', color: '#CBD5E1' }}>{s.body}</p>
                {s.source_url && <a href={s.source_url} target="_blank" rel="noreferrer" style={{ color: '#60A5FA', fontSize: 12 }}>{s.source}</a>}
              </div>)}
              <Button onClick={generateImages} style={{ marginTop: 14 }}>Generate 6 Viral Carousel Images</Button>
              {imageStatus && <p style={{ color: '#CBD5E1' }}>{imageStatus}</p>}
            </>}

            {output.script_segments && <>{output.script_segments.map((s, i) => <p key={i}><b>{s.timestamp}</b><br />Visual: {s.visual}<br />Voiceover: {s.voiceover}</p>)}</>}
            {output.stories && <>{output.stories.map((s, i) => <p key={i}><b>Story {s.story_number}</b><br />{s.text_overlay}<br />Sticker: {s.sticker_suggestion}</p>)}</>}
            {output.caption_body && <p style={{ whiteSpace: 'pre-wrap' }}>{output.caption_body}</p>}

            <h3>Caption</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: '#CBD5E1' }}>{output.caption}</p>
            <h3>CTA</h3><p>{output.cta}</p>
            <h3>Hashtags</h3><p style={{ color: '#CBD5E1' }}>{output.hashtags || HASHTAGS_FALLBACK}</p>
          </>}
        </Card>
      </section>

      {!!images.length && <Card style={{ marginTop: 16 }}>
        <h2 style={{ marginTop: 0 }}>Carousel Images</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 14 }}>
          <Button onClick={postToInstagram} disabled={posting || !images.some(img => img.imageUrl)}>
            {posting ? 'Posting...' : 'Post Carousel to Instagram'}
          </Button>
          {postStatus && <span style={{ color: postStatus.includes('failed') || postStatus.includes('needs') ? '#FCA5A5' : '#86EFAC' }}>{postStatus}</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {images.map(img => <div key={img.index}>
            <div style={{ color: '#CBD5E1', marginBottom: 6 }}>{img.label}</div>
            {img.success ? <img src={img.image} alt={img.label} style={{ width: '100%', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }} /> : <p style={{ color: '#FCA5A5' }}>{img.error}</p>}
            {img.success && <Button variant="secondary" onClick={() => download(img.image, `postforge-slide-${img.index + 1}.png`)} style={{ marginTop: 8, width: '100%' }}>Download</Button>}
          </div>)}
        </div>
      </Card>}
    </main>
  );
}
