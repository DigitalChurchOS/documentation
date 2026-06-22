/* ── About Panel Section ────────────────────────────── */
import React from 'react';
import { Link } from 'react-router-dom';
import { useEcclesia } from '../EcclesiaContext';

interface Props {
  data?: {
    heading?: string;
    text?: string;
    imageUrl?: string;
  };
}

const AboutPanelSection: React.FC<Props> = ({ data }) => {
  const { globalContent } = useEcclesia();
  const heading = data?.heading || 'We are building people, families, and communities through the Word.';
  const text = data?.text || globalContent?.churchIdentity?.description || 'Our services are warm, faith-filled, and designed to help you encounter Jesus, grow spiritually, and find a meaningful place to serve.';

  return (
    <section className="section">
      <div className="wide-panel">
        <div className="wide-image" />
        <div className="wide-content">
          <div className="section-kicker">About us</div>
          <h2>{heading}</h2>
          <p>{text}</p>
          <div className="hero-actions">
            <Link className="btn btn-primary" to="/ministries">Explore Ministries</Link>
            <Link className="btn btn-light" to="/about">Meet Our Church</Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPanelSection;
