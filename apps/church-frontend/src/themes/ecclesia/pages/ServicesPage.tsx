import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  Headphones,
  Info,
  MapPin,
  PlayCircle,
  Radio,
  Search,
  UserRound,
} from 'lucide-react';
import { useEcclesia } from '../EcclesiaContext';
import { httpRequest } from '../../../http';
import { withLocalChurchBase } from '../../../routing';
import './ServicesPage.css';

interface ServicePerson {
  id?: string;
  name: string;
  title: string | null;
}

interface ServiceMedia {
  id: string;
  title: string;
  type?: string;
  sourceUrl?: string | null;
  thumbnailUrl?: string | null;
  providerType?: string | null;
}

interface ServiceScripture {
  id?: string;
  reference: string;
  order?: number;
}

interface ServiceAttachment {
  id?: string;
  title: string;
  fileUrl: string;
  fileType?: string | null;
}

interface ChurchService {
  id: string;
  title: string;
  description: string | null;
  notes?: string | null;
  serviceDate: string;
  serviceType: string;
  serviceTypeLabel?: string;
  thumbnailUrl?: string | null;
  speakerId?: string | null;
  speaker?: ServicePerson | null;
  sermonMedia?: ServiceMedia | null;
  serviceAudio?: ServiceMedia | null;
  livestream?: { id: string; title: string; status?: string; playbackUrl?: string | null; embedUrl?: string | null } | null;
  watchUrl?: string | null;
  scriptures?: ServiceScripture[];
  attachments?: ServiceAttachment[];
  locationMode?: string;
}

interface ArchiveSummary {
  published: number;
  replayReady: number;
  byType?: Record<string, number>;
}

interface ServiceTypeOption {
  key: string;
  label: string;
}

interface ServicesPageProps {
  serviceId?: string | null;
}

const SERVICE_TYPE_OPTIONS: ServiceTypeOption[] = [
  { key: 'sunday', label: 'Sunday Service' },
  { key: 'midweek', label: 'Midweek Service' },
  { key: 'prayer', label: 'Prayer Service' },
  { key: 'communion', label: 'Communion Service' },
  { key: 'healing', label: 'Healing Service' },
  { key: 'thanksgiving', label: 'Thanksgiving Service' },
  { key: 'youth', label: 'Youth Service' },
  { key: 'special', label: 'Special Service' },
];

const MOCK_SERVICES: ChurchService[] = [
  {
    id: 'sample-service',
    title: 'Sunday Morning Glory Worship',
    description: 'Corporate worship, prayer, communion alignment, and a full message replay for the whole church family.',
    notes: 'A service outline focused on worship, covenant remembrance, and practical discipleship for the week ahead.',
    serviceDate: new Date(Date.now() - 86400000 * 3).toISOString(),
    serviceType: 'sunday',
    serviceTypeLabel: 'Sunday Service',
    thumbnailUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
    speakerId: 'spk-1',
    speaker: { id: 'spk-1', name: 'Pastor David', title: 'Senior Pastor' },
    sermonMedia: {
      id: 'media-1',
      title: 'Sunday Morning Glory Worship Replay',
      type: 'video',
      sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
    },
    serviceAudio: {
      id: 'audio-1',
      title: 'Sunday Morning Glory Worship Audio',
      type: 'audio',
      sourceUrl: 'https://cdn.example.com/sermons/sunday.mp3',
    },
    scriptures: [{ reference: 'Psalm 95:1-7' }, { reference: 'Hebrews 10:19-25' }],
    attachments: [{ title: 'Sermon Notes', fileUrl: 'https://cdn.example.com/notes/sunday.pdf', fileType: 'pdf' }],
    watchUrl: '/livestream?serviceId=sample-service',
    locationMode: 'hybrid',
  },
  {
    id: 'sample-midweek',
    title: 'Wednesday Word and Prayer',
    description: 'Midweek teaching, guided intercession, and space for testimony follow-up.',
    notes: 'Prayer points, study prompts, and ministry follow-up reminders.',
    serviceDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    serviceType: 'midweek',
    serviceTypeLabel: 'Midweek Service',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?auto=format&fit=crop&w=1200&q=80',
    speakerId: 'spk-2',
    speaker: { id: 'spk-2', name: 'Pastor Grace', title: 'Associate Pastor' },
    scriptures: [{ reference: 'Acts 4:23-31' }],
    attachments: [],
    watchUrl: '/livestream?serviceId=sample-midweek',
    locationMode: 'physical',
  },
];

const EMPTY_SUMMARY: ArchiveSummary = {
  published: 0,
  replayReady: 0,
};

