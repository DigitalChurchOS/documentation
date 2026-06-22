/* ── Service Times Section ──────────────────────────── */
import React from 'react';
import { useEcclesia } from '../EcclesiaContext';
import { Clock, MapPin } from 'lucide-react';

interface Props {
  data?: {
    heading?: string;
    sundayTimes?: string;
    midWeekTimes?: string;
    address?: string;
    title?: string;
  };
}

const ServiceTimesSection: React.FC<Props> = ({ data }) => {
  const { globalContent } = useEcclesia();
  const heading = data?.heading || data?.title || 'Weekly Service Rhythm';
  const serviceTimes = globalContent?.services?.serviceTimes || [];
  const locations = globalContent?.services?.serviceLocations || [];

  // Fallback: parse from flat data fields
  const displayTimes = serviceTimes.length > 0
    ? serviceTimes
    : [
        ...(data?.sundayTimes ? [{ label: 'Sunday', time: data.sundayTimes }] : []),
        ...(data?.midWeekTimes ? [{ label: 'Midweek', time: data.midWeekTimes }] : []),
      ];

  return (
    <section className="section">
      <div className="section-head">
        <div>
          <div className="section-kicker">Worship with us</div>
          <h2>{heading}</h2>
        </div>
      </div>
      <div className="cards-3">
        {displayTimes.map((s, i) => (
          <article className="feature-card" key={i}>
            <div className="feature-icon"><Clock size={22} /></div>
            <h3>{s.label}</h3>
            <p>{s.time}</p>
          </article>
        ))}
        {locations.length > 0 && (
          <article className="feature-card">
            <div className="feature-icon"><MapPin size={22} /></div>
            <h3>Location</h3>
            <p>{locations[0].address || data?.address}</p>
          </article>
        )}
        {locations.length === 0 && data?.address && (
          <article className="feature-card">
            <div className="feature-icon"><MapPin size={22} /></div>
            <h3>Location</h3>
            <p>{data.address}</p>
          </article>
        )}
      </div>
    </section>
  );
};

export default ServiceTimesSection;
