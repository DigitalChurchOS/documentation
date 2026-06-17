/* ── Ecclesia Header ────────────────────────────────── */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Church, PlayCircle, Menu } from 'lucide-react';
import { useEcclesia } from './EcclesiaContext';
import { isUrlEntitled } from '../../entitlements';

const ctaConfig: Record<string, { primary?: string; primaryUrl?: string; secondary?: string; secondaryUrl?: string }> = {
  'index.html': { primary: 'Plan Visit', primaryUrl: '/contact', secondary: 'Watch Live', secondaryUrl: '/livestream' },
  'about.html': { primary: 'Join Us', primaryUrl: '/contact', secondary: 'Our Beliefs', secondaryUrl: '/about#beliefs' },
  'media-archive.html': { primary: 'Watch Sermons', primaryUrl: '/sermons', secondary: 'Watch Live', secondaryUrl: '/livestream' },
  'media-single.html': { primary: 'Watch Video', primaryUrl: '#', secondary: 'All Sermons', secondaryUrl: '/sermons' },
  'livestream-page.html': { primary: 'Watch Live', primaryUrl: '/livestream', secondary: 'Prayer Request', secondaryUrl: '/prayer' },
  'podcast-archive.html': { primary: 'Listen Now', primaryUrl: '/podcast', secondary: 'Subscribe', secondaryUrl: '#subscribe' },
  'podcast-episode.html': { primary: 'Listen Now', primaryUrl: '#', secondary: 'All Episodes', secondaryUrl: '/podcast' },
  'services-archive.html': { primary: 'Plan Visit', primaryUrl: '/contact', secondary: 'Service Times', secondaryUrl: '#times' },
  'service-single.html': { primary: 'Register', primaryUrl: '/event-register', secondary: 'All Services', secondaryUrl: '/services' },
  'sermons.html': { primary: 'Watch Sermons', primaryUrl: '/sermons', secondary: 'Watch Live', secondaryUrl: '/livestream' },
  'library-archive.html': { primary: 'Download Now', primaryUrl: '/library', secondary: 'Request Resource', secondaryUrl: '/contact' },
  'resource-single.html': { primary: 'Download PDF', primaryUrl: '#', secondary: 'All Resources', secondaryUrl: '/library' },
  'courses-archive.html': { primary: 'Enrol Now', primaryUrl: '/courses', secondary: 'Browse Catalog', secondaryUrl: '#catalog' },
  'course-main.html': { primary: 'Enrol Now', primaryUrl: '#', secondary: 'All Courses', secondaryUrl: '/courses' },
  'lesson-single.html': { primary: 'Enrol Now', primaryUrl: '#', secondary: 'Back to Course', secondaryUrl: '/courses' },
  'giving.html': { primary: 'Give Now', primaryUrl: '/giving', secondary: 'Partner with Us', secondaryUrl: '/giving-partnership' },
  'giving-partnership.html': { primary: 'Partner Now', primaryUrl: '/giving-partnership', secondary: 'Giving FAQ', secondaryUrl: '/giving' },
  'prayer.html': { primary: 'Prayer Request', primaryUrl: '/prayer', secondary: 'View Wall', secondaryUrl: '/prayer-wall' },
  'prayer-room.html': { primary: 'Join Room', primaryUrl: '/prayer-room', secondary: 'Prayer Requests', secondaryUrl: '/prayer' },
  'prayer-wall.html': { primary: 'Submit Request', primaryUrl: '/prayer', secondary: 'Prayer Room', secondaryUrl: '/prayer-room' },
  'prayer-home.html': { primary: 'Submit Request', primaryUrl: '/prayer', secondary: 'Prayer Room', secondaryUrl: '/prayer-room' },
  'events-archive.html': { primary: 'Register Now', primaryUrl: '/event-register', secondary: 'Calendar', secondaryUrl: '/events' },
  'events.html': { primary: 'Register Now', primaryUrl: '/event-register', secondary: 'Calendar', secondaryUrl: '/events' },
  'event-single.html': { primary: 'Register Now', primaryUrl: '/event-register', secondary: 'All Events', secondaryUrl: '/events' },
  'event-register.html': { primary: 'Submit Register', primaryUrl: '#', secondary: 'Back to Event', secondaryUrl: '/events' },
  'blog-archive.html': { primary: 'Read Articles', primaryUrl: '/blog', secondary: 'Subscribe', secondaryUrl: '#subscribe' },
  'blog-single.html': { primary: 'All Articles', primaryUrl: '/blog', secondary: 'Subscribe', secondaryUrl: '#subscribe' },
  'contact.html': { primary: 'Get in Touch', primaryUrl: '/contact', secondary: 'Get Directions', secondaryUrl: '#directions' },
  'ministries.html': { primary: 'Join Group', primaryUrl: '/contact', secondary: 'Volunteer', secondaryUrl: '/contact' },
  'testimony-wall.html': { primary: 'Submit Testimony', primaryUrl: '/testimony-submit', secondary: 'Prayer Requests', secondaryUrl: '/prayer' },
  'testimony-submit.html': { primary: 'Submit Testimony', primaryUrl: '/testimony-submit', secondary: 'View Wall', secondaryUrl: '/testimony-wall' },
  'testimony-single.html': { primary: 'Submit Testimony', primaryUrl: '/testimony-submit', secondary: 'View Wall', secondaryUrl: '/testimony-wall' },
  'worship.html': { primary: 'Listen Now', primaryUrl: '/worship', secondary: 'Lyrics Sheets', secondaryUrl: '#chord-charts' }
};

