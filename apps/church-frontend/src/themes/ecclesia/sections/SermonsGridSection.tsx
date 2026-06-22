/* ── Sermons Grid Section ──────────────────────────── */
import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Headphones, BookOpen } from 'lucide-react';

const defaultSermons = [
  { image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=85', meta: 'Sunday Message', metaIcon: PlayCircle, title: 'The Power of a Spirit-Led Life', desc: "Discover how to follow God's direction with confidence, peace, and bold faith." },
  { image: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=85', meta: 'Audio Teaching', metaIcon: Headphones, title: 'Faith That Speaks', desc: "A practical teaching on prayer, confession, and standing on God's promises." },
  { image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=900&q=85', meta: 'Bible Study', metaIcon: BookOpen, title: 'Growing in Grace', desc: 'Learn how spiritual growth happens through the Word, fellowship, and service.' },
];

interface Props {
  data?: {
    heading?: string;
    items?: { image?: string; title: string; desc: string; meta?: string }[];
  };
}

const SermonsGridSection: React.FC<Props> = ({ data }) => {
  const heading = data?.heading || 'Sermons that strengthen your walk with God.';
  const sermons = data?.items || defaultSermons;

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-kicker">Latest messages</div>
          <h2>{heading}</h2>
        </div>
        <Link className="btn btn-soft" to="/sermons">View All Sermons</Link>
      </div>
      <div className="cards-3">
        {sermons.slice(0, 3).map((s, i) => {
          const Icon = (s as any).metaIcon || PlayCircle;
          return (
            <article className="sermon-card" key={i}>
              {s.image && <img src={s.image} alt={s.title} loading="lazy" />}
              <div className="card-body">
                <div className="meta"><Icon size={14} /> {s.meta || 'Message'}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default SermonsGridSection;
