/* ── Ministries Section ─────────────────────────────── */
import React from 'react';
import { Link } from 'react-router-dom';
import { Network } from 'lucide-react';

interface Props {
  data?: {
    heading?: string;
    items?: { name: string; desc: string }[];
  };
}

const defaultMinistries = [
  { name: 'NextGen Youth', desc: 'Youth services, mentorship, creative teams, and campus outreach.' },
  { name: 'Prayer & Testimony Hub', desc: 'Prayer requests, testimony moderation, prayer rooms, and corporate prayer schedules.' },
  { name: 'Digital Media Team', desc: 'Livestream, sermon clips, podcast publishing, and social media campaigns.' },
];

const MinistriesSection: React.FC<Props> = ({ data }) => {
  const heading = data?.heading || 'Featured Ministry Pathways';
  const items = data?.items || defaultMinistries;

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-kicker">Get involved</div>
          <h2>{heading}</h2>
        </div>
        <Link className="btn btn-soft" to="/ministries">All Ministries</Link>
      </div>
      <div className="cards-3">
        {items.slice(0, 3).map((m, i) => (
          <article className="feature-card" key={i}>
            <div className="feature-icon"><Network size={22} /></div>
            <h3>{m.name}</h3>
            <p>{m.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default MinistriesSection;
