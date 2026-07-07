/* ── Ecclesia Footer ────────────────────────────────── */
import React from 'react';
import { Link } from 'react-router-dom';
import { Church, Facebook, Youtube, Instagram } from 'lucide-react';
import { useEcclesia } from './EcclesiaContext';
import { withLocalChurchBase } from '../../routing';

const socialIconMap: Record<string, React.ComponentType<{ size?: number | string }>> = {
  facebook: Facebook,
  youtube: Youtube,
  instagram: Instagram,
};

const EcclesiaFooter: React.FC = () => {
  const { tenant, footer, globalContent, themeSettings } = useEcclesia();
  const churchName = globalContent?.churchIdentity?.churchName || tenant.name;
  const description = globalContent?.churchIdentity?.description || '';
  const serviceTimes = globalContent?.services?.serviceTimes || [];
  const socialLinks = footer?.socialLinks || [];
  const secondaryLinks = footer?.secondaryLinks || [];
  const copyright = footer?.copyrightText || `© ${new Date().getFullYear()} ${churchName}. All rights reserved.`;

  const footerData = {
    'data-footer-style': themeSettings.footerStyle || themeSettings.footer?.style || 'classic',
    'data-footer-widgets': themeSettings.footerWidgets === 'hidden' ? 'hidden' : 'shown',
    'data-footer-widget-layout': themeSettings.footerWidgetLayout || 'feature',
    'data-footer-bottom': themeSettings.footerBottom || 'split',
    'data-footer-legal': themeSettings.footerLegal === 'hidden' ? 'hidden' : 'shown',
  };

  return (
    <footer className="footer" {...footerData}>
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Column 1: Brand + Description + Social */}
          <div>
            <Link to={withLocalChurchBase('/')} className="brand" style={{ color: 'white' }}>
              <span className="brand-mark">
                {globalContent?.churchIdentity?.logoDarkUrl ? (
                  <img 
                    src={globalContent.churchIdentity.logoDarkUrl} 
                    alt={`${churchName} Logo`} 
                    style={{ height: '100%', width: '100%', objectFit: 'contain', display: 'block' }} 
                  />
                ) : globalContent?.churchIdentity?.logoUrl ? (
                  <img 
                    src={globalContent.churchIdentity.logoUrl} 
                    alt={`${churchName} Logo`} 
                    style={{ height: '100%', width: '100%', objectFit: 'contain', display: 'block' }} 
                  />
                ) : (
                  <Church size={20} />
                )}
              </span>
              <span>{churchName}</span>
            </Link>
            {description && <p style={{ marginTop: 18, maxWidth: 340 }}>{description}</p>}
            {socialLinks.length > 0 && (
              <div className="socials">
                {socialLinks.map((link) => {
                  const Icon = socialIconMap[link.name.toLowerCase()];
                  return (
                    <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer">
                      {Icon ? <Icon size={18} /> : link.name}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: Explore links */}
          <div>
            <h4>Explore</h4>
            <Link to={withLocalChurchBase('/about')}>About</Link>
            <Link to={withLocalChurchBase('/sermons')}>Sermons</Link>
            <Link to={withLocalChurchBase('/events')}>Events</Link>
            <Link to={withLocalChurchBase('/ministries')}>Ministries</Link>
          </div>

          {/* Column 3: Connect links */}
          <div>
            <h4>Connect</h4>
            {secondaryLinks.map((link) => (
              <Link key={link.url} to={withLocalChurchBase(link.url)}>{link.label}</Link>
            ))}
            {secondaryLinks.length === 0 && (
              <>
                <Link to={withLocalChurchBase('/contact')}>Plan a Visit</Link>
                <Link to={withLocalChurchBase('/prayer')}>Prayer Request</Link>
                <Link to={withLocalChurchBase('/ministries')}>Join a Group</Link>
                <Link to={withLocalChurchBase('/contact')}>Volunteer</Link>
              </>
            )}
          </div>

          {/* Column 4: Service Times */}
          <div>
            <h4>Service Times</h4>
            {serviceTimes.map((s, i) => (
              <p key={i}>{s.label}<br />{s.time}</p>
            ))}
            {serviceTimes.length === 0 && (
              <p>Sunday Worship<br />9:30 AM</p>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <span dangerouslySetInnerHTML={{ __html: copyright }} />
          <span>Ecclesia Theme · Digital Church OS</span>
        </div>
      </div>
    </footer>
  );
};

export default EcclesiaFooter;
