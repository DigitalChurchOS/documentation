const SOURCE_FILE_SLUGS: Record<string, string> = {
  'index.html': '',
  'home.html': '',
  'about.html': 'about',
  'sermons.html': 'sermons',
  'events.html': 'events',
  'ministries.html': 'ministries',
  'prayer.html': 'prayer',
  'contact.html': 'contact',
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
