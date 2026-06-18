import React, { useState, useEffect } from 'react';
import { useEcclesia } from '../EcclesiaContext';
import { Search, Play, X, User, Calendar, Tag, Info } from 'lucide-react';
import { httpRequest } from '../../../http';

interface Sermon {
  id: string;
  title: string;
  description: string | null;
  type: string;
  providerType: string;
  providerKey: string;
  sourceUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  fileSizeBytes: number;
  mimeType: string;
  publishedAt: string | null;
  categoryId: string | null;
  seriesId: string | null;
  speakerId: string | null;
  speaker?: { name: string; title: string | null } | null;
  series?: { title: string } | null;
}

const MOCK_SERMONS: Sermon[] = [
  {
    id: 'mock-sermon-1',
    title: 'Navigating Seasons of Grace',
    description: 'Explore how to stand firm in every season of life and walk in the divine flow of God\'s unmerited favor.',
    type: 'video',
    providerType: 'youtube',
    providerKey: 'dQw4w9WgXcQ',
    sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 2400,
    fileSizeBytes: 5000000,
    mimeType: 'video/mp4',
    publishedAt: new Date().toISOString(),
    categoryId: 'cat-1',
    seriesId: 'ser-1',
    speakerId: 'spk-1',
    speaker: { name: 'Pastor David', title: 'Senior Pastor' },
    series: { title: 'Walking in Covenant' }
  },
  {
    id: 'mock-sermon-2',
    title: 'The Power of Corporate Prayer',
    description: 'When we gather to pray, things shift. Understanding the dimensions of united corporate intercession.',
    type: 'video',
    providerType: 'youtube',
    providerKey: 'dQw4w9WgXcQ',
    sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 1800,
    fileSizeBytes: 4000000,
    mimeType: 'video/mp4',
    publishedAt: new Date(Date.now() - 604800000).toISOString(),
    categoryId: 'cat-2',
    seriesId: 'ser-2',
    speakerId: 'spk-2',
    speaker: { name: 'Pastor Grace', title: 'Associate Pastor' },
    series: { title: 'Corporate Breakthrough' }
  },
  {
    id: 'mock-sermon-3',
    title: 'Living in Covenant Wealth',
    description: 'Discover the biblical blueprint for financial stewardship, abundance, and kingdom prosperity.',
    type: 'video',
    providerType: 'youtube',
    providerKey: 'dQw4w9WgXcQ',
    sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnailUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    durationSeconds: 3000,
    fileSizeBytes: 6000000,
    mimeType: 'video/mp4',
    publishedAt: new Date(Date.now() - 1209600000).toISOString(),
    categoryId: 'cat-1',
    seriesId: 'ser-1',
    speakerId: 'spk-1',
    speaker: { name: 'Pastor David', title: 'Senior Pastor' },
    series: { title: 'Walking in Covenant' }
  }
];