interface Props {
  onOpenDrawer: () => void;
}

const EcclesiaHeader: React.FC<Props> = ({ onOpenDrawer }) => {
  const { tenant, navigation, themeSettings, globalContent, moduleEntitlements, headerCTAs } = useEcclesia();
  const location = useLocation();
  
  // Filter items based on active module entitlements
  const items = (navigation?.items || []).filter(item => isUrlEntitled(item.url, moduleEntitlements));
  const churchName = globalContent?.churchIdentity?.churchName || tenant.name;

  // Header style configuration from theme settings
  const headerStyle = themeSettings.headerStyle || themeSettings.header?.style || 'sticky';
  const isGlass = themeSettings.headerGlass ?? themeSettings.header?.glass ?? true;
  const headerData = {
    'data-header-style': themeSettings.headerStyle || themeSettings.header?.style || 'full',
    'data-header-content': themeSettings.headerContentBoxed === false ? 'full' : 'boxed',
    'data-header-look': themeSettings.headerLook || (isGlass ? 'glass' : 'flat'),
    'data-header-shadow': String(themeSettings.headerShadow ?? true),
    'data-header-shadow-intensity': themeSettings.headerShadowIntensity || 'medium',
    'data-header-shadow-themed': String(!!themeSettings.headerShadowThemed),
    'data-header-solid-themed': String(!!themeSettings.headerSolidThemed),
    'data-header-border': String(!!themeSettings.headerBorder),
    'data-header-border-size': themeSettings.headerBorderSize || 'small',
    'data-header-border-color': themeSettings.headerBorderColor || 'accent',
    'data-header-layout': themeSettings.headerLayout || 'logo-left',
    'data-header-effect': themeSettings.headerEffect || 'static',
    'data-mobile-menu-position': themeSettings.mobileMenuPosition || 'right',
    'data-mobile-hamburger-shape': themeSettings.mobileHamburgerShape || 'circle',
  };
  const ctaLabel = themeSettings.header?.ctaLabel || 'Watch Live';
  const ctaUrl = themeSettings.header?.ctaUrl || '/livestream';
  const showHeaderCta = isUrlEntitled(ctaUrl, moduleEntitlements);

  const headerClasses = [
    'header',
    headerStyle === 'sticky' ? 'header--sticky' : '',
    isGlass ? 'header--glass' : '',
  ].filter(Boolean).join(' ');

  function isActive(url: string): boolean {
    const cleanPath = location.pathname.startsWith('/church')
      ? location.pathname.substring('/church'.length)
      : location.pathname;
    const normalizedPath = cleanPath || '/';

    if (url === '/' || url === '/home') {
      return normalizedPath === '/';
    }
    return normalizedPath.startsWith(url);
  }

  // Resolve page-specific CTA configuration
  const pathname = location.pathname;
  let cleanPath = pathname;
  if (cleanPath.startsWith('/church')) {
    cleanPath = cleanPath.substring('/church'.length);
  }
  let pageFile = 'index.html';
  if (!cleanPath || cleanPath === '/' || cleanPath === '/home') {
    pageFile = 'index.html';
  } else {
    const segment = cleanPath.split('/').filter(Boolean)[0];
    if (segment) {
      if (segment === 'livestream') pageFile = 'livestream-page.html';
      else if (segment === 'sermons') pageFile = 'sermons.html';
      else if (segment === 'events') pageFile = 'events.html';
      else if (segment === 'ministries') pageFile = 'ministries.html';
      else if (segment === 'giving') pageFile = 'giving.html';
      else if (segment === 'partnership' || segment === 'giving-partnership') pageFile = 'giving-partnership.html';
      else if (segment === 'prayer') pageFile = 'prayer.html';
      else if (segment === 'contact') pageFile = 'contact.html';
      else pageFile = `${segment}.html`;
    }
  }

  const activeCtaConfig = ctaConfig[pageFile];

  const renderCtaLink = (text: string, url: string, className: string) => {
    const isAnchor = url.startsWith('#');
    if (isAnchor) {
      return (
        <a key={text} className={className} href={url}>
          {text === 'Watch Live' && <PlayCircle size={16} />} {text}
        </a>
      );
    }
    return (
      <Link key={text} className={className} to={url}>
        {text === 'Watch Live' && <PlayCircle size={16} />} {text}
      </Link>
    );
  };

  return (
    <header className={headerClasses} {...headerData}>
      <div className="nav-wrap">
        <Link to="/" className="brand">
          <span className="brand-mark"><Church size={20} /></span>
          <span>{churchName}</span>
        </Link>
 
        <nav className="nav">
          {items.map((item) => (
            <Link
              key={item.url}
              to={item.url === '/home' ? '/' : item.url}
              className={isActive(item.url) ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>
 
        <div className="header-actions">
          {activeCtaConfig ? (
            <>
              {activeCtaConfig.secondary && activeCtaConfig.secondaryUrl && isUrlEntitled(activeCtaConfig.secondaryUrl, moduleEntitlements) && (
                renderCtaLink(activeCtaConfig.secondary, activeCtaConfig.secondaryUrl, "btn btn-soft")
              )}
              {activeCtaConfig.primary && activeCtaConfig.primaryUrl && isUrlEntitled(activeCtaConfig.primaryUrl, moduleEntitlements) && (
                renderCtaLink(activeCtaConfig.primary, activeCtaConfig.primaryUrl, "btn btn-primary")
              )}
            </>
          ) : headerCTAs ? (
            <div
              className="dynamic-header-ctas-wrapper"
              style={{ display: 'contents' }}
              dangerouslySetInnerHTML={{ __html: headerCTAs }}
            />
          ) : (
            <>
              {showHeaderCta && (
                <Link className="btn btn-soft" to={ctaUrl}>
                  <PlayCircle size={16} /> {ctaLabel}
                </Link>
              )}
              <Link className="btn btn-primary" to="/contact">Plan Visit</Link>
            </>
          )}
          <button className="mobile-menu-btn" onClick={onOpenDrawer} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default EcclesiaHeader;
