import React, { useState, useEffect } from 'react';
import { useEcclesia } from '../EcclesiaContext';
import { Newspaper, User, Calendar, BookOpen, ChevronLeft, ArrowRight, Info } from 'lucide-react';
import { httpRequest } from '../../../http';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  postType: string;
  status: string;
  publishedAt: string | null;
  coverImageUrl: string | null;
  authorId: string | null;
  categoryId: string | null;
  category?: { name: string } | null;
  author?: { firstName: string; lastName: string } | null;
}

const MOCK_BLOGS: BlogPost[] = [
  {
    id: 'mock-blog-1',
    title: 'Walking in Divine Health: The Covenant Blueprint',
    slug: 'walking-in-divine-health',
    content: 'God\'s desire for His people is total health and wholeness. Scripture outlines our healing covenant. In this article, we examine how Jesus bore our sicknesses and how to walk daily in complete physical and spiritual health. Confessing the Word, eating properly, keeping our mind pure, and corporate prayer are major steps in activating this covenant.',
    excerpt: 'Learn how scripture outlines our healing covenant and how to walk daily in total health and spiritual vitality.',
    postType: 'article',
    status: 'published',
    publishedAt: new Date().toISOString(),
    coverImageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    authorId: 'auth-1',
    categoryId: 'cat-1',
    category: { name: 'Covenant Life' },
    author: { firstName: 'Pastor', lastName: 'David' }
  },
  {
    id: 'mock-blog-2',
    title: 'Developing a Consistent Prayer Life',
    slug: 'developing-consistent-prayer',
    content: 'Prayer is the lifeline of the believer. Five practical steps to cultivate a powerful daily communion with God: Set a scheduled time, choose a quiet chamber, use scriptures as outlines, intercede for others, and spend time listening. Consistent prayer builds spiritual muscle and brings major corporate breakthrough.',
    excerpt: 'Five practical steps to cultivate a powerful daily communion with God and build spiritual muscle.',
    postType: 'article',
    status: 'published',
    publishedAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    coverImageUrl: 'https://images.unsplash.com/photo-1544764200-d834fd210a22?auto=format&fit=crop&w=800&q=80',
    authorId: 'auth-2',
    categoryId: 'cat-2',
    category: { name: 'Prayer' },
    author: { firstName: 'Pastor', lastName: 'Grace' }
  },
  {
    id: 'mock-blog-3',
    title: 'The Grace Alignment of Covenant Giving',
    slug: 'grace-alignment-giving',
    content: 'Generosity is not a transaction; it is a heart alignment. How tithing, free-will offering, and missions partnership activate windows of heaven and fund local church impact. We examine the covenant laws of seeding and harvest, and how giving sets up the believer for supernatural abundance.',
    excerpt: 'How generosity opens the windows of heaven and transforms local communities through covenant seeding.',
    postType: 'article',
    status: 'published',
    publishedAt: new Date(Date.now() - 86400000 * 12).toISOString(), // 12 days ago
    coverImageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    authorId: 'auth-1',
    categoryId: 'cat-1',
    category: { name: 'Covenant Life' },
    author: { firstName: 'Pastor', lastName: 'David' }
  }
];

