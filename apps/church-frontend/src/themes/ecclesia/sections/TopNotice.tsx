/* ── Top Notice / Announcement Bar ──────────────────── */
import React from 'react';
import { useEcclesia } from '../EcclesiaContext';

const TopNotice: React.FC = () => {
  const { globalContent } = useEcclesia();
  const serviceTimes = globalContent?.services?.serviceTimes || [];

  if (serviceTimes.length === 0) return null;

  const display = serviceTimes
    .map((s) => `${s.label}: ${s.time}`)
    .join(' · ');

  return (
    <div className="top-notice">
      <span>{serviceTimes[0]?.label}:</span> {serviceTimes[0]?.time}
      {serviceTimes.length > 1 && ` · ${serviceTimes[1].label}: ${serviceTimes[1].time}`}
    </div>
  );
};

export default TopNotice;
