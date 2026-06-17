import React, { useState, useEffect } from 'react';
import { useEcclesia } from '../EcclesiaContext';
import { Calendar, Clock, MapPin, User, Compass, Info } from 'lucide-react';

interface ChurchService {
  id: string;
  title: string;
  description: string | null;
  serviceDate: string;
  serviceType: string;
  speakerId: string | null;
  speaker?: { name: string; title: string | null } | null;
}

const MOCK_SERVICES: ChurchService[] = [
  {
    id: 'mock-service-1',
    title: 'Sunday Morning Glory Worship',
    description: 'Our primary Sunday corporate gathering. Experience live praise, prophetic worship, communion alignment, and revelation teachings from our senior pastor.',
    serviceDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    serviceType: 'Sunday Service',
    speakerId: 'spk-1',
    speaker: { name: 'Pastor David', title: 'Senior Pastor' }
  },
  {
    id: 'mock-service-2',
    title: 'Wednesday Midweek Power Encounter',
    description: 'Deep scripture teachings and corporate intercession. We break bread together and pray for local and global branches.',
    serviceDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
    serviceType: 'Midweek Communion',
    speakerId: 'spk-2',
    speaker: { name: 'Pastor Grace', title: 'Associate Pastor' }
  }
];

const ServicesPage: React.FC = () => {
  const { tenant } = useEcclesia();
  const [services, setServices] = useState<ChurchService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const res = await fetch('/api/cms/services');
        if (!res.ok) throw new Error();
        const json = await res.json();
        if (Array.isArray(json.data) && json.data.length > 0) {
          setServices(json.data);
        } else {
          setServices(MOCK_SERVICES);
        }
      } catch {
        setServices(MOCK_SERVICES);
      } finally {
        setLoading(false);
      }
    };
    loadServices();
  }, []);

  return (
    <div className="section container">
      <div className="head" style={{ marginBottom: '40px' }}>
        <div>
          <span className="eyebrow"><Compass size={13} /> Liturgy, Worship & Service Times</span>
          <h1 style={{ marginTop: '12px', marginBottom: '8px' }}>Worship Services</h1>
          <p className="lead">Join our assembly weekly for powerful corporate worship, scriptural alignment, and local fellowship at {tenant?.name || 'our church'}.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '32px', alignItems: 'start' }}>
        
        {/* Main List */}
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)' }}>
              <p>Loading worship roster...</p>
            </div>
          ) : services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <Info size={36} style={{ color: 'var(--accent)', marginBottom: '12px' }} />
              <h3>No Services Scheduled</h3>
              <p className="muted">Check back later or tune in to our Sunday livestream.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {services.map(s => {
                const date = new Date(s.serviceDate);
                const dayStr = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
                const timeStr = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                
                return (
                  <div 
                    key={s.id} 
                    className="panel"
                    style={{ 
                      background: 'var(--surface)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 'var(--radius-lg)', 
                      padding: '24px',
                      boxShadow: 'var(--soft-shadow)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                      <span className="badge accent" style={{ fontSize: '11px' }}>{s.serviceType}</span>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--muted)', fontWeight: 750 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={14} style={{ color: 'var(--accent)' }} />
                          <span>{dayStr}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={14} style={{ color: 'var(--accent)' }} />
                          <span>{timeStr}</span>
                        </div>
                      </div>
                    </div>

                    <h3 style={{ fontSize: '22px', margin: '4px 0 12px', letterSpacing: '-0.02em' }}>{s.title}</h3>
                    <p className="muted" style={{ fontSize: '14.5px', lineHeight: '1.6', marginBottom: '18px' }}>{s.description}</p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                      <User size={16} style={{ color: 'var(--accent)' }} />
                      <span style={{ fontSize: '13.5px', fontWeight: 'bold' }}>
                        Preaching Speaker: {s.speaker ? `${s.speaker.name} (${s.speaker.title || 'Pastor'})` : 'Pastor David'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="panel" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
            <h3 style={{ marginBottom: '12px' }}>Location & Directions</h3>
            <div style={{ 
              height: '180px', borderRadius: '12px', overflow: 'hidden', 
              background: '#e2e8f0', display: 'grid', placeItems: 'center',
              color: '#64748b', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px',
              border: '1px solid var(--border)'
            }}>
              <div style={{ textAlign: 'center', padding: '12px' }}>
                <MapPin size={24} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
                <span>Sanctuary Campus Map Placeholder</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '13px' }}>
              <MapPin size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Covenant Sanctuary</strong>
                <p className="muted" style={{ margin: '2px 0 0', lineHeight: 1.4 }}>
                  77 Grace Boulevard, Suite 100<br />
                  Faith City, FC 90210
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ServicesPage;
