/* ── Hero Section ───────────────────────────────────── */
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Headphones } from 'lucide-react';
import { useEcclesia } from '../EcclesiaContext';

interface Props {
  data: {
    heading?: string;
    subheading?: string;
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    bgImage?: string;
    actionCta?: { label: string; url: string };
    buttonText?: string;
    buttonUrl?: string;
  };
}

const HeroSection: React.FC<Props> = ({ data }) => {
  const { globalContent } = useEcclesia();
  const heading = data.heading || data.title || 'Find faith, family, and purpose in Christ.';
  const subheading = data.subheading || data.subtitle || '';
  const ctaLabel = data.actionCta?.label || data.buttonText || 'Plan Your Visit';
  const ctaUrl = data.actionCta?.url || data.buttonUrl || '/contact';
  const serviceTimes = globalContent?.services?.serviceTimes || [];
  const bgImage = data.backgroundImageUrl || data.bgImage;

  return (
    <section className="hero" id="home" style={bgImage ? { backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={14} /> Welcome home</span>
        <h1>{heading}</h1>
        {subheading && <p className="lead">{subheading}</p>}
        <div className="hero-actions">
          <Link className="btn btn-primary" to={ctaUrl}><MapPin size={16} /> {ctaLabel}</Link>
          <Link className="btn btn-light" to="/sermons"><Headphones size={16} /> Latest Sermon</Link>
        </div>
        {serviceTimes.length > 0 && (
          <div className="service-strip">
            {serviceTimes.slice(0, 3).map((s, i) => (
              <div className="mini-card" key={i}>
                <strong>{s.label}</strong>
                <span>{s.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="hero-media">
        <div className="floating-service">
          <div>
            <h3>Join us this Sunday</h3>
            <p>Experience worship, the Word, prayer, and a loving church family.</p>
          </div>
          <Link className="btn btn-primary" to="/contact">Get Directions</Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
