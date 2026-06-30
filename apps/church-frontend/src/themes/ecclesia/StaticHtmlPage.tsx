import React, { useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getTemplateFileForSlug, routeFromHref, slugFromPathname } from '../../routing';
import type { DashboardCollections, ModuleEntitlement, NavigationMenu, NavItem, ThemeSettings } from '../../types';
import { isUrlEntitled } from '../../entitlements';
import { httpRequest } from '../../http';
import { useEcclesia, EcclesiaContextValue } from './EcclesiaContext';
import { applyThemeStructure, injectThemeTokens } from '../../../../../theme-customizer/src/utils/domParser';

const ASSET_BASE = '/themes/ecclesia';
const LUCIDE_CDN = 'https://unpkg.com/lucide@latest';
const STATIC_PAGE_EXTRA_ATTR = 'data-static-page-extra';
const STATIC_SHELL_SELECTOR = [
  'header',
  '.header',
  'footer',
  '.footer',
  '.top',
  '.top-notice',
  '.mobile-drawer',
  '#mobileDrawer',
  '.drawer',
  '#drawer',
  '.drawer-backdrop',
  '#drawerBackdrop',
  '.mobile-tab-rail',
  '.left-rail',
  '.right-rail',
  'script',
  'style',
  'link',
].join(', ');

type StaticScript = {
  src?: string;
  code?: string;
};

type StaticPayload = {
  html: string;
  title: string;
  bodyClassNames: string[];
  bodyAttributes: Record<string, string>;
  headLinks: Array<{ href: string; rel: string; media?: string; crossOrigin?: string }>;
  headStyles: Array<{ id?: string; css: string }>;
  scripts: StaticScript[];
  needsLucide: boolean;
  headerActionsHtml: string;
};

interface Props {
  html: string;
  themeSettings?: ThemeSettings;
  enableModuleRails?: boolean;
  moduleEntitlements?: ModuleEntitlement[];
  isShellStatic?: boolean;
  preserveDocument?: boolean;
  assetBase?: string;
  ecContextOverride?: EcclesiaContextValue | null;
}

declare global {
  interface Window {
    navigateToPage?: (url: string) => void;
    lucide?: { createIcons?: () => void };
  }
}

const RAIL_ITEMS = [
  { label: 'Media', path: '/media', icon: 'tv' },
  { label: 'Livestream', path: '/livestream', icon: 'video' },
  { label: 'Podcast', path: '/podcast', icon: 'mic' },
  { label: 'Articles', path: '/blog', icon: 'newspaper' },
  { label: 'Services', path: '/services', icon: 'calendar' },
  { label: 'Library', path: '/library', icon: 'book-open' },
  { label: 'LMS', path: '/courses', icon: 'graduation-cap' },
  { label: 'Worship', path: '/worship', icon: 'music' },
];

function menuByName(menus: NavigationMenu[] | undefined, name: string): NavigationMenu | null {
  return menus?.find((menu) => menu.name?.toLowerCase() === name.toLowerCase()) || null;
}

function iconForMenuLabel(label: string): string {
  const normalized = label.toLowerCase();
  if (normalized.includes('media')) return 'tv';
  if (normalized.includes('live')) return 'video';
  if (normalized.includes('podcast')) return 'mic';
  if (normalized.includes('article') || normalized.includes('blog')) return 'newspaper';
  if (normalized.includes('service') || normalized.includes('event')) return 'calendar';
  if (normalized.includes('library') || normalized.includes('resource')) return 'book-open';
  if (normalized.includes('lms') || normalized.includes('course') || normalized.includes('study')) return 'graduation-cap';
  if (normalized.includes('worship')) return 'music';
  if (normalized.includes('fellowship') || normalized.includes('cell') || normalized.includes('group')) return 'users';
  if (normalized.includes('store') || normalized.includes('giving')) return 'shopping-bag';
  if (normalized.includes('devortion') || normalized.includes('devotion') || normalized.includes('prayer')) return 'heart';
  if (normalized.includes('contact') || normalized.includes('connect')) return 'mail';
  if (normalized.includes('home')) return 'home';
  return 'link';
}

