const SOURCE_FILE_SLUGS: Record<string, string> = {
  'index.html': '',
  'home.html': '',
  'about.html': 'about',
  'sermons.html': 'sermons',
  'events.html': 'events',
  'ministries.html': 'ministries',
  'prayer.html': 'prayer',
  'contact.html': 'contact',
  'login.html': 'login',
  'account.html': 'account',
  'giving.html': 'giving',
  'giving-partnership.html': 'partnership',
  'livestream-page.html': 'livestream',
  'media-archive.html': 'media',
  'media-single.html': 'media/sample-message',
  'podcast-archive.html': 'podcast',
  'podcast-episode.html': 'podcast/sample-episode',
  'blog-archive.html': 'blog',
  'blog-single.html': 'blog/sample-post',
  'services-archive.html': 'services',
  'service-single.html': 'services/sample-service',
  'library-archive.html': 'library',
  'resource-single.html': 'library/sample-resource',
  'courses-archive.html': 'courses',
  'course-main.html': 'courses/main',
  'lesson-single.html': 'courses/lesson',
  'events-archive.html': 'events/archive',
  'event-single.html': 'events/sample-event',
  'event-register.html': 'events/register',
  'prayer-home.html': 'prayer-home',
  'prayer-wall.html': 'prayer/wall',
  'prayer-room.html': 'prayer/room',
  'testimony-wall.html': 'testimonies',
  'testimony-single.html': 'testimonies/sample-story',
  'testimony-submit.html': 'testimonies/submit',
  'worship.html': 'worship',
  'groups-archive.html': 'cells',
  'group-single.html': 'cells/sample-group',
  'store-archive.html': 'store',
  'store-single.html': 'store/sample-product',
  'cart.html': 'store/cart',
  'checkout.html': 'store/checkout',
  'checkout-success.html': 'store/thank-you',
  'checkout-failed.html': 'store/checkout-failed',
};

const SLUG_TEMPLATE_FILES: Record<string, string> = {
  '': 'index.html',
  'about': 'about.html',
  'sermons': 'sermons.html',
  'events': 'events.html',
  'ministries': 'ministries.html',
  'prayer': 'prayer.html',
  'contact': 'contact.html',
  'login': 'login.html',
  'account': 'account.html',
  'giving': 'giving.html',
  'partnership': 'giving-partnership.html',
  'livestream': 'livestream-page.html',
  'media': 'media-archive.html',
  'media/sample-message': 'media-single.html',
  'podcast': 'podcast-archive.html',
  'podcast/sample-episode': 'podcast-episode.html',
  'blog': 'blog-archive.html',
  'blog/sample-post': 'blog-single.html',
  'services': 'services-archive.html',
  'services/sample-service': 'service-single.html',
  'library': 'library-archive.html',
  'library/sample-resource': 'resource-single.html',
  'courses': 'courses-archive.html',
  'courses/main': 'course-main.html',
  'courses/lesson': 'lesson-single.html',
  'events/archive': 'events-archive.html',
  'events/sample-event': 'event-single.html',
  'events/register': 'event-register.html',
  'prayer-home': 'prayer-home.html',
  'prayer/wall': 'prayer-wall.html',
  'prayer/room': 'prayer-room.html',
  'testimonies': 'testimony-wall.html',
  'testimonies/sample-story': 'testimony-single.html',
  'testimonies/submit': 'testimony-submit.html',
  'worship': 'worship.html',
  'cells': 'groups-archive.html',
  'cells/sample-group': 'group-single.html',
  'store': 'store-archive.html',
  'store/sample-product': 'store-single.html',
  'store/cart': 'cart.html',
  'store/checkout': 'checkout.html',
  'store/thank-you': 'checkout-success.html',
  'store/checkout-failed': 'checkout-failed.html'
};

const INTERNAL_PATH_PREFIXES = [
  '/api/',
  '/admin',
  '/central',
  '/customizer',
  '/assets/',
  '/src/',
  '/manifest.json',
  '/sw.js',
];

export function slugFromPathname(pathname: string): string {
  let cleanPath = pathname
    .replace(/^\/themes\/ecclesia\//i, '/')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  // Strip local development "/church" prefix if present
  if (cleanPath.startsWith('church/')) {
    cleanPath = cleanPath.substring(7);
  } else if (cleanPath === 'church') {
    cleanPath = '';
  }

  if (!cleanPath || cleanPath === 'start' || cleanPath === 'home') return '';

  const fileName = cleanPath.split('/').pop() || cleanPath;
  if (SOURCE_FILE_SLUGS[fileName] !== undefined) {
    return SOURCE_FILE_SLUGS[fileName];
  }

  const withoutHtml = cleanPath.replace(/\.html$/i, '');
  const mappedFromStem = SOURCE_FILE_SLUGS[`${withoutHtml}.html`];
  return mappedFromStem !== undefined ? mappedFromStem : withoutHtml;
}

export function routeFromHref(href: string): string | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('javascript:')) return null;
  if (/^(mailto|tel|sms):/i.test(trimmed)) return null;

  let url: URL;
  try {
    url = new URL(trimmed, window.location.href);
  } catch {
    return null;
  }

  if (url.origin !== window.location.origin) return null;

  const path = url.pathname;
  if (INTERNAL_PATH_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix))) {
    return null;
  }

  const fileName = path.split('/').pop() || '';
  const extension = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() : '';
  if (extension && extension !== 'html') return null;

  const slug = slugFromPathname(path);
  const routePath = slug ? `/${slug}` : '/';
  return `${routePath}${url.search}${url.hash}`;
}

export function getTemplateFileForSlug(slug: string): string | null {
  if (SLUG_TEMPLATE_FILES[slug]) {
    return SLUG_TEMPLATE_FILES[slug];
  }

  const parts = slug.split('/');
  if (parts.length > 1) {
    const prefix = parts[0];
    const subPath = parts.slice(1).join('/');

    if (prefix === 'blog') {
      return 'blog-single.html';
    }
    if (prefix === 'sermons' || prefix === 'media') {
      return 'media-single.html';
    }
    if (prefix === 'events') {
      if (subPath === 'archive') return 'events-archive.html';
      if (subPath === 'register') return 'event-register.html';
      return 'event-single.html';
    }
    if (prefix === 'podcast') {
      return 'podcast-episode.html';
    }
    if (prefix === 'services') {
      return 'service-single.html';
    }
    if (prefix === 'library') {
      return 'resource-single.html';
    }
    if (prefix === 'courses') {
      if (subPath === 'main') return 'course-main.html';
      if (subPath === 'lesson') return 'lesson-single.html';
      return 'course-main.html';
    }
    if (prefix === 'testimonies') {
      if (subPath === 'submit') return 'testimony-submit.html';
      return 'testimony-single.html';
    }
    if (prefix === 'cells') {
      return 'group-single.html';
    }
    if (prefix === 'store') {
      return 'store-single.html';
    }
  }

  return null;
}

export function withLocalChurchBase(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') return normalizedPath;
  return window.location.pathname.startsWith('/church') ? `/church${normalizedPath}` : normalizedPath;
}
