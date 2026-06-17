/* ── Ecclesia Mobile Drawer ─────────────────────────── */
import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Home, Info, PlaySquare, CalendarDays, UsersRound, HeartHandshake, Mail, Radio, HandCoins } from 'lucide-react';
import { useEcclesia } from './EcclesiaContext';
import { isUrlEntitled } from '../../entitlements';

const navIcons: Record<string, React.ComponentType<{ size?: number | string }>> = {
  '/': Home, '/home': Home,
  '/about': Info,
  '/sermons': PlaySquare,
  '/events': CalendarDays,
  '/ministries': UsersRound,
  '/prayer': HeartHandshake,
  '/contact': Mail,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EcclesiaMobileDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { navigation, moduleEntitlements } = useEcclesia();
  const items = (navigation?.items || []).filter(item => isUrlEntitled(item.url, moduleEntitlements));
  const showLiveAction = isUrlEntitled('/livestream', moduleEntitlements);
  const showGivingAction = isUrlEntitled('/giving', moduleEntitlements);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="drawer-backdrop" onClick={onClose} />}

      <aside className={`mobile-drawer ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen} ref={drawerRef}>
        <div className="drawer-close-row">
          <button className="drawer-close" onClick={onClose} aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="drawer-nav">
          {items.map((item) => {
            const url = item.url === '/home' ? '/' : item.url;
            const Icon = navIcons[url] || navIcons[item.url];
            return (
              <Link key={item.url} to={url} onClick={onClose}>
                {Icon && <Icon size={18} />} {item.label}
              </Link>
            );
          })}
        </nav>

        {(showLiveAction || showGivingAction) && (
          <div className="drawer-actions">
            {showLiveAction && (
              <Link to="/livestream" className="btn btn-light btn-full" onClick={onClose}>
                <Radio size={16} /> Watch Live
              </Link>
            )}
            {showGivingAction && (
              <Link to="/giving" className="btn btn-primary btn-full" onClick={onClose}>
                <HandCoins size={16} /> Give
              </Link>
            )}
          </div>
        )}
      </aside>
    </>
  );
};

export default EcclesiaMobileDrawer;
