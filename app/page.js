'use client';
import { useState } from 'react';

const HASHTAGS = '#AIIncome #PassiveIncome #AITools #MakeMoneyWithAI #AIAutomation #DigitalIncome #AIForBeginners #FutureOfWork #WorkSmart #AILife #MoneyMindset #SideHustle #OnlineIncome #AIRevolution #GrowthMindset #FinancialFreedom #AIContent #ContentCreator #AIBusiness #PassiveIncomeIdeas';
const FORMATS = ['Carousel', 'Reel Script', 'Story Hook', 'Caption Only'];
const PILLARS = [
  { id: 'news', label: '📡 News', full: '📡 News Breakdown', color: '#3B82F6' },
  { id: 'tool', label: '🛠️ Tools', full: '🛠️ AI Tool Drop', color: '#F59E0B' },
  { id: 'income', label: '💰 Income', full: '💰 Income Update', color: '#10B981' },
  { id: 'transformation', label: '✨ Transform', full: '✨ Transformation', color: '#8B5CF6' },
  { id: 'automation', label: '⚡ Automation', full: '⚡ Automation Win', color: '#EF4444' },
];

const SEED = {
  news: [
    { id: 'n1', tag: '🤖 Agent', date: 'Jun 1, 2026', source: 'Google I/O', headline: 'Google revamps Search and YouTube with full AI agent layer', summary: 'Google I/O 2026: Google revamped core search to handle both short queries and chatbot-style conversations. YouTube gets "Ask YouTube" — text answers plus video links.' },
    { id: 'n2', tag: '🔐 Policy', date: 'May 29, 2026', source: 'CNBC', headline: 'OpenAI grants EU access to GPT-5.5-Cyber — Anthropic holds out on Mythos', summary: 'OpenAI granted EU access to GPT-5.5-Cyber for vetted cybersecurity teams. Anthropic is still withholding Mythos. Government oversight of frontier AI is formalizing globally.' },
    { id: 'n3', tag: '🏢 Enterprise', date: 'May 19, 2026', source: 'Anthropic.com', headline: 'KPMG deploys Claude across its entire 276,000-person workforce', summary: 'KPMG announced a strategic alliance integrating Claude across 276,000+ employees. PwC is simultaneously deploying Claude for technology, deals, and enterprise reinvention.' },
    { id: 'n4', tag: '💻 Compute', date: 'May 2026', source: 'IMFounder', headline: 'Anthropic commits $200B to Google Cloud infrastructure', summary: 'Anthropic committed over $200 billion toward cloud infrastructure and chips in collaboration with Google Cloud. Whoever controls compute controls the future of every industry.' },
    { id: 'n5', tag: '⚖️ Law', date: 'May 29, 2026', source: 'Transparency Coalition', headline: 'California passes 30 AI bills — US regulation hits full speed', summary: 'Nearly all of California\'s 30 AI-related bills cleared their chamber ahead of the May 29 deadline, covering student privacy, chatbots, workplace surveillance, and AI in legal exams.' },
    { id: 'n6', tag: '💰 Chips', date: 'May 30, 2026', source: 'FX Leaders', headline: 'Micron hits $1 trillion — entire 2026 AI chip supply sold out', summary: 'Micron stock surged 88% in one month to $1 trillion market cap. AI memory chips for all of 2026 are completely sold out, with NVIDIA as the primary buyer.' },
  ],
  tool: [
    { id: 't1', tag: '🤖 Coding', date: 'Jun 2026', source: 'Anthropic', headline: 'Claude Code — autonomous coding from terminal to deployment', summary: 'Claude Code writes, debugs, and deploys full applications autonomously. Developers report eliminating 4–6 hours of daily coding. Free tier available.' },
    { id: 't2', tag: '🎬 Video', date: 'Jun 2026', source: 'TechCrunch', headline: 'Kling 3.0 — cinematic AI video at $0.08 per second', summary: 'Kling 3.0 produces cinematic-quality video with solved character consistency across scenes. Used by top faceless YouTube channels for under $0.08/second.' },
    { id: 't3', tag: '📊 Pipeline', date: 'Jun 2026', source: 'n8n Community', headline: 'n8n + Claude = zero-touch content pipeline under $3/video', summary: 'Combining n8n automation with Claude API creates fully autonomous content pipelines: trend detection → scripting → video → publishing. Under $3 per published video.' },
    { id: 't4', tag: '🎙️ Voice', date: 'Jun 2026', source: 'ElevenLabs', headline: 'ElevenLabs v3 — passes human blind test', summary: 'ElevenLabs v3 adds emotional range, breathing patterns, and natural pauses — indistinguishable from human voice in blind tests. Standard for top YouTube narrators.' },
    { id: 't5', tag: '🖼️ Image', date: 'Jun 2026', source: 'Ideogram', headline: 'Ideogram 3.0 — perfect text in AI images, Canva integrated', summary: 'Ideogram 3.0 solves AI text rendering with perfect readable text in generated images. Now directly integrated into Canva for instant social graphic creation.' },
    { id: 't6', tag: '🔍 SEO', date: 'Jun 2026', source: 'Ahrefs', headline: 'AI-optimized content outranks human-written 3:1 on Google', summary: 'Ahrefs data shows AI-optimized content ranks 3x more in Google\'s top 10 than manually written articles. Surfer AI + Claude is the dominant combination.' },
  ],
  income: [
    { id: 'i1', tag: '📺 YouTube', date: 'Jun 2026', source: 'Creator Economy', headline: 'Faceless AI YouTube channels averaging $4,200/month in 90 days', summary: 'Creators using AI-generated videos hit $4,200/month average in 90 days. Formula: trending topic → Claude script → Kling video → ElevenLabs voice → upload.' },
    { id: 'i2', tag: '🤖 Agency', date: 'Jun 2026', source: 'Indie Hackers', headline: 'Solo n8n agency hitting $12K/month with 3 clients', summary: 'Solo operators building n8n pipelines charge $2,000–5,000/month per client. Setup: 2 weeks. Maintenance: 2 hours/month. Near-passive after setup.' },
    { id: 'i3', tag: '📧 Newsletter', date: 'Jun 2026', source: 'Beehiiv', headline: 'AI newsletters hitting 10K subscribers in 60 days', summary: 'AI-written newsletters publishing daily grow 10x faster than weekly. At 10K subscribers, monetization averages $1,800–3,500/month from sponsorships alone.' },
    { id: 'i4', tag: '🔗 Affiliate', date: 'Jun 2026', source: 'Impact.com', headline: 'AI tool affiliates paying $50–500 per referral', summary: 'Claude Pro ($50/ref), ElevenLabs ($75/ref), Kling AI ($100/ref), n8n Cloud ($150/ref). Creators at 10K followers average $2,400/month from affiliates alone.' },
    { id: 'i5', tag: '📱 Instagram', date: 'Jun 2026', source: 'Creator IQ', headline: 'AI income pages monetizing at just 5K followers', summary: 'AI income niche pages hit $1,000/month at 5,000 followers using Stan Store — prompt packs, automation templates, mini-courses priced $27–97.' },
    { id: 'i6', tag: '📦 SaaS', date: 'Jun 2026', source: 'MicroSaaS Report', headline: 'Solo devs shipping AI micro-SaaS hitting $3K MRR in 6 weeks', summary: 'Developers using Claude Code ship micro-SaaS tools in 48-hour weekends. Average time to $1K MRR: 6 weeks. Top niches: content automation, lead gen, SEO.' },
  ],
  transformation: [
    { id: 'tr1', tag: '🧠 Mindset', date: 'Jun 2026', source: 'LinkedIn', headline: 'From 9-to-5 to $15K/month with AI in 6 months', summary: 'A former marketing manager replaced a $70K salary with AI income in 6 months spending $180/month on tools. Key shift: using AI as a business OS, not just a helper.' },
    { id: 'tr2', tag: '📈 Earnings', date: 'Jun 2026', source: 'Morning Brew', headline: 'AI early adopters earn 2.4x more than non-adopters', summary: 'Study of 40,000 workers: AI early adopters earn 2.4x more through promotions, freelance premiums, and side income vs peers in identical roles.' },
    { id: 'tr3', tag: '⏰ Time', date: 'Jun 2026', source: 'Productivity Study', headline: 'AI users reclaim 3.2 hours per day — 23 hours per week', summary: 'Global study of 12,000 workers: AI users gain 3.2 hours daily. Top uses: writing (47%), research (31%), scheduling (22%). 23 hours of reclaimed freedom every week.' },
    { id: 'tr4', tag: '🌱 First Win', date: 'Jun 2026', source: 'First 1K Community', headline: '78% of first-time online earners in 2026 used AI', summary: 'Survey of 3,400 first-time earners: 78% used AI to reach their first $1,000. Top paths: AI content creation, automation services, digital products.' },
    { id: 'tr5', tag: '🔄 Identity', date: 'Jun 2026', source: 'Harvard Business Review', headline: 'AI creates 1-person businesses matching 10-person teams', summary: 'HBR: AI enables solo operators matching output of 5–10 person teams. The emerging title: "AI-augmented founder." Output per person has never been higher.' },
    { id: 'tr6', tag: '🚀 Speed', date: 'Jun 2026', source: 'Creator Economy', headline: 'The 1,000-hour rule is dead — AI compresses years into days', summary: 'Skills that took 1,000 hours — editing, copywriting, coding, design — now take days with AI. The new advantage: knowing which AI does what, not manual skill accumulation.' },
  ],
  automation: [
    { id: 'a1', tag: '📺 Video', date: 'Jun 2026', source: 'n8n Community', headline: 'Full YouTube pipeline: trend to published in 4 hours, zero humans', summary: '7-step n8n: Google Trends → Claude script → Kling video → ElevenLabs voice → Shotstack edit → thumbnail → YouTube publish. Cost: $2.40/video, zero human input.' },
    { id: 'a2', tag: '📱 Social', date: 'Jun 2026', source: 'Make.com', headline: 'One brief auto-posts to Instagram, LinkedIn, X — 0 minutes daily', summary: 'Daily brief triggers Make.com: Claude writes captions, Ideogram generates visuals, Buffer schedules across all platforms. 5-minute setup, 0 daily effort.' },
    { id: 'a3', tag: '📧 Email', date: 'Jun 2026', source: 'ActiveCampaign', headline: 'AI email sequences converting 3x better than human-written', summary: 'Claude personalizes emails based on subscriber behavior — converting 3x higher than static sequences. Behavior trigger → Claude rewrites → sends. Zero manual work.' },
    { id: 'a4', tag: '💼 Clients', date: 'Jun 2026', source: 'Agency Automation', headline: 'Client onboarding: 2 hours to 3 minutes fully automated', summary: 'n8n: form → Stripe payment → DocuSign contract → Slack alert → calendar invite → welcome email → CRM update. 2 hours of work now takes 3 minutes.' },
    { id: 'a5', tag: '📊 Reports', date: 'Jun 2026', source: 'Airtable', headline: 'Weekly analytics reports auto-generated every Monday', summary: 'YouTube + Instagram analytics → Airtable → Claude writes insight report → auto-emailed Monday 8am. Replaces 3 hours of weekly analytics work completely.' },
    { id: 'a6', tag: '🤖 Support', date: 'Jun 2026', source: 'Intercom', headline: 'AI support bots resolving 84% of tickets in 12 seconds', summary: 'Claude-powered support bots resolve 84% of tickets automatically. Response time dropped from 4 hours to 12 seconds. Customer satisfaction scores unchanged.' },
  ],
};