function serviceIdFromPath(pathname: string): string | null {
  const normalized = pathname.replace(/^\/church/, '').replace(/\/+$/, '');
  const match = normalized.match(/^\/services\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function dateParts(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { day: 'Date pending', time: 'Time pending', short: 'Pending' };
  }
  return {
    day: date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    time: date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    short: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  };
}

function serviceTypeLabel(service: ChurchService) {
  return service.serviceTypeLabel || SERVICE_TYPE_OPTIONS.find((item) => item.key === service.serviceType)?.label || service.serviceType;
}

function detailPath(id: string) {
  return withLocalChurchBase(`/services/${encodeURIComponent(id)}`);
}

function livestreamPath(service: ChurchService) {
  const rawPath = service.watchUrl
    || (service.livestream?.id
      ? `/livestream/${encodeURIComponent(service.livestream.id)}?serviceId=${encodeURIComponent(service.id)}`
      : `/livestream?serviceId=${encodeURIComponent(service.id)}`);
  return withLocalChurchBase(rawPath);
}

function mediaUrl(service: ChurchService) {
  return service.sermonMedia?.sourceUrl || service.livestream?.playbackUrl || service.livestream?.embedUrl || null;
}

function hasReplay(service: ChurchService) {
  return Boolean(mediaUrl(service) || service.serviceAudio?.sourceUrl);
}

function mockArchive(search: string, serviceType: string, sortOrder: 'asc' | 'desc') {
  const needle = search.trim().toLowerCase();
  const filtered = MOCK_SERVICES.filter((service) => {
    const matchesSearch = !needle
      || service.title.toLowerCase().includes(needle)
      || (service.description || '').toLowerCase().includes(needle)
      || (service.speaker?.name || '').toLowerCase().includes(needle);
    const matchesType = !serviceType || service.serviceType === serviceType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    const diff = new Date(a.serviceDate).getTime() - new Date(b.serviceDate).getTime();
    return sortOrder === 'asc' ? diff : -diff;
  });

  return filtered;
}

const ServiceCard: React.FC<{ service: ChurchService }> = ({ service }) => {
  const parts = dateParts(service.serviceDate);
  return (
    <article className="service-card">
      <Link to={detailPath(service.id)} className="service-card__image" aria-label={service.title}>
        {service.thumbnailUrl ? <img src={service.thumbnailUrl} alt="" /> : <div className="service-card__image-fallback"><CalendarDays size={30} /></div>}
        {hasReplay(service) && (
          <span className="service-card__replay"><PlayCircle size={14} /> Replay</span>
        )}
      </Link>
      <div className="service-card__body">
        <div className="service-card__meta">
          <span>{serviceTypeLabel(service)}</span>
          <span>{parts.short}</span>
        </div>
        <h2><Link to={detailPath(service.id)}>{service.title}</Link></h2>
        <p>{service.description || 'Service notes, replay, scriptures, and connected resources will appear here when published.'}</p>
        <div className="service-card__footer">
          <span><Clock3 size={14} /> {parts.time}</span>
          <span><UserRound size={14} /> {service.speaker?.name || 'Teaching team'}</span>
          <Link to={livestreamPath(service)} className="service-card__watch"><Radio size={14} /> Watch</Link>
        </div>
      </div>
    </article>
  );
};

const ServicesPage: React.FC<ServicesPageProps> = ({ serviceId }) => {
  const location = useLocation();
  const { tenant } = useEcclesia();
  const resolvedServiceId = serviceId || serviceIdFromPath(location.pathname);
  const [services, setServices] = useState<ChurchService[]>([]);
  const [latestService, setLatestService] = useState<ChurchService | null>(null);
  const [upcomingServices, setUpcomingServices] = useState<ChurchService[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>(SERVICE_TYPE_OPTIONS);
  const [summary, setSummary] = useState<ArchiveSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<ChurchService | null>(null);
  const [detailError, setDetailError] = useState('');
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [replayMessage, setReplayMessage] = useState('');

  useEffect(() => {
    if (resolvedServiceId) return;

    let active = true;
    const loadServices = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (activeType) params.set('serviceType', activeType);
      params.set('sortOrder', sortOrder);

      try {
        const res = await httpRequest(`/api/cms/services?${params.toString()}`);
        if (!res.ok) throw new Error('Unable to load services');
        const json = await res.json();
        if (!active) return;

        const data = Array.isArray(json.data) ? json.data : [];
        setServices(data.length ? data : mockArchive(search, activeType, sortOrder));
        setLatestService(json.latestService || data[0] || MOCK_SERVICES[0]);
        setUpcomingServices(Array.isArray(json.upcomingServices) && json.upcomingServices.length ? json.upcomingServices : MOCK_SERVICES.filter((item) => new Date(item.serviceDate).getTime() >= Date.now()));
        setServiceTypes(Array.isArray(json.serviceTypes) && json.serviceTypes.length ? json.serviceTypes : SERVICE_TYPE_OPTIONS);
        setSummary(json.summary || {
          published: data.length || MOCK_SERVICES.length,
          replayReady: data.filter(hasReplay).length || 1,
        });
      } catch {
        if (!active) return;
        const fallback = mockArchive(search, activeType, sortOrder);
        setServices(fallback);
        setLatestService(MOCK_SERVICES[0]);
        setUpcomingServices(MOCK_SERVICES.filter((item) => new Date(item.serviceDate).getTime() >= Date.now()));
        setServiceTypes(SERVICE_TYPE_OPTIONS);
        setSummary({
          published: MOCK_SERVICES.length,
          replayReady: 1,
        });
      } finally {
        if (active) setLoading(false);
      }
    };

    loadServices();
    return () => {
      active = false;
    };
  }, [activeType, resolvedServiceId, search, sortOrder]);

  useEffect(() => {
    if (!resolvedServiceId) {
      setDetail(null);
      setDetailError('');
      return;
    }

    let active = true;
    const loadDetail = async () => {
      setDetailLoading(true);
      setDetailError('');
      setReplayMessage('');

      try {
        const res = await httpRequest(`/api/cms/services/${encodeURIComponent(resolvedServiceId)}`);
        if (!res.ok) throw new Error('Service not found');
        const json = await res.json();
        if (active) setDetail(json.data);
      } catch {
        const fallback = MOCK_SERVICES.find((item) => item.id === resolvedServiceId);
        if (active) {
          setDetail(fallback || null);
          setDetailError(fallback ? '' : 'This service is not available in the public archive.');
        }
      } finally {
        if (active) setDetailLoading(false);
      }
    };

    loadDetail();
    return () => {
      active = false;
    };
  }, [resolvedServiceId]);

  const archiveStats = useMemo(() => ([
    { label: 'Services', value: summary.published || services.length, icon: CalendarDays },
    { label: 'Replays', value: summary.replayReady || services.filter(hasReplay).length, icon: PlayCircle },
    { label: 'Upcoming', value: upcomingServices.length, icon: Clock3 },
    { label: 'Types', value: Object.keys(summary.byType || {}).length || serviceTypes.length, icon: Radio },
  ]), [services, serviceTypes.length, summary, upcomingServices.length]);

  const recordReplay = async (service: ChurchService) => {
    setReplayMessage('Opening replay...');
    try {
      const res = await httpRequest(`/api/cms/services/${encodeURIComponent(service.id)}/replay`, { method: 'POST' });
      if (!res.ok) throw new Error('Replay tracking failed');
      setReplayMessage('Replay request recorded.');
    } catch {
      setReplayMessage('Replay is ready.');
    }
  };

  if (resolvedServiceId) {
    if (detailLoading) {
      return <div className="services-page"><div className="services-empty">Loading service...</div></div>;
    }

    if (!detail) {
      return (
        <div className="services-page">
          <Link className="services-back" to={withLocalChurchBase('/services')}><ArrowLeft size={16} /> All Services</Link>
          <div className="services-empty">
            <Info size={32} />
            <h1>Service Unavailable</h1>
            <p>{detailError || 'This service could not be loaded.'}</p>
          </div>
        </div>
      );
    }

    const parts = dateParts(detail.serviceDate);
    const replayUrl = mediaUrl(detail);
    const audioUrl = detail.serviceAudio?.sourceUrl || null;

    return (
      <div className="services-page services-page--detail">
        <Link className="services-back" to={withLocalChurchBase('/services')}><ArrowLeft size={16} /> All Services</Link>

        <section className="service-detail-hero">
          <div className="service-detail-hero__image">
            {detail.thumbnailUrl ? <img src={detail.thumbnailUrl} alt="" /> : <CalendarDays size={42} />}
          </div>
          <div className="service-detail-hero__copy">
            <span className="services-eyebrow"><CalendarDays size={14} /> {serviceTypeLabel(detail)}</span>
            <h1>{detail.title}</h1>
            <p>{detail.description || 'Published service details, replay, scriptures, notes, and handouts.'}</p>
            <div className="service-detail-hero__meta">
              <span><CalendarDays size={16} /> {parts.day}</span>
              <span><Clock3 size={16} /> {parts.time}</span>
              <span><UserRound size={16} /> {detail.speaker?.name || 'Teaching team'}</span>
              <span><MapPin size={16} /> {(detail.locationMode || 'hybrid').replace('_', ' ')}</span>
            </div>
            <div className="service-detail-hero__actions">
              <Link className="btn btn-primary" to={livestreamPath(detail)}>
                <Radio size={16} /> Watch Service
              </Link>
              {replayUrl && (
                <a className="btn btn-soft" href={replayUrl} target="_blank" rel="noreferrer" onClick={() => recordReplay(detail)}>
                  <PlayCircle size={16} /> Watch Replay
                </a>
              )}
              {audioUrl && (
                <a className="btn btn-soft" href={audioUrl} target="_blank" rel="noreferrer" onClick={() => recordReplay(detail)}>
                  <Headphones size={16} /> Listen Audio
                </a>
              )}
            </div>
            {replayMessage && <div className="services-inline-note">{replayMessage}</div>}
          </div>
        </section>

        <div className="service-detail-grid">
          <section className="service-detail-panel service-detail-panel--wide">
            <div className="service-detail-panel__head">
              <FileText size={18} />
              <h2>Service Notes</h2>
            </div>
            <p>{detail.notes || detail.description || 'Notes for this service will appear when the church publishes them.'}</p>
          </section>

          <section className="service-detail-panel">
            <div className="service-detail-panel__head">
              <BookOpen size={18} />
              <h2>Scriptures</h2>
            </div>
            {detail.scriptures?.length ? (
              <ul className="service-scriptures">
                {detail.scriptures.map((scripture, index) => (
                  <li key={`${scripture.reference}-${index}`}>{scripture.reference}</li>
                ))}
              </ul>
            ) : (
              <p className="services-muted">No scripture references published yet.</p>
            )}
          </section>

          <section className="service-detail-panel">
            <div className="service-detail-panel__head">
              <Download size={18} />
              <h2>Handouts</h2>
            </div>
            {detail.attachments?.length ? (
              <div className="service-attachments">
                {detail.attachments.map((attachment) => (
                  <a key={attachment.id || attachment.fileUrl} href={attachment.fileUrl} target="_blank" rel="noreferrer">
                    <FileText size={16} />
                    <span>{attachment.title}</span>
                    {attachment.fileType && <em>{attachment.fileType}</em>}
                  </a>
                ))}
              </div>
            ) : (
              <p className="services-muted">No handouts published yet.</p>
            )}
          </section>

          <section className="service-detail-panel service-watch-panel">
            <div className="service-detail-panel__head">
              <Radio size={18} />
              <h2>Watch With Us</h2>
            </div>
            <p>Open the church player for live worship, replays, chat, Bible lookup, and personal notes.</p>
            <Link className="btn btn-soft" to={livestreamPath(detail)}><PlayCircle size={16} /> Open Player</Link>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="services-page">
      <section className="services-hero">
        <div className="services-hero__copy">
          <span className="services-eyebrow"><CalendarDays size={14} /> Worship archive</span>
          <h1>{tenant?.name || 'Church'} Services</h1>
          <p>Explore upcoming gatherings, recently published replays, scripture references, notes, and service resources.</p>
        </div>
        <div className="services-hero__stats">
          {archiveStats.map((item) => {
            const Icon = item.icon;
            return (
              <div className="services-stat" key={item.label}>
                <Icon size={18} />
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="services-controls" aria-label="Filter services">
        <label className="services-search">
          <Search size={18} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search services, speakers, or notes" />
        </label>
        <label className="services-select">
          <span>Type</span>
          <select value={activeType} onChange={(event) => setActiveType(event.target.value)}>
            <option value="">All services</option>
            {serviceTypes.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
          </select>
        </label>
        <label className="services-select">
          <span>Sort</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as 'asc' | 'desc')}>
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </label>
      </section>

      {latestService && (
        <section className="services-feature">
          <div>
            <span className="services-eyebrow"><PlayCircle size={14} /> Latest replay</span>
            <h2>{latestService.title}</h2>
            <p>{latestService.description || 'The latest published service replay and notes.'}</p>
          </div>
          <Link className="btn btn-primary" to={detailPath(latestService.id)}>Open Service</Link>
        </section>
      )}

      <div className="services-layout">
        <main className="services-list">
          {loading ? (
            <div className="services-empty">Loading services...</div>
          ) : services.length ? (
            services.map((service) => <ServiceCard key={service.id} service={service} />)
          ) : (
            <div className="services-empty">
              <Info size={32} />
              <h2>No Services Found</h2>
              <p>Try a different search or service type.</p>
            </div>
          )}
        </main>

        <aside className="services-sidebar">
          <section className="services-sidebar-panel">
            <h2>Upcoming</h2>
            {upcomingServices.length ? (
              <div className="services-upcoming-list">
                {upcomingServices.map((service) => {
                  const parts = dateParts(service.serviceDate);
                  return (
                    <Link key={service.id} to={detailPath(service.id)}>
                      <span>{parts.short}</span>
                      <strong>{service.title}</strong>
                      <em>{parts.time}</em>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="services-muted">No upcoming published services.</p>
            )}
          </section>

          <section className="services-sidebar-panel">
            <h2>Watch Online</h2>
            <p className="services-muted">Join live worship, watch replays, use the KJV Bible, and keep personal notes in the player.</p>
            <Link className="btn btn-soft services-sidebar-action" to={withLocalChurchBase('/livestream')}>
              <Radio size={16} /> Open Livestream
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ServicesPage;
