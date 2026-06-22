/* ── Giving CTA Section ─────────────────────────────── */
import React from 'react';
import { Link } from 'react-router-dom';
import { Gift } from 'lucide-react';

interface Props {
  data?: {
    heading?: string;
    text?: string;
    ctaLabel?: string;
    ctaUrl?: string;
  };
}

const GivingCTASection: React.FC<Props> = ({ data }) => {
  const heading = data?.heading || 'Your generosity helps us reach more people.';
  const text = data?.text || 'Partner with the work of the ministry through tithes, offerings, missions, outreach, and special church projects.';
  const ctaLabel = data?.ctaLabel || 'Give Online';
  const ctaUrl = data?.ctaUrl || '/giving';

  return (
    <section className="section">
      <div className="giving">
        <div className="section-kicker">Giving & Partnership</div>
        <h2>{heading}</h2>
        <p>{text}</p>
        <Link className="btn btn-primary" to={ctaUrl}><Gift size={16} /> {ctaLabel}</Link>
      </div>
    </section>
  );
};

export default GivingCTASection;