export default function PostForge() {
  const [pillar, setPillar] = useState(PILLARS[0]);
  const [format, setFormat] = useState('Carousel');
  const [items, setItems] = useState(SEED);
  const [selected, setSelected] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [output, setOutput] = useState(null);
  const [canvaLoading, setCanvaLoading] = useState(false);
  const [canvaResult, setCanvaResult] = useState(null);
  const [copied, setCopied] = useState('');
  const [tab, setTab] = useState('feed');
  const [lastRefreshed, setLastRefreshed] = useState({});
  const [carouselImages, setCarouselImages] = useState(null);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesProgress, setImagesProgress] = useState('');

  const pc = pillar.color;
  const currentItems = items[pillar.id] || [];

  const switchPillar = (p) => {
    setPillar(p); setSelected([]); setOutput(null);
    setCanvaResult(null); setRefreshMsg(null); setCarouselImages(null); setImagesProgress('');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setRefreshMsg({ type: 'info', text: `🔴 Searching live web for ${pillar.full} content...` });
    try {
      const res = await fetch('/api/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pillar: pillar.id, pillarFull: pillar.full }),
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setItems(prev => ({ ...prev, [pillar.id]: data }));
        setSelected([]);
        const now = new Date().toLocaleTimeString();
        setLastRefreshed(prev => ({ ...prev, [pillar.id]: now }));
        setRefreshMsg({ type: 'success', text: `✅ ${data.length} fresh stories loaded at ${now}` });
      } else {
        throw new Error(data.error || 'No content returned');
      }
    } catch (e) {
      setRefreshMsg({ type: 'warn', text: `⚠️ ${e.message}. Using pre-loaded content.` });
    }
    setRefreshing(false);
  };

  const handleGenerate = async () => {
    const selItems = currentItems.filter(i => selected.includes(i.id));
    if (!selItems.length) return;
    setGenerating(true); setOutput(null); setCanvaResult(null); setCarouselImages(null); setImagesProgress('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedItems: selItems, pillarFull: pillar.full, pillarId: pillar.id, format }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setOutput(data); setTab('output');
    } catch (e) { alert(`Generation failed: ${e.message}`); }
    setGenerating(false);
  };

  const handleCanva = async () => {
    if (!output) return;
    setCanvaLoading(true); setCanvaResult(null);
    try {
      const res = await fetch('/api/canva', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook: output.hook,
          slides: output.slides,
          canva_brief: output.canva_brief,
          pillarId: pillar.id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCanvaResult({ url: data.canvaUrl, message: data.message });
    } catch (e) { setCanvaResult({ error: e.message || 'Canva failed.' }); }
    setCanvaLoading(false);
  };

  const handleGenerateCarouselImages = async () => {
    if (!output || !output.slides) return;
    setImagesLoading(true);
    setCarouselImages(null);
    setImagesProgress(`Generating ${1 + output.slides.length} slide visuals — this takes ~1-2 minutes...`);
    try {
      const res = await fetch('/api/carousel-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hook: output.hook,
          cover_text: output.cover_text,
          cover_subtext: output.cover_subtext,
          slides: output.slides,
          pillarId: pillar.id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCarouselImages(data.images || []);
      setImagesProgress(`✅ ${data.successCount}/${data.totalCount} slides generated`);
    } catch (e) {
      setImagesProgress('');
      alert(`Image generation failed: ${e.message}`);
    }
    setImagesLoading(false);
  };

  const downloadImage = (dataUrl, filename) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(''), 2000);
  };

  const CopyBtn = ({ text, id }) => (
    <button onClick={() => copy(text, id)} style={{ background: copied === id ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)', border: `1px solid ${copied === id ? '#10B981' : 'rgba(255,255,255,0.12)'}`, color: copied === id ? '#10B981' : '#9CA3AF', borderRadius: '6px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer' }}>
      {copied === id ? '✓' : 'Copy'}
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#07090F', fontFamily: "'DM Sans','Segoe UI',sans-serif", color: '#E8EAF0' }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(7,9,15,0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg,#F59E0B,#EF4444)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>⚡</div>
        <div>
          <div style={{ fontWeight: '700', fontSize: '14px' }}>PostForge AI</div>
          <div style={{ fontSize: '10px', color: '#6B7280' }}>@aibyvineet · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', padding: '3px 10px' }}>
          <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '10px', color: '#10B981', fontWeight: '700' }}>LIVE</span>
        </div>
      </div>

      {/* Pillars */}
      <div style={{ display: 'flex', gap: '5px', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', overflowX: 'auto' }}>
        {PILLARS.map(p => (
          <button key={p.id} onClick={() => switchPillar(p)} style={{ flexShrink: 0, padding: '6px 14px', borderRadius: '20px', border: `1px solid ${pillar.id === p.id ? p.color : 'rgba(255,255,255,0.07)'}`, background: pillar.id === p.id ? `${p.color}18` : 'transparent', color: pillar.id === p.id ? p.color : '#6B7280', fontSize: '12px', fontWeight: pillar.id === p.id ? '700' : '400', cursor: 'pointer', whiteSpace: 'nowrap' }}>{p.label}</button>
        ))}
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '14px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '3px', marginBottom: '14px' }}>
          {['feed', 'output'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '7px', borderRadius: '6px', border: 'none', background: tab === t ? 'rgba(255,255,255,0.08)' : 'transparent', color: tab === t ? '#E8EAF0' : '#6B7280', fontSize: '12px', fontWeight: tab === t ? '600' : '400', cursor: 'pointer' }}>
              {t === 'feed' ? `${pillar.label} Feed (${selected.length} selected)` : `⚡ Post${output ? ' ✅' : ''}`}
            </button>
          ))}
        </div>

        {/* Feed Tab */}
        {tab === 'feed' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '600' }}>{pillar.full}</div>
                <div style={{ fontSize: '10px', color: '#4B5563', marginTop: '2px' }}>
                  {lastRefreshed[pillar.id] ? `✅ Refreshed: ${lastRefreshed[pillar.id]}` : 'Pre-loaded · Tap Refresh for live news'}
                </div>
              </div>
              <button onClick={handleRefresh} disabled={refreshing} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: refreshing ? 'rgba(255,255,255,0.03)' : 'rgba(59,130,246,0.12)', border: `1px solid ${refreshing ? 'rgba(255,255,255,0.07)' : 'rgba(59,130,246,0.3)'}`, color: refreshing ? '#4B5563' : '#60A5FA', borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: '600', cursor: refreshing ? 'not-allowed' : 'pointer' }}>
                <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>🔄</span>
                {refreshing ? 'Searching...' : 'Refresh Now'}
              </button>
            </div>

            {refreshMsg && (
              <div style={{ background: refreshMsg.type === 'success' ? 'rgba(16,185,129,0.08)' : refreshMsg.type === 'warn' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)', border: `1px solid ${refreshMsg.type === 'success' ? 'rgba(16,185,129,0.2)' : refreshMsg.type === 'warn' ? 'rgba(245,158,11,0.2)' : 'rgba(59,130,246,0.2)'}`, borderRadius: '8px', padding: '9px 12px', fontSize: '11px', color: refreshMsg.type === 'success' ? '#10B981' : refreshMsg.type === 'warn' ? '#FCD34D' : '#93C5FD', marginBottom: '10px' }}>
                {refreshMsg.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
              <button onClick={() => setSelected(currentItems.map(i => i.id))} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>Select All</button>
              <button onClick={() => setSelected([])} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9CA3AF', borderRadius: '6px', padding: '4px 10px', fontSize: '11px', cursor: 'pointer' }}>Clear</button>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#4B5563' }}>{selected.length} selected</span>
            </div>

            {currentItems.map(item => {
              const sel = selected.includes(item.id);
              return (
                <div key={item.id} onClick={() => setSelected(prev => sel ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                  style={{ background: sel ? `${pc}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${sel ? pc + '44' : 'rgba(255,255,255,0.06)'}`, borderRadius: '10px', padding: '11px 13px', cursor: 'pointer', marginBottom: '7px', display: 'flex', gap: '10px' }}>
                  <div style={{ width: '17px', height: '17px', borderRadius: '5px', flexShrink: 0, marginTop: '2px', background: sel ? pc : 'rgba(255,255,255,0.05)', border: `1px solid ${sel ? pc : 'rgba(255,255,255,0.1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#fff' }}>{sel ? '✓' : ''}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '6px', marginBottom: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: pc, background: pc + '20', borderRadius: '20px', padding: '1px 7px', border: `1px solid ${pc}33` }}>{item.tag}</span>
                      <span style={{ fontSize: '10px', color: '#4B5563' }}>{item.source} · {item.date}</span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: '#E8EAF0', marginBottom: '3px' }}>{item.headline}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', lineHeight: '1.6' }}>{item.summary}</div>
                  </div>
                </div>
              );
            })}

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px', margin: '10px 0' }}>
              <div style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Format</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {FORMATS.map(f => (
                  <button key={f} onClick={() => setFormat(f)} style={{ background: format === f ? 'rgba(245,158,11,0.14)' : 'rgba(255,255,255,0.03)', border: `1px solid ${format === f ? '#F59E0B' : 'rgba(255,255,255,0.07)'}`, color: format === f ? '#F59E0B' : '#6B7280', borderRadius: '8px', padding: '6px 13px', fontSize: '12px', cursor: 'pointer', fontWeight: format === f ? '600' : '400' }}>{f}</button>
                ))}
              </div>
            </div>

            <button onClick={handleGenerate} disabled={generating || selected.length === 0} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: '10px', background: generating || selected.length === 0 ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg,${pc},${({ news: '#6366F1', tool: '#EF4444', income: '#06B6D4', transformation: '#EC4899', automation: '#F59E0B' })[pillar.id]})`, color: generating || selected.length === 0 ? '#4B5563' : '#fff', fontSize: '13px', fontWeight: '700', cursor: generating || selected.length === 0 ? 'not-allowed' : 'pointer' }}>
              {generating ? '⚡ Generating...' : selected.length === 0 ? 'Select content above' : `⚡ Generate ${pillar.full} (${selected.length} items)`}
            </button>
          </div>
        )}

        {/* Output Tab */}
        {tab === 'output' && output && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', background: `${pc}10`, border: `1px solid ${pc}28`, borderRadius: '8px', marginBottom: '10px', fontSize: '11px' }}>
              <span style={{ color: pc, fontWeight: '700' }}>{pillar.full}</span>
              <span style={{ color: '#6B7280' }}>· {format} · {selected.length} source{selected.length > 1 ? 's' : ''}</span>
            </div>

            {/* Hook — shown for all formats */}
            <div style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(239,68,68,0.07))', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>🪝 Hook</span>
                <CopyBtn text={output.hook} id="hook" />
              </div>
              <div style={{ fontSize: '18px', fontWeight: '800', color: '#FBBF24', lineHeight: '1.3', letterSpacing: '-0.3px' }}>{output.hook}</div>
            </div>

            {/* ===== CAROUSEL ===== */}
            {format === 'Carousel' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>📄 Slides</span>
                  <CopyBtn text={(output.slides || []).map((s, i) => `Slide ${i + 1}: ${s.title}\n${s.body}`).join('\n\n')} id="slides" />
                </div>
                {(output.slides || []).map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '9px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px' }}>
                    <div style={{ minWidth: '22px', height: '22px', background: pc + '20', border: `1px solid ${pc}40`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: pc, flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '12px', color: '#E8EAF0', marginBottom: '3px' }}>{s.title}</div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', lineHeight: '1.6' }}>{s.body}</div>
                      {s.source && <div style={{ fontSize: '10px', color: '#10B981', marginTop: '3px', fontWeight: '600' }}>📰 {s.source}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ===== REEL SCRIPT ===== */}
            {format === 'Reel Script' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>🎬 Shot-by-Shot Script</span>
                  <CopyBtn text={(output.script_segments || []).map(s => `[${s.timestamp}]\nVisual: ${s.visual}\nVoiceover/Text: ${s.voiceover}`).join('\n\n')} id="script" />
                </div>
                {(output.script_segments || []).map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: '9px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '10px 12px', marginBottom: '6px' }}>
                    <div style={{ minWidth: '52px', height: '22px', background: pc + '20', border: `1px solid ${pc}40`, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: pc, flexShrink: 0 }}>{s.timestamp}</div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginBottom: '3px' }}><span style={{ color: '#8B5CF6', fontWeight: '700' }}>🎥 Visual:</span> {s.visual}</div>
                      <div style={{ fontWeight: '700', fontSize: '12px', color: '#E8EAF0' }}><span style={{ color: '#F59E0B' }}>🗣️</span> {s.voiceover}</div>
                      {s.source && <div style={{ fontSize: '10px', color: '#10B981', marginTop: '3px', fontWeight: '600' }}>📰 {s.source}</div>}
                    </div>
                  </div>
                ))}
                {output.music_suggestion && (
                  <div style={{ marginTop: '8px', padding: '8px 10px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: '7px', fontSize: '11px', color: '#C4B5FD' }}>
                    🎵 <strong>Audio:</strong> {output.music_suggestion}
                  </div>
                )}
              </div>
            )}

            {/* ===== STORY HOOK ===== */}
            {format === 'Story Hook' && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>📲 Story Sequence</span>
                  <CopyBtn text={(output.stories || []).map(s => `Story ${s.story_number} (${s.type}): ${s.text_overlay}\nSticker: ${s.sticker_suggestion}\nVisual: ${s.visual_direction}`).join('\n\n')} id="stories" />
                </div>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {(output.stories || []).map((s, i) => (
                    <div key={i} style={{ minWidth: '150px', flexShrink: 0, background: 'rgba(255,255,255,0.02)', border: `1px solid ${pc}33`, borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', aspectRatio: '9/16', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '9px', fontWeight: '700', color: pc, textTransform: 'uppercase', marginBottom: '6px' }}>Story {s.story_number} · {s.type}</div>
                        <div style={{ fontWeight: '800', fontSize: '13px', color: '#E8EAF0', lineHeight: '1.3' }}>{s.text_overlay}</div>
                      </div>
                      <div>
                        {s.sticker_suggestion && s.sticker_suggestion !== 'none' && (
                          <div style={{ fontSize: '10px', color: '#F59E0B', marginBottom: '4px' }}>🏷️ {s.sticker_suggestion}</div>
                        )}
                        <div style={{ fontSize: '10px', color: '#6B7280', lineHeight: '1.5' }}>🖼️ {s.visual_direction}</div>
                        {s.source && <div style={{ fontSize: '9px', color: '#10B981', marginTop: '4px', fontWeight: '600' }}>📰 {s.source}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== CAPTION ONLY ===== */}
            {format === 'Caption Only' && output.caption_body && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>📝 Full Post Body</span>
                  <CopyBtn text={output.caption_body} id="caption_body" />
                </div>
                <div style={{ fontSize: '13px', color: '#D1D5DB', lineHeight: '1.8', whiteSpace: 'pre-line' }}>{output.caption_body}</div>
              </div>
            )}

            {/* Caption / CTA / hashtags — shown for all formats */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>✍️ {format === 'Caption Only' ? 'Ready-to-Post Caption' : 'Caption'}</span>
                <CopyBtn text={`${output.caption}\n\n${output.cta}\n\n${output.hashtags}`} id="caption" />
              </div>
              <div style={{ fontSize: '12px', color: '#D1D5DB', lineHeight: '1.7', marginBottom: '7px', whiteSpace: 'pre-line' }}>{output.caption}</div>
              <div style={{ fontSize: '12px', color: '#F59E0B', fontWeight: '600', marginBottom: '7px' }}>👉 {output.cta}</div>
              <div style={{ fontSize: '10px', color: '#4B5563', lineHeight: '1.9' }}>{output.hashtags}</div>
              {output.hashtag_strategy && (
                <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: '7px', fontSize: '10px', color: '#93C5FD', lineHeight: '1.6' }}>
                  💡 <strong>Hashtag Strategy:</strong> {output.hashtag_strategy}
                </div>
              )}
            </div>

            {/* Canva brief */}
            <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: '12px', padding: '14px 16px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '10px', color: '#8B5CF6', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.07em' }}>🎨 {format === 'Carousel' ? 'Canva Brief' : 'Visual Direction'}</span>
                <CopyBtn text={output.canva_brief} id="brief" />
              </div>
              <div style={{ fontSize: '11px', color: '#C4B5FD', lineHeight: '1.6' }}>{output.canva_brief}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '7px', marginBottom: '10px', fontSize: '11px', color: '#10B981' }}>
              ✅ {selected.length} verified source{selected.length > 1 ? 's' : ''} · {lastRefreshed[pillar.id] ? `Refreshed ${lastRefreshed[pillar.id]}` : 'Pre-loaded'} · Zero fabrication
            </div>

            {/* Generate Carousel Images via ChatGPT — primary action for Carousel format */}
            {format === 'Carousel' && (
              <>
                <button onClick={handleGenerateCarouselImages} disabled={imagesLoading} style={{ width: '100%', padding: '13px', border: 'none', borderRadius: '9px', background: imagesLoading ? 'rgba(255,255,255,0.04)' : 'linear-gradient(135deg,#10B981,#059669)', color: imagesLoading ? '#4B5563' : '#fff', fontSize: '13px', fontWeight: '700', cursor: imagesLoading ? 'not-allowed' : 'pointer', marginBottom: '8px' }}>
                  {imagesLoading ? '🖼️ Generating slide visuals...' : `🖼️ Generate ${1 + (output.slides || []).length} Carousel Images`}
                </button>

                {imagesProgress && (
                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', padding: '9px 12px', fontSize: '11px', color: '#10B981', marginBottom: '10px', textAlign: 'center' }}>
                    {imagesLoading && <span style={{ display: 'inline-block', marginRight: '6px', animation: 'spin 1s linear infinite' }}>⏳</span>}
                    {imagesProgress}
                  </div>
                )}

                {/* Generated images grid */}
                {carouselImages && carouselImages.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '10px' }}>
                    {carouselImages.map((img, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', overflow: 'hidden' }}>
                        {img.success ? (
                          <>
                            <img src={img.image} alt={img.label} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover', display: 'block' }} />
                            <div style={{ padding: '8px 10px' }}>
                              <div style={{ fontSize: '10px', color: '#9CA3AF', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {i === 0 ? '🪝 Cover' : `📄 Slide ${i + 1}`}
                              </div>
                              <button onClick={() => downloadImage(img.image, `aibyvineet-${pillar.id}-slide-${i + 1}.png`)} style={{ width: '100%', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', borderRadius: '6px', padding: '5px', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>
                                ⬇ Download
                              </button>
                            </div>
                          </>
                        ) : (
                          <div style={{ aspectRatio: '2/3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '10px', textAlign: 'center' }}>
                            <span style={{ fontSize: '20px', marginBottom: '6px' }}>⚠️</span>
                            <span style={{ fontSize: '10px', color: '#FCA5A5' }}>{img.error || 'Failed'}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {carouselImages && carouselImages.length > 0 && carouselImages.every(i => i.success) && (
                  <button onClick={() => carouselImages.forEach((img, i) => setTimeout(() => downloadImage(img.image, `aibyvineet-${pillar.id}-slide-${i + 1}.png`), i * 300))} style={{ width: '100%', padding: '10px', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', background: 'rgba(16,185,129,0.08)', color: '#10B981', fontSize: '12px', fontWeight: '700', cursor: 'pointer', marginBottom: '8px' }}>
                    ⬇ Download All {carouselImages.length} Slides
                  </button>
                )}
              </>
            )}

            {/* Canva — optional alternative */}
            {format === 'Carousel' && (
              <button onClick={handleCanva} disabled={canvaLoading} style={{ width: '100%', padding: '10px', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '9px', background: canvaLoading ? 'rgba(255,255,255,0.04)' : 'rgba(124,58,237,0.08)', color: canvaLoading ? '#4B5563' : '#A78BFA', fontSize: '12px', fontWeight: '600', cursor: canvaLoading ? 'not-allowed' : 'pointer', marginBottom: '8px' }}>
                {canvaLoading ? '🎨 Creating in Canva...' : '🎨 Or try Canva instead (optional)'}
              </button>
            )}

            {canvaResult && (
              <div style={{ background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: '9px', padding: '12px 14px', marginBottom: '8px' }}>
                {canvaResult.url
                  ? <><div style={{ fontSize: '12px', color: '#A78BFA', fontWeight: '700', marginBottom: '8px' }}>✅ Canva Design Ready!</div><a href={canvaResult.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#7C3AED,#2563EB)', color: '#fff', borderRadius: '7px', padding: '8px 16px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}>Open in Canva →</a></>
                  : <div style={{ fontSize: '11px', color: '#6B7280' }}>{canvaResult.error || canvaResult.message || 'Check your Canva account.'}</div>}
              </div>
            )}

            <button onClick={() => { setOutput(null); setSelected([]); setCanvaResult(null); setCarouselImages(null); setImagesProgress(''); setTab('feed'); }} style={{ width: '100%', padding: '9px', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', color: '#6B7280', fontSize: '11px', cursor: 'pointer' }}>← New Post</button>
          </div>
        )}

        {tab === 'output' && !output && (
          <div style={{ textAlign: 'center', padding: '50px 20px' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>⚡</div>
            <div style={{ fontSize: '13px', color: '#6B7280' }}>No post yet — go to feed and generate</div>
            <button onClick={() => setTab('feed')} style={{ marginTop: '12px', background: `linear-gradient(135deg,${pc},#6366F1)`, border: 'none', borderRadius: '8px', color: '#fff', padding: '9px 18px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>← Back to Feed</button>
          </div>
        )}
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