const BlogsPage: React.FC = () => {
  const { tenant } = useEcclesia();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  
  // Reading Mode States
  const [serifMode, setSerifMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const res = await httpRequest('/api/cms/blogs');
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          setPosts(json.data);
        } else {
          setPosts(MOCK_BLOGS);
        }
      } catch {
        setPosts(MOCK_BLOGS);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const categories = ['all', ...Array.from(new Set(posts.map(p => p.category?.name || 'General')))];

  const filteredPosts = posts.filter(p => {
    const categoryLabel = p.category?.name || 'General';
    return activeCategory === 'all' || categoryLabel === activeCategory;
  });

  if (selectedPost) {
    // Detailed Reader view
    return (
      <div className="section container">
        <button 
          onClick={() => setSelectedPost(null)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            border: 0, background: 'transparent', color: 'var(--accent)',
            fontWeight: 850, fontSize: '14px', cursor: 'pointer', marginBottom: '24px'
          }}
        >
          <ChevronLeft size={16} />
          <span>Back to Articles</span>
        </button>

        <article className="article-layout">
          <div>
            <span className="badge accent" style={{ marginBottom: '16px' }}>{selectedPost.category?.name || 'General'}</span>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', lineHeight: 1.1, letterSpacing: '-0.04em', margin: '0 0 24px' }}>
              {selectedPost.title}
            </h1>
            
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--muted)', fontWeight: 750, marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} style={{ color: 'var(--accent)' }} />
                <span>By {selectedPost.author ? `${selectedPost.author.firstName} ${selectedPost.author.lastName}` : 'Pastor David'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} style={{ color: 'var(--accent)' }} />
                <span>{selectedPost.publishedAt ? new Date(selectedPost.publishedAt).toLocaleDateString() : 'Today'}</span>
              </div>
            </div>

            {selectedPost.coverImageUrl && (
              <div style={{ 
                height: '420px', borderRadius: 'var(--radius-xl)', overflow: 'hidden', 
                backgroundImage: `url(${selectedPost.coverImageUrl})`, backgroundPosition: 'center', 
                backgroundSize: 'cover', boxShadow: 'var(--shadow)', marginBottom: '36px' 
              }} />
            )}

            {/* Reading Mode Settings */}
            <div style={{ 
              background: 'var(--surface-soft)', borderRadius: '16px', padding: '16px 24px', 
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
              flexWrap: 'wrap', gap: '16px', marginBottom: '32px' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Typography:</span>
                <button 
                  onClick={() => setSerifMode(false)}
                  style={{
                    border: '1px solid var(--border)', background: !serifMode ? 'var(--accent)' : 'white',
                    color: !serifMode ? 'white' : 'var(--text)', borderRadius: '8px', padding: '6px 12px',
                    fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  Sans-Serif
                </button>
                <button 
                  onClick={() => setSerifMode(true)}
                  style={{
                    border: '1px solid var(--border)', background: serifMode ? 'var(--accent)' : 'white',
                    color: serifMode ? 'white' : 'var(--text)', borderRadius: '8px', padding: '6px 12px',
                    fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'
                  }}
                >
                  Grace Serif
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Size:</span>
                <button 
                  onClick={() => setFontSize(prev => Math.max(14, prev - 2))}
                  style={{
                    width: '32px', height: '32px', border: '1px solid var(--border)', background: 'white',
                    borderRadius: '50%', fontSize: '16px', display: 'grid', placeItems: 'center', cursor: 'pointer'
                  }}
                >
                  A-
                </button>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{fontSize}px</span>
                <button 
                  onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
                  style={{
                    width: '32px', height: '32px', border: '1px solid var(--border)', background: 'white',
                    borderRadius: '50%', fontSize: '16px', display: 'grid', placeItems: 'center', cursor: 'pointer'
                  }}
                >
                  A+
                </button>
              </div>
            </div>

            <div 
              className={serifMode ? 'serif-mode' : ''} 
              style={{ 
                fontSize: `${fontSize}px`, 
                lineHeight: serifMode ? 2.0 : 1.75, 
                color: 'var(--text)',
                fontFamily: serifMode ? 'Georgia, serif' : 'inherit'
              }}
            >
              {selectedPost.content.split('\n\n').map((para, idx) => (
                <p key={idx} className={idx === 0 ? 'drop-cap' : ''} style={{ marginBottom: '24px' }}>
                  {para}
                </p>
              ))}
            </div>
          </div>
          
          {/* Article Sidebar */}
          <div className="article-sidebar">
            <div className="author-card">
              <h3>About the Author</h3>
              <div className="author-mini">
                <div className="avatar" style={{ backgroundColor: 'var(--accent)', color: 'white', display: 'grid', placeItems: 'center', fontWeight: 'bold' }}>
                  {selectedPost.author ? selectedPost.author.firstName.charAt(0) : 'P'}
                </div>
                <div>
                  <strong>{selectedPost.author ? `${selectedPost.author.firstName} ${selectedPost.author.lastName}` : 'Pastor David'}</strong>
                  <span style={{ display: 'block', fontSize: '12px', color: 'var(--muted)' }}>Ministry Team</span>
                </div>
              </div>
              <p className="muted" style={{ fontSize: '13px', marginTop: '12px', lineHeight: '1.5' }}>
                Dedicated to preaching covenant truths, guiding souls in spiritual warfare alignment, and writing study guides for the assembly.
              </p>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="section container">
      <div className="head" style={{ marginBottom: '40px' }}>
        <div>
          <span className="eyebrow"><Newspaper size={13} /> News, Study Guides & Articles</span>
          <h1 style={{ marginTop: '12px', marginBottom: '8px' }}>Church Blog</h1>
          <p className="lead">Read insights, declarations, and updates from the pastoral team at {tenant?.name || 'our assembly'}.</p>
        </div>
      </div>

      {/* Categories filter */}
      <div className="channels" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '32px' }}>
        {categories.map(cat => (
          <button 
            key={cat} 
            className={`channel-tab ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              border: '1px solid var(--border)',
              background: activeCategory === cat ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'white',
              color: activeCategory === cat ? 'var(--accent)' : 'var(--muted)',
              borderRadius: '999px',
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
          <p>Loading articles archive...</p>
        </div>
      ) : filteredPosts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', background: 'var(--surface-soft)' }}>
          <Info size={40} style={{ color: 'var(--accent)', marginBottom: '16px' }} />
          <h3>No Articles Found</h3>
          <p className="muted" style={{ marginTop: '8px' }}>There are no blog posts published under this category yet.</p>
        </div>
      ) : (
        <div className="postgrid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
          {filteredPosts.map(p => (
            <article 
              key={p.id} 
              className="post" 
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedPost(p)}
            >
              {p.coverImageUrl && (
                <div className="postimg" style={{ backgroundImage: `url(${p.coverImageUrl})` }}>
                  <div className="badges">
                    <span className="badge accent">{p.category?.name || 'General'}</span>
                  </div>
                </div>
              )}
              <div className="postbody" style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div className="meta">
                    <span>By {p.author ? `${p.author.firstName} ${p.author.lastName}` : 'Pastor David'}</span>
                    <span className="dot" style={{ margin: '0 8px' }}>•</span>
                    <span>{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : 'Today'}</span>
                  </div>
                  <h3 style={{ fontSize: '20px', margin: '4px 0 12px', letterSpacing: '-0.02em', lineHeight: '1.2' }}>{p.title}</h3>
                  <p className="muted" style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>{p.excerpt || p.content.substring(0, 140) + '...'}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', fontWeight: 'bold', fontSize: '14px', marginTop: 'auto' }}>
                  <span>Read Article</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlogsPage;