const SermonsPage: React.FC = () => {
  const { tenant } = useEcclesia();
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedSermon, setSelectedSermon] = useState<Sermon | null>(null);

  useEffect(() => {
    const loadSermons = async () => {
      try {
        const res = await httpRequest('/api/cms/sermons');
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          setSermons(json.data);
        } else {
          setSermons(MOCK_SERMONS);
        }
      } catch {
        setSermons(MOCK_SERMONS);
      } finally {
        setLoading(false);
      }
    };
    loadSermons();
  }, []);

  const categories = ['all', ...Array.from(new Set(sermons.map(s => s.series?.title || 'General')))];

  const filteredSermons = sermons.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) || 
      (s.description && s.description.toLowerCase().includes(search.toLowerCase())) ||
      (s.speaker?.name && s.speaker.name.toLowerCase().includes(search.toLowerCase()));

    const categoryLabel = s.series?.title || 'General';
    const matchesCategory = activeCategory === 'all' || categoryLabel === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="section container">
      <div className="head" style={{ marginBottom: '40px' }}>
        <div>
          <span className="eyebrow"><Tag size={13} /> Sermons & Media Archive</span>
          <h1 style={{ marginTop: '12px', marginBottom: '8px' }}>Watch & Listen</h1>
          <p className="lead">Feast on life-transforming sermons, deep scriptural teachings, and faith alignment studies from {tenant?.name || 'our church'}.</p>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div className="filters" style={{ marginBottom: '32px' }}>
        <div className="filtertop">
          <div className="searchwrap">
            <Search size={18} />
            <input 
              type="text" 
              className="search" 
              placeholder="Search sermons, speakers, or topics..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="selectwrap">
            <select 
              className="select"
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
            >
              <option value="all">All Series</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
          <p>Loading sermon archive...</p>
        </div>
      ) : filteredSermons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-soft)' }}>
          <Info size={40} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
          <h3>No Sermons Found</h3>
          <p className="muted" style={{ marginTop: '8px' }}>We couldn't find any sermons matching your criteria. Try resetting your filters.</p>
        </div>
      ) : (
        <div className="postgrid">
          {filteredSermons.map(s => (
            <article key={s.id} className="post" style={{ cursor: 'pointer' }} onClick={() => setSelectedSermon(s)}>
              <div className="postimg" style={{ backgroundImage: `url(${s.thumbnailUrl || 'https://images.unsplash.com/photo-1438029071396-1e831a7fa6d8?w=800'})` }}>
                <div className="badges">
                  <span className="badge accent">{s.series?.title || 'Standalone'}</span>
                  {s.durationSeconds && (
                    <span className="badge">{Math.round(s.durationSeconds / 60)} min duration</span>
                  )}
                </div>
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.25)', transition: 'background 0.3s ease'
                }} className="play-overlay">
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '50%', background: 'white',
                    display: 'grid', placeItems: 'center', boxShadow: 'var(--shadow)',
                    color: 'var(--accent)', transition: 'transform 0.2s ease'
                  }} className="play-btn-circle">
                    <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              </div>
              <div className="postbody">
                <div className="meta">
                  <span><User size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {s.speaker?.name || 'Guest Preacher'}</span>
                  {s.publishedAt && (
                    <>
                      <span className="dot" style={{ margin: '0 8px' }}>•</span>
                      <span><Calendar size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {new Date(s.publishedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </>
                  )}
                </div>
                <h3 style={{ fontSize: '22px', marginBottom: '12px' }}>{s.title}</h3>
                <p className="muted" style={{ fontSize: '14.5px', lineHeight: '1.6', margin: 0 }}>
                  {s.description || 'Watch the full video replay of this message.'}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Video Player Modal Popup */}
      {selectedSermon && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(24, 24, 27, 0.88)', zIndex: 99999,
          display: 'grid', placeItems: 'center', padding: '24px',
          backdropFilter: 'blur(10px)'
        }} onClick={() => setSelectedSermon(null)}>
          <div style={{
            width: '100%', maxWidth: '840px', background: 'var(--surface)',
            borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '18px 24px', borderBottom: '1px solid var(--border)'
            }}>
              <div>
                <span className="badge accent" style={{ fontSize: '10px', textTransform: 'uppercase' }}>{selectedSermon.series?.title || 'Sermons'}</span>
                <h3 style={{ margin: '4px 0 0', fontSize: '18px' }}>{selectedSermon.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedSermon(null)}
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: '1px solid var(--border)', background: 'transparent',
                  display: 'grid', placeItems: 'center', cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Embedded player mockup */}
            <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000' }}>
              <iframe 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                src={`https://www.youtube.com/embed/${selectedSermon.providerKey || 'dQw4w9WgXcQ'}?autoplay=1`}
                title={selectedSermon.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>

            <div style={{ padding: '24px' }}>
              <div className="meta" style={{ marginBottom: '12px' }}>
                <span>Preached by: <strong>{selectedSermon.speaker?.name || 'Guest Preacher'}</strong></span>
                {selectedSermon.speaker?.title && <span className="muted"> ({selectedSermon.speaker.title})</span>}
              </div>
              <p className="muted" style={{ margin: 0, fontSize: '15px', lineHeight: '1.6' }}>
                {selectedSermon.description || 'Watch the full video replay of this message. Feel free to share this with friends and family.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SermonsPage;
