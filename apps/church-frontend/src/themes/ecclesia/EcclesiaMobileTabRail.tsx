import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tv, Mic, Newspaper, Calendar, BookOpen, Music } from 'lucide-react';
import { useEcclesia } from './EcclesiaContext';
import { isUrlEntitled } from '../../entitlements';

const TAB_ITEMS = [
  { label: 'Media', path: '/media', icon: Tv },
  { label: 'Podcast', path: '/podcast', icon: Mic },
  { label: 'Articles', path: '/blog', icon: Newspaper },
  { label: 'Services', path: '/services', icon: Calendar },
  { label: 'Library', path: '/library', icon: BookOpen },
  { label: 'Worship', path: '/worship', icon: Music },
];

interface Props {
  embedded?: boolean;
}

const EcclesiaMobileTabRail: React.FC<Props> = ({ embedded = false }) => {
  const { moduleEntitlements } = useEcclesia();
  const location = useLocation();
  const activePath = location.pathname;

  // Filter items based on active module entitlements for the tenant
  const entitledItems = TAB_ITEMS.filter(item => isUrlEntitled(item.path, moduleEntitlements));

  if (entitledItems.length === 0) return null;

  const tabs = (
    <>
      {entitledItems.map(item => {
        const Icon = item.icon;
        const isActive = activePath === item.path || activePath.startsWith(item.path + '/');
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`mobile-tab-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  if (embedded) return tabs;

  return <div className="mobile-tab-rail">{tabs}</div>;
};

export default EcclesiaMobileTabRail;
