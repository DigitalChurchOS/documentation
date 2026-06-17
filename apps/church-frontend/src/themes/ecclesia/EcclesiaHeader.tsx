/* ── Ecclesia Header ────────────────────────────────── */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Church, PlayCircle, Menu } from 'lucide-react';
import { useEcclesia } from './EcclesiaContext';
import { isUrlEntitled } from '../../entitlements';

interface Props {
  onOpenDrawer: () => void;
}

const EcclesiaHeader: React.FC<Props> = ({ onOpenDrawer }) => {
  const { tenant, navigation, themeSettings, globalContent, moduleEntitlements } = useEcclesia();
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
    if (url === '/' || url === '/home') return location.pathname === '/';
    return location.pathname.startsWith(url);
  }

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
          {showHeaderCta && (
            <Link className="btn btn-soft" to={ctaUrl}>
              <PlayCircle size={16} /> {ctaLabel}
            </Link>
          )}
          <Link className="btn btn-primary" to="/contact">Plan Visit</Link>
          <button className="mobile-menu-btn" onClick={onOpenDrawer} aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default EcclesiaHeader;