function normalizeMenuPath(item: NavItem): string {
  const rawUrl = String(item.url || '').trim();
  if (!rawUrl) return '/';
  return routeFromHref(rawUrl) || (rawUrl.startsWith('/') ? rawUrl : `/${rawUrl.replace(/\.html$/i, '')}`);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const COLLECTION_ROUTE_CONFIG: Record<string, {
  key: string;
  eyebrow: string;
  title: string;
  description: string;
  detailBase: string;
  empty: string;
}> = {
  blog: {
    key: 'articles',
    eyebrow: 'Articles',
    title: 'Church Articles',
    description: 'News, devotionals, testimonies, and pastoral notes from the church dashboard.',
    detailBase: '/blog',
    empty: 'No articles have been published yet.',
  },
  media: {
    key: 'media',
    eyebrow: 'Media',
    title: 'Media Library',
    description: 'Videos, audio messages, worship moments, and ministry highlights.',
    detailBase: '/media',
    empty: 'No media items have been published yet.',
  },
  sermons: {
    key: 'sermons',
    eyebrow: 'Sermons',
    title: 'Sermon Archive',
    description: 'Recent messages, series, speakers, and teaching notes.',
    detailBase: '/sermons',
    empty: 'No sermons have been published yet.',
  },
  services: {
    key: 'services',
    eyebrow: 'Services',
    title: 'Services',
    description: 'Gathering times, service formats, and worship details.',
    detailBase: '/services',
    empty: 'No services have been published yet.',
  },
  library: {
    key: 'resources',
    eyebrow: 'Resources',
    title: 'Resource Library',
    description: 'Downloadable guides, devotionals, ministry documents, and study material.',
    detailBase: '/library',
    empty: 'No resources have been published yet.',
  },
  courses: {
    key: 'courses',
    eyebrow: 'Courses',
    title: 'Discipleship Courses',
    description: 'Courses, modules, lessons, and quizzes published from the dashboard.',
    detailBase: '/courses',
    empty: 'No courses have been published yet.',
  },
  podcast: {
    key: 'podcasts',
    eyebrow: 'Podcasts',
    title: 'Podcast Episodes',
    description: 'Audio conversations, teachings, and recurring church podcast episodes.',
    detailBase: '/podcast',
    empty: 'No podcast episodes have been published yet.',
  },
  store: {
    key: 'products',
    eyebrow: 'Store',
    title: 'Church Store',
    description: 'Books, apparel, course materials, and ministry resources available from the dashboard.',
    detailBase: '/store',
    empty: 'No products have been published yet.',
  },
  events: {
    key: 'events',
    eyebrow: 'Events',
    title: 'Events',
    description: 'Upcoming services, conferences, trainings, and community gatherings.',
    detailBase: '/events',
    empty: 'No events have been published yet.',
  },
};

function itemSlug(item: any): string {
  return String(item?.slug || item?.id || '').replace(/^\/+/, '');
}

function itemTitle(item: any): string {
  return String(item?.title || item?.name || item?.episodeTitle || item?.productName || 'Untitled');
}

function itemDescription(item: any): string {
  return String(item?.summary || item?.description || item?.excerpt || item?.notes || item?.content || '');
}

function itemMeta(item: any, configKey: string): string {
  const bits = [
    item?.date || item?.publishedAt || item?.startDate || item?.createdAt,
    item?.speaker || item?.author || item?.host || item?.instructor || item?.type,
    item?.duration,
    item?.price,
    item?.location,
  ].filter(Boolean).map(String);

  if (configKey === 'courses' && Array.isArray(item?.modules)) {
    bits.push(`${item.modules.length} modules`);
  }
  return bits.slice(0, 3).join(' - ');
}

function isExternalMediaUrl(value: unknown): boolean {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function mediaButton(item: any): string {
  const mediaUrl = item?.videoUrl || item?.audioUrl || item?.downloadUrl || item?.url;
  if (!isExternalMediaUrl(mediaUrl)) return '';
  return `<a class="dashboard-archive__button secondary" href="${escapeHtml(String(mediaUrl))}" target="_blank" rel="noopener noreferrer">Open media</a>`;
}

function renderArchiveCards(items: any[], config: typeof COLLECTION_ROUTE_CONFIG[string]): string {
  return items.map((item) => {
    const slug = itemSlug(item);
    const detailUrl = slug ? `${config.detailBase}/${slug}` : config.detailBase;
    const image = item?.imageUrl || item?.thumbnailUrl || item?.coverUrl;
    const title = itemTitle(item);
    const description = itemDescription(item);
    const meta = itemMeta(item, config.key);
    const courseDetails = config.key === 'courses' && Array.isArray(item.modules)
      ? `<ul class="dashboard-archive__mini-list">${item.modules.slice(0, 3).map((module: any) => `<li>${escapeHtml(module.title || module.name || 'Module')} - ${(module.lessons || []).length} lessons - ${(module.quizzes || []).length} quizzes</li>`).join('')}</ul>`
      : '';

    return `
      <article class="dashboard-archive__card">
        ${image ? `<img src="${escapeHtml(String(image))}" alt="">` : `<div class="dashboard-archive__media-fallback">${escapeHtml(config.eyebrow.slice(0, 2).toUpperCase())}</div>`}
        <div class="dashboard-archive__card-body">
          ${meta ? `<p class="dashboard-archive__meta">${escapeHtml(meta)}</p>` : ''}
          <h2>${escapeHtml(title)}</h2>
          ${description ? `<p>${escapeHtml(description)}</p>` : ''}
          ${courseDetails}
          <div class="dashboard-archive__actions">
            <a class="dashboard-archive__button" href="${escapeHtml(detailUrl)}">View details</a>
            ${mediaButton(item)}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderArchivePage(config: typeof COLLECTION_ROUTE_CONFIG[string], items: any[], tenantName: string): string {
  const cards = items.length
    ? `<div class="dashboard-archive__grid">${renderArchiveCards(items, config)}</div>`
    : `<div class="dashboard-archive__empty">${escapeHtml(config.empty)}</div>`;

  return `
    <section class="dashboard-archive">
      <div class="dashboard-archive__hero">
        <p class="dashboard-archive__eyebrow">${escapeHtml(config.eyebrow)}</p>
        <h1>${escapeHtml(config.title)}</h1>
        <p>${escapeHtml(config.description)}</p>
        <span>${escapeHtml(tenantName)}</span>
      </div>
      ${cards}
    </section>
  `;
}

function renderDetailPage(config: typeof COLLECTION_ROUTE_CONFIG[string], item: any, tenantName: string): string {
  if (!item) return renderArchivePage(config, [], tenantName);
  const image = item?.imageUrl || item?.thumbnailUrl || item?.coverUrl;
  const title = itemTitle(item);
  const description = itemDescription(item);
  const meta = itemMeta(item, config.key);
  const modules = config.key === 'courses' && Array.isArray(item.modules)
    ? `<div class="dashboard-archive__detail-block"><h2>Course Outline</h2>${item.modules.map((module: any) => `
        <section>
          <h3>${escapeHtml(module.title || module.name || 'Module')}</h3>
          <p>${escapeHtml(module.description || '')}</p>
          <ul>${(module.lessons || []).map((lesson: any) => `<li>${escapeHtml(lesson.title || lesson.name || 'Lesson')}</li>`).join('')}</ul>
          ${(module.quizzes || []).length ? `<p class="dashboard-archive__meta">${(module.quizzes || []).length} quizzes</p>` : ''}
        </section>
      `).join('')}</div>`
    : '';

  return `
    <article class="dashboard-archive dashboard-archive--detail">
      <a class="dashboard-archive__back" href="${escapeHtml(config.detailBase)}">Back to ${escapeHtml(config.title)}</a>
      <div class="dashboard-archive__detail">
        <div>
          <p class="dashboard-archive__eyebrow">${escapeHtml(config.eyebrow)}</p>
          <h1>${escapeHtml(title)}</h1>
          ${meta ? `<p class="dashboard-archive__meta">${escapeHtml(meta)}</p>` : ''}
          ${description ? `<p>${escapeHtml(description)}</p>` : ''}
          <div class="dashboard-archive__actions">${mediaButton(item)}</div>
        </div>
        ${image ? `<img src="${escapeHtml(String(image))}" alt="">` : `<div class="dashboard-archive__media-fallback">${escapeHtml(config.eyebrow.slice(0, 2).toUpperCase())}</div>`}
      </div>
      ${modules}
    </article>
  `;
}

function dashboardArchiveStyles(): string {
  return `
    .dashboard-archive{padding:clamp(56px,8vw,104px) clamp(22px,6vw,80px);max-width:1280px;margin:0 auto;color:var(--text,var(--site-text,#1d1812))}
    .dashboard-archive__hero{max-width:780px;margin-bottom:34px}
    .dashboard-archive__eyebrow,.dashboard-archive__meta{font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;color:var(--accent,var(--primary,#0877aa));margin:0 0 10px}
    .dashboard-archive h1{font-family:var(--font-heading,var(--font-title,inherit));font-size:clamp(42px,7vw,88px);line-height:.98;margin:0 0 16px}
    .dashboard-archive h2{font-family:var(--font-heading,var(--font-title,inherit));font-size:clamp(24px,3vw,34px);line-height:1.05;margin:0 0 12px}
    .dashboard-archive p{font-size:clamp(16px,1.8vw,20px);line-height:1.55;color:var(--muted,var(--site-muted,#74685e));margin:0 0 16px}
    .dashboard-archive__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
    .dashboard-archive__card{background:var(--surface,var(--site-surface,#fff));border:1px solid var(--border,var(--site-border,rgba(0,0,0,.1)));border-radius:var(--radius-xl,var(--radius,20px));overflow:hidden;box-shadow:var(--shadow,0 16px 40px rgba(0,0,0,.08))}
    .dashboard-archive__card img,.dashboard-archive__detail img{width:100%;aspect-ratio:16/10;object-fit:cover;display:block}
    .dashboard-archive__card-body{padding:22px}
    .dashboard-archive__media-fallback{aspect-ratio:16/10;display:grid;place-items:center;background:var(--surface-soft,var(--site-soft,#eef6fb));color:var(--accent,var(--primary,#0877aa));font-size:42px;font-weight:900}
    .dashboard-archive__actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
    .dashboard-archive__button,.dashboard-archive__back{display:inline-flex;align-items:center;justify-content:center;border-radius:var(--radius-btn,999px);padding:12px 16px;background:var(--accent,var(--primary,#0877aa));color:#fff;text-decoration:none;font-weight:900;border:0}
    .dashboard-archive__button.secondary{background:var(--surface-soft,var(--site-soft,#eef6fb));color:var(--text,var(--site-text,#1d1812))}
    .dashboard-archive__empty{padding:34px;border:1px dashed var(--border,var(--site-border,rgba(0,0,0,.15)));border-radius:var(--radius-xl,var(--radius,20px));background:var(--surface,var(--site-surface,#fff));color:var(--muted,var(--site-muted,#74685e))}
    .dashboard-archive__detail{display:grid;grid-template-columns:minmax(0,1fr) minmax(280px,520px);gap:34px;align-items:start;margin-top:22px}
    .dashboard-archive__detail-block{margin-top:34px;display:grid;gap:16px}
    .dashboard-archive__detail-block section{background:var(--surface,var(--site-surface,#fff));border:1px solid var(--border,var(--site-border,rgba(0,0,0,.1)));border-radius:var(--radius-xl,var(--radius,20px));padding:22px}
    .dashboard-archive__mini-list{margin:12px 0 0;padding-left:18px;color:var(--muted,var(--site-muted,#74685e))}
    @media(max-width:760px){.dashboard-archive{padding:42px 18px 96px}.dashboard-archive__detail{grid-template-columns:1fr}.dashboard-archive__grid{grid-template-columns:1fr}}
  `;
}

function applyDashboardCollections(doc: Document, pathname: string, collections?: DashboardCollections, tenantName = 'Church'): void {
  if (!collections) return;
  const slug = slugFromPathname(pathname);
  const [prefix, ...rest] = slug.split('/');
  const config = COLLECTION_ROUTE_CONFIG[prefix || ''];
  if (!config) return;
  if (prefix === 'store' && ['cart', 'checkout', 'thank-you', 'checkout-failed'].includes(rest.join('/'))) return;
  if (prefix === 'events' && rest.join('/') === 'register') return;

  const items = Array.isArray(collections[config.key]) ? collections[config.key] : [];
  const item = rest.length
    ? items.find((entry) => itemSlug(entry) === rest.join('/') || itemSlug(entry) === rest[0])
    : null;
  const html = rest.length && rest.join('/') !== 'archive'
    ? renderDetailPage(config, item, tenantName)
    : renderArchivePage(config, items, tenantName);

  let style = doc.getElementById('dashboard-archive-styles') as HTMLStyleElement | null;
  if (!style) {
    style = doc.createElement('style');
    style.id = 'dashboard-archive-styles';
    doc.head.appendChild(style);
  }
  style.textContent = dashboardArchiveStyles();

  const main = doc.getElementById('content-outlet') || doc.querySelector('main') || doc.body;
  main.innerHTML = html;
}

function readText(value: unknown): string {
  return String(value || '').trim();
}

function getServiceSummary(ecContext?: EcclesiaContextValue | null): string {
  const serviceTimes = ecContext?.globalContent?.services?.serviceTimes || [];
  return serviceTimes
    .filter((item) => readText(item.label) || readText(item.time))
    .slice(0, 2)
    .map((item) => {
      const label = readText(item.label || 'Service');
      const time = readText(item.time);
      return time ? `${label}: ${time}` : label;
    })
    .join(' · ');
}

function replaceTextNodes(doc: Document, replacements: Array<[string, string]>): void {
  const filtered = replacements.filter(([from, to]) => from && to && from !== to);
  if (!filtered.length || !doc.body) return;

  const walker = doc.createTreeWalker(doc.body, 4);
  const textNodes: Text[] = [];
  let node = walker.nextNode();
  while (node) {
    textNodes.push(node as Text);
    node = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    let text = textNode.nodeValue || '';
    filtered.forEach(([from, to]) => {
      text = text.split(from).join(to);
    });
    textNode.nodeValue = text;
  });
}

function applyTenantContent(doc: Document, ecContext?: EcclesiaContextValue | null): void {
  const churchName = readText(ecContext?.globalContent?.churchIdentity?.churchName || ecContext?.tenant?.name);
  if (!churchName) return;

  const identity = ecContext?.globalContent?.churchIdentity;
  const contact = ecContext?.globalContent?.contact;
  const logoUrl = readText(identity?.logoUrl);
  const faviconUrl = readText(identity?.faviconUrl);
  const description = readText(identity?.description);
  const email = readText(contact?.email);
  const phone = readText(contact?.phone);
  const address = readText(contact?.address);
  const serviceSummary = getServiceSummary(ecContext);

  if (doc.title) {
    doc.title = doc.title
      .split('CE Ggaba 2').join(churchName)
      .split('CE Entebbe').join(churchName)
      .split('Grace City Church').join(churchName)
      .split('Grace City').join(churchName);
  }

  const metaDescription = doc.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (metaDescription && description) metaDescription.setAttribute('content', description);

  if (faviconUrl) {
    let favicon = doc.querySelector<HTMLLinkElement>('link[rel~="icon"]');
    if (!favicon) {
      favicon = doc.createElement('link');
      favicon.setAttribute('rel', 'icon');
      doc.head.appendChild(favicon);
    }
    favicon.setAttribute('href', faviconUrl);
  }

  doc.querySelectorAll<HTMLElement>('.brand').forEach((brand) => {
    const spans = Array.from(brand.querySelectorAll('span'));
    const label = spans.find((span) => {
      const text = readText(span.textContent);
      return text.includes('Grace City') || text.includes('Church') || text.startsWith('CE ');
    }) || spans[spans.length - 1];
    if (label) label.textContent = churchName;
  });

  if (logoUrl) {
    doc.querySelectorAll<HTMLElement>('.brand .brand-mark, .brand .mark, .site-brand .site-mark').forEach((mark) => {
      mark.innerHTML = '';
      const img = doc.createElement('img');
      img.setAttribute('src', logoUrl);
      img.setAttribute('alt', `${churchName} logo`);
      img.setAttribute('style', 'width:100%;height:100%;object-fit:contain;display:block;');
      mark.appendChild(img);
    });
  }

  if (serviceSummary) {
    doc.querySelectorAll<HTMLElement>('.top-notice').forEach((notice) => {
      notice.textContent = serviceSummary;
    });
  }

  replaceTextNodes(doc, [
    ['CE Ggaba 2', churchName],
    ['CE Entebbe', churchName],
    ['Grace City Church', churchName],
    ['Grace City', churchName],
    ['A Spirit-filled church helping people encounter Jesus, grow in the Word, build strong families, and serve their city.', description],
    ['Grace City Church is a vibrant, Spirit-filled community where people worship, grow, serve, pray, and discover God’s purpose for their lives.', description],
    ['Grace City Church exists to help people know Jesus, grow in the Word, build strong families, and serve their city with compassion and excellence.', description],
    ['hello@example.church', email],
    ['hello@gracecitychurch.org', email],
    ['hello@gracecity.church', email],
    ['+1 555 000 0000', phone],
    ['+1 000 000 0000', phone],
    ['+1 555 010 2026', phone],
    ['(555) 123-4567', phone],
    ['123 Worship Avenue, Your City', address],
    ['123 Kingdom Avenue, Edmonton, AB', address],
    ['101 Fellowship Way, Grace City', address],
    ['Sunday Service: 9:30 AM · Midweek Word & Prayer: Wednesday 7:00 PM', serviceSummary],
    ['Sunday Worship: 9:30 AM · Midweek Word & Prayer: Wednesday 7:00 PM', serviceSummary],
    ['Sunday 9:30 AM · Wednesday 7:00 PM', serviceSummary],
  ]);
}

type RailNavItem = {
  label: string;
  path: string;
  icon: string;
};

function getRailItems(settings?: ThemeSettings | null, navigationMenus?: NavigationMenu[]): RailNavItem[] {
  const railMenu = menuByName(navigationMenus, 'Rail Navigation') || menuByName(navigationMenus, 'Mobile Rail Navigation');
  const configuredItems = railMenu?.items?.length ? railMenu.items : Array.isArray(settings?.moduleRail) ? settings.moduleRail : [];
  const items = configuredItems.length > 0
    ? configuredItems.map((item: any) => {
        const route = normalizeMenuPath(item);
        return {
          label: String(item.label || 'Page'),
          path: route,
          icon: String(item.icon || iconForMenuLabel(String(item.label || 'Page'))),
        };
      })
    : RAIL_ITEMS;

  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.path || seen.has(item.path)) return false;
    seen.add(item.path);
    return true;
  });
}

function renderRailHtml(pathname: string, settings?: ThemeSettings | null, entitlements?: ModuleEntitlement[], navigationMenus?: NavigationMenu[]): string {
  const items = getRailItems(settings, navigationMenus).filter((item) => isUrlEntitled(item.path, entitlements));
  if (items.length === 0) return '';

  const links = items.map((item) => {
    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
    return `<a class="rail-item${isActive ? ' active' : ''}" href="${escapeHtml(item.path)}" title="${escapeHtml(item.label)}"><i data-lucide="${item.icon}"></i><span>${escapeHtml(item.label)}</span></a>`;
  }).join('');

  return `<nav class="rail-nav">${links}</nav>`;
}

function renderMobileTabHtml(pathname: string, settings?: ThemeSettings | null, entitlements?: ModuleEntitlement[], navigationMenus?: NavigationMenu[]): string {
  const bottomMenu = menuByName(navigationMenus, 'Bottom Mobile Menu');
  const items = (bottomMenu?.items?.length
    ? bottomMenu.items.map((item) => ({
        label: item.label,
        path: normalizeMenuPath(item),
        icon: item.icon || iconForMenuLabel(item.label),
      }))
    : getRailItems(settings, navigationMenus).filter((item) => ['Media', 'Podcast', 'Articles', 'Services', 'Library', 'Worship'].includes(item.label)))
    .filter((item) => isUrlEntitled(item.path, entitlements));
  if (items.length === 0) return '';

  return items.map((item) => {
    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
    return `<a class="mobile-tab-item${isActive ? ' active' : ''}" href="${escapeHtml(item.path)}"><i data-lucide="${item.icon}"></i><span>${escapeHtml(item.label)}</span></a>`;
  }).join('');
}

function renderMobileDrawerHtml(ecContext: EcclesiaContextValue): string {
  const { navigation, navigationMenus, moduleEntitlements } = ecContext;
  const drawerMenu = menuByName(navigationMenus, 'Main Mobile Drawer Menu');
  const items = (drawerMenu?.items?.length ? drawerMenu.items : navigation?.items || [])
    .filter((item) => isUrlEntitled(item.url, moduleEntitlements));
  const showLiveAction = isUrlEntitled('/livestream', moduleEntitlements);
  const showGivingAction = isUrlEntitled('/giving', moduleEntitlements);

  const navIcons: Record<string, string> = {
    '/': 'home',
    '/home': 'home',
    '/about': 'info',
    '/sermons': 'play-square',
    '/events': 'calendar-days',
    '/ministries': 'users-round',
    '/prayer': 'heart-handshake',
    '/contact': 'mail',
  };

  const closeRow = `
    <div class="drawer-close-row">
      <button class="drawer-close" id="closeDrawer" aria-label="Close menu">
        <i data-lucide="x"></i>
      </button>
    </div>
  `;

  const links = items.map((item) => {
    const url = normalizeMenuPath(item) === '/home' ? '/' : normalizeMenuPath(item);
    const icon = navIcons[url] || navIcons[item.url] || 'link';
    return `<a class="pjax-link" href="${escapeHtml(url)}"><i data-lucide="${icon}"></i><span>${escapeHtml(item.label)}</span></a>`;
  }).join('');

  const navHtml = `<nav class="drawer-nav">${links}</nav>`;

  let actionsHtml = '';
  if (showLiveAction || showGivingAction) {
    let liveButton = '';
    if (showLiveAction) {
      liveButton = `<a href="/livestream" class="btn btn-light btn-full pjax-link"><i data-lucide="radio"></i> Watch Live</a>`;
    }
    let giveButton = '';
    if (showGivingAction) {
      giveButton = `<a href="/giving" class="btn btn-primary btn-full pjax-link"><i data-lucide="hand-coins"></i> Give</a>`;
    }
    actionsHtml = `<div class="drawer-actions">${liveButton}${giveButton}</div>`;
  }

  return `${closeRow}${navHtml}${actionsHtml}`;
}

function renderDefaultMobileDrawerHtml(): string {
  const items = [
    { label: 'Home', url: '/' },
    { label: 'About', url: '/about' },
    { label: 'Sermons', url: '/sermons' },
    { label: 'Events', url: '/events' },
    { label: 'Ministries', url: '/ministries' },
    { label: 'Prayer', url: '/prayer' },
    { label: 'Contact', url: '/contact' },
  ];

  const closeRow = `
    <div class="drawer-close-row">
      <button class="drawer-close" id="closeDrawer" aria-label="Close menu">
        <i data-lucide="x"></i>
      </button>
    </div>
  `;

  const links = items.map((item) => {
    const navIcons: Record<string, string> = {
      '/': 'home',
      '/about': 'info',
      '/sermons': 'play-square',
      '/events': 'calendar-days',
      '/ministries': 'users-round',
      '/prayer': 'heart-handshake',
      '/contact': 'mail',
    };
    const icon = navIcons[item.url] || 'link';
    return `<a class="pjax-link" href="${escapeHtml(item.url)}"><i data-lucide="${icon}"></i><span>${escapeHtml(item.label)}</span></a>`;
  }).join('');

  const navHtml = `<nav class="drawer-nav">${links}</nav>`;
  const actionsHtml = `
    <div class="drawer-actions">
      <a href="/livestream" class="btn btn-light btn-full pjax-link"><i data-lucide="radio"></i> Watch Live</a>
      <a href="/giving" class="btn btn-primary btn-full pjax-link"><i data-lucide="hand-coins"></i> Give</a>
    </div>
  `;

  return `${closeRow}${navHtml}${actionsHtml}`;
}

function renderMobileRailDrawerHtml(pathname: string, settings?: ThemeSettings | null, entitlements?: ModuleEntitlement[], navigationMenus?: NavigationMenu[]): string {
  const railItems = getRailItems(settings, navigationMenus).filter((item) => isUrlEntitled(item.path, entitlements));
  const links = railItems.map((item) => {
    const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
    return `<a class="rail-item pjax-link${isActive ? ' active' : ''}" href="${escapeHtml(item.path)}"><i data-lucide="${item.icon}"></i><span>${escapeHtml(item.label)}</span></a>`;
  }).join('');

  return `
    <div class="drawer-close-row">
      <button class="drawer-close" type="button" aria-label="Close rail menu">
        <i data-lucide="x"></i>
      </button>
    </div>
    <nav class="rail-nav mobile-rail-drawer-nav">${links}</nav>
  `;
}

function themeSetting(settings: ThemeSettings | null | undefined, key: string, fallback: string): string {
  const value = settings?.[key];
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getThemeBodyAttributes(settings?: ThemeSettings | null): Record<string, string> {
  const mobileMenuPosition = themeSetting(settings, 'mobileMenuPosition', 'left');
  const mobileMenuFlip = Boolean(settings?.mobileMenuFlip);
  const mainDrawerSide = mobileMenuFlip
    ? (mobileMenuPosition === 'left' ? 'right' : 'left')
    : mobileMenuPosition;
  const railDrawerSide = mobileMenuFlip
    ? mobileMenuPosition
    : (mobileMenuPosition === 'left' ? 'right' : 'left');

  return {
    'data-mobile-menu-position': mobileMenuPosition,
    'data-mobile-menu-flip': String(mobileMenuFlip),
    'data-mobile-drawer-side': mainDrawerSide,
    'data-mobile-rail-side': railDrawerSide,
    'data-mobile-rail-vertical-align': themeSetting(settings, 'mobileRailVerticalAlign', 'center'),
    'data-mobile-logo-align': themeSetting(settings, 'mobileLogoAlign', 'center'),
    'data-mobile-drawer-mode': themeSetting(settings, 'mobileDrawerMode', 'reveal'),
    'data-mobile-drawer-buttons-full-width': String(Boolean(settings?.mobileDrawerButtonsFullWidth)),
    'data-mobile-drawer-combine': String(settings?.mobileDrawerCombine !== false),
    'data-mobile-drawer-rail-position': themeSetting(settings, 'mobileDrawerRailPosition', 'right'),
    'data-rail-position': themeSetting(settings, 'railPosition', 'left'),
    'data-rail-show-icons': String(settings?.railShowIcons !== false),
    'data-rail-style': themeSetting(settings, 'railStyle', 'full'),
    'data-rail-shadow': String(Boolean(settings?.railShadow)),
    'data-rail-shadow-intensity': themeSetting(settings, 'railShadowIntensity', 'medium'),
    'data-rail-shadow-themed': String(Boolean(settings?.railShadowThemed)),
    'data-rail-solid-themed': String(Boolean(settings?.railSolidThemed)),
    'data-rail-border': String(settings?.railBorder !== false),
    'data-rail-border-size': themeSetting(settings, 'railBorderSize', 'small'),
    'data-rail-border-color': themeSetting(settings, 'railBorderColor', 'standard'),
    'data-rail-vertical-align': themeSetting(settings, 'railVerticalAlign', 'center'),
    'data-rail-font-size': themeSetting(settings, 'railFontSize', 'medium'),
    'data-rail-font-weight': themeSetting(settings, 'railFontWeight', 'bold'),
  };
}

function applyRailAttributes(element: HTMLElement, settings?: ThemeSettings | null): void {
  const attrs = getThemeBodyAttributes(settings);
  Object.entries(attrs).forEach(([name, value]) => {
    if (name.startsWith('data-rail-')) element.setAttribute(name, value);
  });
}

function createRailElement(doc: Document, railHtml: string, settings?: ThemeSettings | null): HTMLElement {
  const position = themeSetting(settings, 'railPosition', 'left');
  const rail = doc.createElement(position === 'below-header' ? 'div' : 'aside');
  rail.className = position === 'below-header'
    ? 'rail-menu-horizontal'
    : position === 'right'
      ? 'right-rail'
      : 'left-rail';
  rail.innerHTML = railHtml;
  applyRailAttributes(rail, settings);
  return rail;
}

function upsertRail(shellWrapper: Element, mainShellBody: Element, doc: Document, railHtml: string, settings?: ThemeSettings | null): void {
  shellWrapper.querySelectorAll(':scope > .rail-menu-horizontal').forEach((rail) => rail.remove());
  mainShellBody.querySelectorAll(':scope > .left-rail, :scope > .right-rail').forEach((rail) => rail.remove());
  if (!railHtml) return;

  const position = themeSetting(settings, 'railPosition', 'left');
  const rail = createRailElement(doc, railHtml, settings);

  if (position === 'below-header') {
    const header = shellWrapper.querySelector('header, .header, .top-notice, .top');
    if (header?.nextSibling) {
      shellWrapper.insertBefore(rail, header.nextSibling);
    } else if (header) {
      shellWrapper.appendChild(rail);
    } else {
      shellWrapper.insertBefore(rail, mainShellBody);
    }
    return;
  }

  if (position === 'right') {
    mainShellBody.appendChild(rail);
  } else {
    mainShellBody.insertBefore(rail, mainShellBody.firstChild);
  }
}


function splitUrlSuffix(value: string) {
  const match = value.match(/^([^?#]*)([?#].*)?$/);
  return { path: match?.[1] || value, suffix: match?.[2] || '' };
}

function normalizeAssetBase(assetBase?: string): string {
  return (assetBase || ASSET_BASE).replace(/\/+$/, '');
}

function rewriteAssetUrl(value: string, assetBase?: string): string {
  const trimmed = value.trim();
  if (!trimmed || /^(https?:|data:|blob:|mailto:|tel:|#|\/)/i.test(trimmed)) return value;

  const { path, suffix } = splitUrlSuffix(trimmed.replace(/^\.\//, ''));
  if (path.startsWith('assets/')) {
    return `${normalizeAssetBase(assetBase)}/${path}${suffix}`;
  }

  return value;
}

function rewriteInlineUrls(value: string, assetBase?: string): string {
  return value.replace(/url\((['"]?)(?!https?:|data:|blob:|\/|#)([^'")]+)\1\)/gi, (_match, quote, rawUrl) => {
    return `url(${quote}${rewriteAssetUrl(rawUrl, assetBase)}${quote})`;
  });
}

function getBlockContent(block: any): string {
  if (block && typeof block.html === 'string') return block.html;
  if (block && typeof block.content === 'string') return block.content;
  const data = block?.data || {};
  return typeof data.content === 'string' ? data.content : '';
}

function isFullHtmlContent(content: string): boolean {
  const normalized = content.trim().toLowerCase();
  if (!normalized) return false;
  return (
    normalized.startsWith('<!doctype') ||
    normalized.startsWith('<html') ||
    normalized.includes('<body') ||
    (normalized.includes('<header') && normalized.includes('<footer'))
  );
}

function getFullHtml(blocks?: any[]): string | null {
  if (!blocks || blocks.length === 0) return null;
  const match = blocks.map(getBlockContent).find(isFullHtmlContent);
  return match || null;
}

function findStaticContentElement(parent: Document | HTMLElement): HTMLElement | null {
  if ('getElementById' in parent) {
    const contentOutlet = parent.getElementById('content-outlet');
    if (contentOutlet) return contentOutlet;
  } else {
    const contentOutlet = parent.querySelector<HTMLElement>('#content-outlet');
    if (contentOutlet) return contentOutlet;
  }
  return parent.querySelector<HTMLElement>('main');
}

function isStaticPageExtraElement(element: Element): boolean {
  if (element.matches('main, #content-outlet')) return false;
  return !element.matches(STATIC_SHELL_SELECTOR);
}

function markStaticPageExtras(doc: Document): void {
  Array.from(doc.body.children).forEach((element) => {
    if (isStaticPageExtraElement(element)) {
      element.setAttribute(STATIC_PAGE_EXTRA_ATTR, 'true');
    }
  });
}

function syncActiveLinks(root: HTMLElement, route: string): void {
  const nextPath = new URL(route, window.location.origin).pathname;
  root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const linkRoute = routeFromHref(href);
    if (!linkRoute) return;
    const linkPath = new URL(linkRoute, window.location.origin).pathname;
    link.classList.toggle('active', linkPath === nextPath);
  });
}

function normalizeShellHrefs(doc: Document): void {
  doc.querySelectorAll<HTMLAnchorElement>('header a[href], .header a[href], footer a[href], .footer a[href], .mobile-drawer a[href], .mobile-tab-rail a[href], .left-rail a[href], .right-rail a[href], .rail-menu-horizontal a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;
    const route = routeFromHref(href);
    if (route) link.setAttribute('href', route);
  });
}

function normalizeMobileControls(doc: Document): void {
  doc.querySelectorAll<HTMLElement>('#menuBtn, .mobile-hamburger-btn').forEach((button) => {
    button.setAttribute('type', 'button');
    button.setAttribute('aria-controls', 'mobileDrawer');
    button.setAttribute('aria-expanded', 'false');
  });
  doc.querySelectorAll<HTMLElement>('#kebabBtn, .mobile-kebab-btn').forEach((button) => {
    button.setAttribute('type', 'button');
    button.setAttribute('aria-controls', 'mobileRailDrawer');
    button.setAttribute('aria-expanded', 'false');
  });
}

async function loadPublishedPageHtml(route: string, assetBase?: string): Promise<string | null> {
  const nextUrl = new URL(route, window.location.origin);
  const slug = slugFromPathname(nextUrl.pathname);

  try {
    const response = await httpRequest(`/api/cms/render?slug=${encodeURIComponent(slug)}`);
    if (response.ok) {
      const data = await response.json();
      const html = getFullHtml(data?.data?.contentBlocks);
      if (html) return html;
    }
  } catch (error) {
    console.warn('Failed to fetch published CMS page:', error);
  }

  const templateFile = getTemplateFileForSlug(slug);
  if (!templateFile) return null;

  try {
    const response = await httpRequest(`${normalizeAssetBase(assetBase)}/${templateFile}?t=${Date.now()}`);
    return response.ok ? response.text() : null;
  } catch (error) {
    console.warn('Failed to fetch static theme page:', error);
    return null;
  }
}

function isShellScript(script: StaticScript): boolean {
  const src = script.src || '';
  return /(?:^|\/)app\.js(?:[?#]|$)/i.test(src) || /lucide/i.test(src);
}

function renderFooterHtml(ecContext: EcclesiaContextValue): string {
  const { tenant, footer, globalContent } = ecContext;
  const churchName = globalContent?.churchIdentity?.churchName || tenant.name;
  const description = globalContent?.churchIdentity?.description || '';
  const serviceTimes = globalContent?.services?.serviceTimes || [];
  const socialLinks = footer?.socialLinks || [];
  const secondaryLinks = footer?.secondaryLinks || [];
  const copyright = footer?.copyrightText || `© ${new Date().getFullYear()} ${churchName}. All rights reserved.`;

  let socialsHtml = '';
  if (socialLinks.length > 0) {
    socialsHtml = `<div class="socials">` + socialLinks.map((link) => {
      const iconName = link.name.toLowerCase();
      return `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer"><i data-lucide="${escapeHtml(iconName)}"></i></a>`;
    }).join('') + `</div>`;
  }

  const col1Html = `
    <div>
      <a href="/" class="brand" style="color: white">
        <span class="brand-mark"><i data-lucide="church"></i></span>
        <span>${escapeHtml(churchName)}</span>
      </a>
      ${description ? `<p style="margin-top: 18px; max-width: 340px">${escapeHtml(description)}</p>` : ''}
      ${socialsHtml}
    </div>
  `;

  const col2Html = `
    <div>
      <h4>Explore</h4>
      <a href="/about">About</a>
      <a href="/sermons">Sermons</a>
      <a href="/events">Events</a>
      <a href="/ministries">Ministries</a>
    </div>
  `;

  let secondaryLinksHtml = '';
  if (secondaryLinks.length > 0) {
    secondaryLinksHtml = secondaryLinks.map((link) => {
      return `<a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`;
    }).join('');
  } else {
    secondaryLinksHtml = `
      <a href="/contact">Plan a Visit</a>
      <a href="/prayer">Prayer Request</a>
      <a href="/ministries">Join a Group</a>
      <a href="/contact">Volunteer</a>
    `;
  }
  const col3Html = `
    <div>
      <h4>Connect</h4>
      ${secondaryLinksHtml}
    </div>
  `;

  let serviceTimesHtml = '';
  if (serviceTimes.length > 0) {
    serviceTimesHtml = serviceTimes.map((s) => {
      return `<p>${escapeHtml(s.label)}<br />${escapeHtml(s.time)}</p>`;
    }).join('');
  } else {
    serviceTimesHtml = `<p>Sunday Worship<br />9:30 AM</p>`;
  }
  const col4Html = `
    <div>
      <h4>Service Times</h4>
      ${serviceTimesHtml}
    </div>
  `;

  return `
    <div class="footer-inner">
      <div class="footer-grid">
        ${col1Html}
        ${col2Html}
        ${col3Html}
        ${col4Html}
      </div>
      <div class="footer-bottom">
        <span>${copyright}</span>
        <span>Ecclesia Theme · Digital Church OS</span>
      </div>
    </div>
  `;
}

function buildStaticPayload(
  html: string,
  options: {
    enableModuleRails: boolean;
    pathname: string;
    moduleEntitlements?: ModuleEntitlement[];
    ecContext?: EcclesiaContextValue | null;
    themeSettings?: ThemeSettings;
    navigationMenus?: NavigationMenu[];
    isShellStatic?: boolean;
    preserveDocument?: boolean;
    assetBase?: string;
  }
): StaticPayload {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const activeThemeSettings = options.ecContext?.themeSettings || options.themeSettings || {};
  const activeNavigationMenus = options.ecContext?.navigationMenus || options.navigationMenus || [];

  try {
    injectThemeTokens(doc, activeThemeSettings as any);
    applyThemeStructure(doc, activeThemeSettings as any, activeNavigationMenus as any, 'ecclesia-full-theme');
  } catch (error) {
    console.warn('Failed to apply published customizer structure:', error);
  }

  applyTenantContent(doc, options.ecContext);
  applyDashboardCollections(doc, options.pathname, options.ecContext?.collections, options.ecContext?.tenant?.name);
  normalizeShellHrefs(doc);
  normalizeMobileControls(doc);

  // Strip existing mobile drawers from parsed/theme-transformed documents to avoid duplicates.
  doc.querySelectorAll('.mobile-drawer, #mobileDrawer, .drawer, #drawer, .mobile-rail-drawer, #mobileRailDrawer, .rail-drawer-backdrop').forEach((el) => el.remove());

  // Extract header actions before we strip/process elements
  const headerActionsEl = doc.querySelector('.header-actions');
  let headerActionsHtml = '';
  if (headerActionsEl) {
    const cloned = headerActionsEl.cloneNode(true) as HTMLElement;
    cloned.querySelectorAll('#menuBtn, .mobile-menu-btn').forEach(btn => btn.remove());
    headerActionsHtml = cloned.innerHTML;
  }

  const scripts: StaticScript[] = [];
  const headLinks: StaticPayload['headLinks'] = [];
  const headStyles: Array<{ id?: string; css: string }> = [];
  const shouldInjectRails = options.enableModuleRails;
  const railHtml = shouldInjectRails ? renderRailHtml(options.pathname, activeThemeSettings, options.moduleEntitlements, activeNavigationMenus) : '';
  const mobileTabHtml = shouldInjectRails ? renderMobileTabHtml(options.pathname, activeThemeSettings, options.moduleEntitlements, activeNavigationMenus) : '';

  doc.head.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]').forEach((link) => {
    const rawHref = link.getAttribute('href') || '';
    const href = rewriteAssetUrl(rawHref, options.assetBase);

    // Skip core theme stylesheets when rendering inside the dynamic shell wrapper
    // (where these sheets are already loaded globally) to avoid overriding customizer style tags.
    if (options.isShellStatic) {
      const cleanHref = href.split('?')[0].split('#')[0];
      if (
        cleanHref.startsWith('/themes/ecclesia/assets/') ||
        cleanHref.startsWith('assets/') ||
        cleanHref.endsWith('/assets/styles.css')
      ) {
        return;
      }
    }

    headLinks.push({
      href,
      rel: link.getAttribute('rel') || 'stylesheet',
      media: link.getAttribute('media') || undefined,
      crossOrigin: link.getAttribute('crossorigin') || undefined,
    });
  });

  doc.head.querySelectorAll('style').forEach((style) => {
    if (style.textContent?.trim()) {
      headStyles.push({
        id: style.id || undefined,
        css: rewriteInlineUrls(style.textContent, options.assetBase),
      });
    }
  });

  doc.querySelectorAll('script').forEach((script) => {
    const src = script.getAttribute('src');
    if (src) {
      scripts.push({ src: rewriteAssetUrl(src, options.assetBase) });
    } else if (script.textContent?.trim()) {
      scripts.push({ code: script.textContent });
    }
    script.remove();
  });

  doc.querySelectorAll<HTMLElement>('[src]').forEach((element) => {
    const src = element.getAttribute('src');
    if (src) element.setAttribute('src', rewriteAssetUrl(src, options.assetBase));
  });

  doc.querySelectorAll<HTMLElement>('[href]').forEach((element) => {
    const href = element.getAttribute('href');
    if (href && /^(?:\.\/)?assets\//i.test(href)) {
      element.setAttribute('href', rewriteAssetUrl(href, options.assetBase));
    }
  });

  doc.querySelectorAll<HTMLElement>('[style]').forEach((element) => {
    const style = element.getAttribute('style');
    if (style) element.setAttribute('style', rewriteInlineUrls(style, options.assetBase));
  });

  const stage = doc.createElement('div');
  stage.className = 'static-html-stage';

  if (options.isShellStatic) {
    let mainContentEl = doc.getElementById('content-outlet') || doc.querySelector('main');
    const contentDiv = doc.createElement('div');
    contentDiv.className = 'template-main-content';

    if (mainContentEl) {
      const mainClone = mainContentEl.cloneNode(true) as HTMLElement;
      Array.from(mainClone.attributes).forEach(attr => {
        if (attr.name !== 'id') {
          contentDiv.setAttribute(attr.name, attr.value);
        }
      });
      while (mainClone.firstChild) {
        contentDiv.appendChild(mainClone.firstChild);
      }
    } else {
      Array.from(doc.body.childNodes).forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (
            el.matches('header, .header, footer, .footer, .top-notice, .mobile-drawer, #mobileDrawer, .mobile-tab-rail, aside.left-rail')
          ) {
            return;
          }
        }
        contentDiv.appendChild(node.cloneNode(true));
      });
    }
    stage.appendChild(contentDiv);
  } else {
    const bodyChildren = Array.from(doc.body.childNodes);
    const hasShellWrapper = bodyChildren.some(
      (node) => node.nodeType === Node.ELEMENT_NODE && (node as Element).classList.contains('shell-wrapper')
    );

    if (hasShellWrapper) {
      bodyChildren.forEach((node) => stage.appendChild(node));

      const shellWrapper = stage.querySelector('.shell-wrapper');
      if (options.enableModuleRails) {
        const shellBody = stage.querySelector('.main-shell-body');
        if (shellWrapper && shellBody) {
          upsertRail(shellWrapper, shellBody, doc, railHtml, activeThemeSettings);
        }

        if (shellWrapper) {
          let mobileTabRail = stage.querySelector<HTMLElement>(':scope > .mobile-tab-rail') || stage.querySelector<HTMLElement>('.mobile-tab-rail');
          if (!mobileTabRail) {
            mobileTabRail = doc.createElement('div');
            mobileTabRail.className = 'mobile-tab-rail';
            stage.appendChild(mobileTabRail);
          } else if (mobileTabRail.parentNode !== stage) {
            stage.appendChild(mobileTabRail);
          }
          mobileTabRail.innerHTML = mobileTabHtml;
        }
      }
    } else {
      const shell = doc.createElement('div');
      shell.className = 'shell-wrapper static-shell-wrapper';
      const mainShellBody = doc.createElement('div');
      mainShellBody.className = 'main-shell-body';
      const contentOutlet = doc.createElement('div');
      contentOutlet.className = 'content-wrap';
      contentOutlet.id = 'content-outlet';
      const mobileTabRail = doc.createElement('div');
      mobileTabRail.className = 'mobile-tab-rail';
      mobileTabRail.innerHTML = mobileTabHtml;
      const drawers: Node[] = [];
      const footers: Node[] = [];

      bodyChildren.forEach((node) => {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).matches('.mobile-drawer, #mobileDrawer')
        ) {
          drawers.push(node);
          return;
        }

        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).matches('footer, .footer')
        ) {
          footers.push(node);
          return;
        }

        if (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).matches('header, .header, .top-notice, .top')
        ) {
          shell.appendChild(node);
          return;
        }

        contentOutlet.appendChild(node);
      });

      const railPosition = themeSetting(activeThemeSettings, 'railPosition', 'left');
      if (railHtml && railPosition === 'left') {
        mainShellBody.appendChild(createRailElement(doc, railHtml, activeThemeSettings));
      }
      mainShellBody.appendChild(contentOutlet);
      if (railHtml && railPosition === 'right') {
        mainShellBody.appendChild(createRailElement(doc, railHtml, activeThemeSettings));
      }
      stage.appendChild(shell);
      shell.appendChild(mainShellBody);
      if (railHtml && railPosition === 'below-header') {
        const header = Array.from(shell.childNodes).find((node) => (
          node.nodeType === Node.ELEMENT_NODE &&
          (node as Element).matches('header, .header, .top-notice, .top')
        ));
        if (header?.nextSibling) {
          shell.insertBefore(createRailElement(doc, railHtml, activeThemeSettings), header.nextSibling);
        } else {
          shell.insertBefore(createRailElement(doc, railHtml, activeThemeSettings), mainShellBody);
        }
      }

      footers.forEach((footer) => shell.appendChild(footer));

      stage.appendChild(mobileTabRail);

      drawers.forEach((drawer) => {
        if (drawer.nodeType === Node.ELEMENT_NODE) {
          const element = drawer as Element;
          element.setAttribute('aria-hidden', 'true');
        }
        stage.appendChild(drawer);
      });
    }

    // Inject dynamic canonical mobile drawer
    const drawerElement = doc.createElement('aside');
    drawerElement.className = 'mobile-drawer';
    drawerElement.id = 'mobileDrawer';
    drawerElement.setAttribute('aria-hidden', 'true');
    if (options.ecContext) {
      drawerElement.innerHTML = renderMobileDrawerHtml(options.ecContext);
    } else {
      drawerElement.innerHTML = renderDefaultMobileDrawerHtml();
    }
    stage.appendChild(drawerElement);

    if (activeThemeSettings.mobileDrawerCombine === false) {
      const railDrawerElement = doc.createElement('aside');
      railDrawerElement.className = 'mobile-rail-drawer';
      railDrawerElement.id = 'mobileRailDrawer';
      railDrawerElement.setAttribute('aria-hidden', 'true');
      railDrawerElement.innerHTML = renderMobileRailDrawerHtml(options.pathname, activeThemeSettings, options.moduleEntitlements, activeNavigationMenus);
      stage.appendChild(railDrawerElement);
    }
  }

  const bodyClassNames = (doc.body.getAttribute('class') || '')
    .split(/\s+/)
    .filter((className) => className && className !== 'drawer-open');
  if (!bodyClassNames.includes('shell-loaded')) bodyClassNames.push('shell-loaded');

  const bodyAttributes = Array.from(doc.body.attributes).reduce<Record<string, string>>((attrs, attr) => {
    if (attr.name !== 'class') attrs[attr.name] = attr.value;
    return attrs;
  }, {});
  Object.assign(bodyAttributes, getThemeBodyAttributes(activeThemeSettings));

  return {
    html: stage.innerHTML,
    title: doc.title,
    bodyClassNames,
    bodyAttributes,
    headLinks,
    headStyles,
    scripts,
    needsLucide: Boolean(stage.querySelector('[data-lucide]')),
    headerActionsHtml,
  };
}

function bindStaticDrawer(root: HTMLElement): () => void {
  const mainDrawer = root.querySelector<HTMLElement>('#mobileDrawer, .mobile-drawer');
  const railDrawer = root.querySelector<HTMLElement>('#mobileRailDrawer, .mobile-rail-drawer');
  if (!mainDrawer && !railDrawer) return () => undefined;

  const mainButtons = Array.from(root.querySelectorAll<HTMLElement>('#menuBtn, .mobile-hamburger-btn, [aria-controls="mobileDrawer"]'));
  const railButtons = Array.from(root.querySelectorAll<HTMLElement>('#kebabBtn, .mobile-kebab-btn, [aria-controls="mobileRailDrawer"]'));
  const closeButtons = Array.from(root.querySelectorAll<HTMLElement>('#closeDrawer, .drawer-close'));
  const cleanups: Array<() => void> = [];

  const setDrawerOpen = (
    drawer: HTMLElement | null,
    buttons: HTMLElement[],
    className: string,
    open: boolean
  ) => {
    if (!drawer) return;
    document.body.classList.toggle(className, open);
    drawer.setAttribute('aria-hidden', String(!open));
    buttons.forEach((button) => button.setAttribute('aria-expanded', String(open)));
  };

  const closeAll = () => {
    setDrawerOpen(mainDrawer, mainButtons, 'drawer-open', false);
    setDrawerOpen(railDrawer, railButtons, 'rail-drawer-open', false);
  };

  const addListener = <K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    type: K,
    listener: (event: HTMLElementEventMap[K]) => void
  ) => {
    element.addEventListener(type, listener as EventListener);
    cleanups.push(() => element.removeEventListener(type, listener as EventListener));
  };

  mainButtons.forEach((button) => {
    addListener(button, 'click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDrawerOpen(railDrawer, railButtons, 'rail-drawer-open', false);
      setDrawerOpen(mainDrawer, mainButtons, 'drawer-open', true);
    });
  });

  railButtons.forEach((button) => {
    addListener(button, 'click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      setDrawerOpen(mainDrawer, mainButtons, 'drawer-open', false);
      setDrawerOpen(railDrawer || mainDrawer, railDrawer ? railButtons : mainButtons, railDrawer ? 'rail-drawer-open' : 'drawer-open', true);
    });
  });

  closeButtons.forEach((button) => {
    addListener(button, 'click', (event) => {
      event.preventDefault();
      closeAll();
    });
  });

  const onDrawerClick = (event: Event) => {
    if ((event.target as HTMLElement).closest('a')) closeAll();
  };
  [mainDrawer, railDrawer].forEach((drawer) => {
    if (!drawer) return;
    drawer.addEventListener('click', onDrawerClick);
    cleanups.push(() => drawer.removeEventListener('click', onDrawerClick));
  });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') closeAll();
  };
  document.addEventListener('keydown', onKeyDown);
  cleanups.push(() => document.removeEventListener('keydown', onKeyDown));

  const onDocumentClick = (event: MouseEvent) => {
    if (!document.body.classList.contains('drawer-open') && !document.body.classList.contains('rail-drawer-open')) return;
    const target = event.target as Node;
    const clickedMenuButton = [...mainButtons, ...railButtons].some((button) => button.contains(target));
    const clickedDrawer = [mainDrawer, railDrawer].some((drawer) => drawer?.contains(target));
    if (!clickedDrawer && !clickedMenuButton) closeAll();
  };
  document.addEventListener('click', onDocumentClick);
  cleanups.push(() => document.removeEventListener('click', onDocumentClick));

  closeAll();

  return () => {
    closeAll();
    cleanups.forEach((cleanup) => cleanup());
  };
}

function applyCustomizerAttributes(root: HTMLElement, settings?: ThemeSettings): () => void {
  if (!settings) return () => undefined;

  const targets: Array<{ element: Element; attrs: Record<string, string> }> = [];
  const header = root.querySelector('header, .header');
  const footer = root.querySelector('footer, .footer');

  if (header) {
    targets.push({
      element: header,
      attrs: {
        'data-header-style': settings.headerStyle || settings.header?.style || 'full',
        'data-header-content': settings.headerContentBoxed === false ? 'full' : 'boxed',
        'data-header-look': settings.headerLook || (settings.headerGlass ? 'glass' : 'flat'),
        'data-header-shadow': String(settings.headerShadow ?? true),
        'data-header-shadow-intensity': settings.headerShadowIntensity || 'medium',
        'data-header-shadow-themed': String(!!settings.headerShadowThemed),
        'data-header-solid-themed': String(!!settings.headerSolidThemed),
        'data-header-border': String(!!settings.headerBorder),
        'data-header-border-size': settings.headerBorderSize || 'small',
        'data-header-border-color': settings.headerBorderColor || 'accent',
        'data-header-layout': settings.headerLayout || 'logo-left',
        'data-header-effect': settings.headerEffect || 'static',
        'data-header-font-size': settings.headerFontSize || 'medium',
        'data-header-font-weight': settings.headerFontWeight || 'bold',
        'data-mobile-menu-position': settings.mobileMenuPosition || 'right',
        'data-mobile-logo-align': settings.mobileLogoAlign || 'center',
        'data-mobile-hamburger-shape': settings.mobileHamburgerShape || 'circle',
      },
    });
  }

  if (footer) {
    targets.push({
      element: footer,
      attrs: {
        'data-footer-style': settings.footerStyle || settings.footer?.style || 'classic',
        'data-footer-widgets': settings.footerWidgets === 'hidden' ? 'hidden' : 'shown',
        'data-footer-widget-layout': settings.footerWidgetLayout || 'feature',
        'data-footer-bottom': settings.footerBottom || 'split',
        'data-footer-legal': settings.footerLegal === 'hidden' ? 'hidden' : 'shown',
        'data-footer-columns': String(settings.footerColumns || 4),
      },
    });
  }

  const previous = targets.map(({ element, attrs }) => ({
    element,
    attrs: Object.fromEntries(Object.keys(attrs).map((name) => [name, element.getAttribute(name)])),
  }));

  targets.forEach(({ element, attrs }) => {
    Object.entries(attrs).forEach(([name, value]) => element.setAttribute(name, value));
  });

  return () => {
    previous.forEach(({ element, attrs }) => {
      Object.entries(attrs).forEach(([name, value]) => {
        if (value === null) {
          element.removeAttribute(name);
        } else {
          element.setAttribute(name, value);
        }
      });
    });
  };
}

function appendInlineScript(code: string, label: string): HTMLScriptElement {
  const script = document.createElement('script');
  script.textContent = `;(function(){\nconst lucide = window.lucide || (window.lucide = { createIcons: function(){} });\n${code}\n})();\n//# sourceURL=${label}`;
  script.dataset.staticHtmlScript = 'true';
  document.body.appendChild(script);
  return script;
}

function loadScriptOnce(src: string): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (existing) {
    if (existing.dataset.loaded === 'true') return Promise.resolve();
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.staticHtmlScript = 'true';
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
}

async function runExternalScript(src: string): Promise<HTMLScriptElement | null> {
  const url = new URL(src, window.location.href);
  if (/app\.js(?:$|[?#])/i.test(url.pathname + url.search)) return null;
  if (/lucide/i.test(url.href)) {
    await loadScriptOnce(url.href);
    return null;
  }

  if (url.origin !== window.location.origin) {
    await loadScriptOnce(url.href);
    return null;
  }

  const response = await httpRequest(url.href, { cache: 'force-cache' });
  if (!response.ok) throw new Error(`Failed to fetch ${url.href}`);
  const code = await response.text();
  return appendInlineScript(code, url.href);
}

const StaticHtmlPage: React.FC<Props> = ({
  html,
  themeSettings,
  enableModuleRails = true,
  moduleEntitlements,
  isShellStatic = false,
  preserveDocument = false,
  assetBase,
  ecContextOverride = null,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const dynamicHeadElementsRef = useRef<HTMLElement[]>([]);
  const dynamicPageScriptsRef = useRef<HTMLScriptElement[]>([]);

  let ecContext: EcclesiaContextValue | null = ecContextOverride;
  try {
    ecContext = ecContext || useEcclesia();
  } catch (e) {
    // ignore
  }

  const payload = useMemo(
    () => buildStaticPayload(html, {
      enableModuleRails,
      pathname: location.pathname,
      moduleEntitlements,
      ecContext,
      themeSettings,
      navigationMenus: ecContext?.navigationMenus,
      isShellStatic,
      preserveDocument,
      assetBase,
    }),
    [enableModuleRails, html, location.pathname, moduleEntitlements, ecContext, themeSettings, isShellStatic, preserveDocument, assetBase]
  );

  useEffect(() => {
    if (isShellStatic && ecContext?.setHeaderCTAs) {
      ecContext.setHeaderCTAs(payload.headerActionsHtml || null);
      return () => {
        ecContext.setHeaderCTAs?.(null);
      };
    }
  }, [isShellStatic, payload.headerActionsHtml, ecContext]);

  useEffect(() => {
    if (payload.title) document.title = payload.title;

    document.body.classList.remove('drawer-open');
    payload.bodyClassNames.forEach((className) => document.body.classList.add(className));
    const previousAttributes = new Map<string, string | null>();
    Object.entries(payload.bodyAttributes).forEach(([name, value]) => {
      if (name === 'data-in-customizer') {
        return;
      }
      previousAttributes.set(name, document.body.getAttribute(name));
      document.body.setAttribute(name, value);
    });
    return () => {
      payload.bodyClassNames.forEach((className) => document.body.classList.remove(className));
      previousAttributes.forEach((value, name) => {
        if (value === null) {
          document.body.removeAttribute(name);
        } else {
          document.body.setAttribute(name, value);
        }
      });
    };
  }, [payload]);

  useEffect(() => {
    const linkElements = payload.headLinks.map((linkDef, index) => {
      const link = document.createElement('link');
      link.rel = linkDef.rel;
      link.href = linkDef.href;
      link.dataset.staticHtmlStylesheet = 'true';
      link.dataset.staticHtmlStylesheetIndex = String(index);
      if (linkDef.media) link.media = linkDef.media;
      if (linkDef.crossOrigin) link.crossOrigin = linkDef.crossOrigin;
      document.head.appendChild(link);
      return link;
    });

    const styleElements = payload.headStyles.map((styleDef, index) => {
      const style = document.createElement('style');
      style.textContent = styleDef.css;
      style.dataset.staticHtmlStyle = 'true';
      style.dataset.staticHtmlStyleIndex = String(index);
      if (styleDef.id) style.id = styleDef.id;
      document.head.appendChild(style);
      return style;
    });

    return () => {
      linkElements.forEach((link) => link.remove());
      styleElements.forEach((style) => style.remove());
    };
  }, [payload]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;
    let shellNavigationInFlight = false;
    const injectedScripts: HTMLScriptElement[] = [];
    const cleanupDrawer = bindStaticDrawer(root);
    const cleanupCustomizerAttributes = applyCustomizerAttributes(root, themeSettings);
    const previousNavigateToPage = window.navigateToPage;

    const cleanupDynamicHead = () => {
      dynamicHeadElementsRef.current.forEach((element) => element.remove());
      dynamicHeadElementsRef.current = [];
    };

    const cleanupDynamicScripts = () => {
      dynamicPageScriptsRef.current.forEach((script) => script.remove());
      dynamicPageScriptsRef.current = [];
    };

    const applyDynamicHead = (nextPayload: StaticPayload) => {
      cleanupDynamicHead();

      nextPayload.headLinks.forEach((linkDef, index) => {
        const absoluteHref = new URL(linkDef.href, window.location.href).href;
        const exists = Array.from(document.querySelectorAll<HTMLLinkElement>('link[rel~="stylesheet"][href]'))
          .some((link) => link.href === absoluteHref);
        if (exists) return;

        const link = document.createElement('link');
        link.rel = linkDef.rel;
        link.href = linkDef.href;
        link.dataset.staticHtmlPageStylesheet = 'true';
        link.dataset.staticHtmlPageStylesheetIndex = String(index);
        if (linkDef.media) link.media = linkDef.media;
        if (linkDef.crossOrigin) link.crossOrigin = linkDef.crossOrigin;
        document.head.appendChild(link);
        dynamicHeadElementsRef.current.push(link);
      });

      nextPayload.headStyles.forEach((styleDef, index) => {
        const style = document.createElement('style');
        style.textContent = styleDef.css;
        style.dataset.staticHtmlPageStyle = 'true';
        style.dataset.staticHtmlPageStyleIndex = String(index);
        if (styleDef.id) style.id = styleDef.id;
        document.head.appendChild(style);
        dynamicHeadElementsRef.current.push(style);
      });
    };

    const runDynamicPageScripts = async (scripts: StaticScript[]) => {
      cleanupDynamicScripts();
      for (const script of scripts) {
        if (cancelled || isShellScript(script)) continue;
        if (script.src) {
          const injected = await runExternalScript(script.src);
          if (injected) dynamicPageScriptsRef.current.push(injected);
        } else if (script.code) {
          dynamicPageScriptsRef.current.push(appendInlineScript(script.code, 'static-html-page-script'));
        }
      }
      window.lucide?.createIcons?.();
    };

    const applyShellPage = async (route: string, historyMode: 'push' | 'replace' | 'none' = 'push') => {
      const nextUrl = new URL(route, window.location.origin);
      const currentUrl = new URL(window.location.href);
      if (
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash === currentUrl.hash
      ) {
        return true;
      }

      if (shellNavigationInFlight) return true;
      shellNavigationInFlight = true;
      document.body.classList.add('page-loading');

      try {
        const nextHtml = await loadPublishedPageHtml(route, assetBase);
        if (!nextHtml || cancelled) return false;

        const nextPayload = buildStaticPayload(nextHtml, {
          enableModuleRails: false,
          pathname: nextUrl.pathname,
          moduleEntitlements,
          ecContext,
          themeSettings,
          navigationMenus: ecContext?.navigationMenus,
          isShellStatic: false,
          preserveDocument: true,
          assetBase,
        });

        const parser = new DOMParser();
        const nextDoc = parser.parseFromString(nextPayload.html, 'text/html');
        const currentContent = findStaticContentElement(root);
        const nextContent = findStaticContentElement(nextDoc);
        if (!currentContent || !nextContent) return false;

        currentContent.replaceWith(nextContent.cloneNode(true));

        root.querySelectorAll(`[${STATIC_PAGE_EXTRA_ATTR}="true"]`).forEach((element) => element.remove());
        const footer = root.querySelector('footer, .footer');
        nextDoc.querySelectorAll(`[${STATIC_PAGE_EXTRA_ATTR}="true"]`).forEach((element) => {
          const clone = element.cloneNode(true);
          if (footer?.parentNode) {
            footer.parentNode.insertBefore(clone, footer);
          } else {
            root.appendChild(clone);
          }
        });

        applyDynamicHead(nextPayload);
        await runDynamicPageScripts(nextPayload.scripts);

        document.title = nextPayload.title || document.title;
        document.body.classList.remove('drawer-open', 'rail-drawer-open');
        root.querySelectorAll<HTMLElement>('#mobileDrawer, .mobile-drawer').forEach((drawer) => {
          drawer.setAttribute('aria-hidden', 'true');
        });
        syncActiveLinks(root, route);

        if (historyMode === 'replace') {
          window.history.replaceState(null, '', route);
        } else if (historyMode === 'push') {
          window.history.pushState(null, '', route);
        }

        if (nextUrl.hash) {
          const target = document.getElementById(decodeURIComponent(nextUrl.hash.slice(1)));
          target?.scrollIntoView({ block: 'start' });
        } else {
          window.scrollTo({ top: 0, left: 0 });
        }

        return true;
      } finally {
        shellNavigationInFlight = false;
        document.body.classList.remove('page-loading');
        window.navigateToPage = handleNavigateToPage;
      }
    };

    const handleNavigateToPage = (url: string) => {
      const route = routeFromHref(url);
      if (route) {
        if (preserveDocument) {
          void applyShellPage(route);
        } else {
          navigate(route);
        }
      } else {
        window.location.href = url;
      }
    };

    const onShellClick = (event: MouseEvent) => {
      if (!preserveDocument) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      const route = routeFromHref(href);
      if (!route) return;

      event.preventDefault();
      event.stopPropagation();
      void applyShellPage(route);
    };

    const onPopState = () => {
      if (!preserveDocument) return;
      void applyShellPage(`${window.location.pathname}${window.location.search}${window.location.hash}`, 'none');
    };

    window.navigateToPage = handleNavigateToPage;
    root.addEventListener('click', onShellClick, true);
    window.addEventListener('popstate', onPopState);

    const runScripts = async () => {
      try {
        if (payload.needsLucide && !window.lucide?.createIcons) {
          await loadScriptOnce(LUCIDE_CDN).catch(() => undefined);
        }

        if (!window.lucide?.createIcons) {
          window.lucide = { createIcons: () => undefined };
        }

        for (const script of payload.scripts) {
          if (cancelled) return;
          if (script.src) {
            const injected = await runExternalScript(script.src);
            if (injected) injectedScripts.push(injected);
          } else if (script.code) {
            injectedScripts.push(appendInlineScript(script.code, 'static-html-inline-script'));
          }
        }

        if (!cancelled) window.lucide?.createIcons?.();
        if (!cancelled) window.navigateToPage = handleNavigateToPage;
      } catch (error) {
        console.warn('Static page script initialization failed:', error);
      }
    };

    window.requestAnimationFrame(() => {
      void runScripts();
    });

    return () => {
      cancelled = true;
      cleanupDrawer();
      cleanupCustomizerAttributes();
      cleanupDynamicHead();
      cleanupDynamicScripts();
      root.removeEventListener('click', onShellClick, true);
      window.removeEventListener('popstate', onPopState);
      injectedScripts.forEach((script) => script.remove());
      window.navigateToPage = previousNavigateToPage;
    };
  }, [assetBase, ecContext, moduleEntitlements, navigate, payload, preserveDocument, themeSettings]);

  return (
    <div
      ref={rootRef}
      className="static-html-stage"
      data-static-shell-nav={preserveDocument ? 'true' : undefined}
      dangerouslySetInnerHTML={{ __html: payload.html }}
    />
  );
};

export default StaticHtmlPage;
