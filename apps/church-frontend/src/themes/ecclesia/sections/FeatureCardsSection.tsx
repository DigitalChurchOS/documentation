/* ── Feature Cards Section ──────────────────────────── */
import React from 'react';
import { Radio, BookOpen, HeartHandshake } from 'lucide-react';

const defaultFeatures = [
  { icon: Radio, title: 'Livestream Ready', desc: 'Promote live services, countdowns, and worship broadcasts from the homepage.' },
  { icon: BookOpen, title: 'Sermon Library', desc: 'Display latest sermons, series, devotionals, podcasts, and teaching archives.' },
  { icon: HeartHandshake, title: 'Prayer & Care', desc: 'Connect prayer requests, testimonies, pastoral care, and corporate prayer sessions.' },
];

interface Props {
  data?: {
    heading?: string;
    kicker?: string;
    note?: string;
    items?: { icon?: string; title: string; desc: string }[];
  };
}

const FeatureCardsSection: React.FC<Props> = ({ data }) => {
  const heading = data?.heading || 'A complete digital home for your church family.';
  const kicker = data?.kicker || 'Church life';
  const note = data?.note || 'Ecclesia supports every major church website need: services, sermons, livestream, prayer, events, ministries, giving, and new visitor connection.';

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-kicker">{kicker}</div>
          <h2>{heading}</h2>
        </div>
        <p className="section-note">{note}</p>
      </div>
      <div className="cards-3">
        {defaultFeatures.map((feat, i) => (
          <article className="feature-card" key={i}>
            <div className="feature-icon"><feat.icon size={24} /></div>
            <h3>{feat.title}</h3>
            <p>{feat.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default FeatureCardsSection;
