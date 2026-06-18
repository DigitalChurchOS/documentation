const CACHE_NAME = 'churchos-cache-v6';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/themes/ecclesia/assets/styles.css',
  '/themes/ecclesia/assets/media.css',
  '/themes/ecclesia/assets/livestream.css',
  '/themes/ecclesia/assets/podcast.css',
  '/themes/ecclesia/assets/blog.css',
  '/themes/ecclesia/assets/events.css',
  '/themes/ecclesia/assets/giving.css',
  '/themes/ecclesia/assets/library.css',
  '/themes/ecclesia/assets/lms.css',
  '/themes/ecclesia/assets/prayer.css',
  '/themes/ecclesia/assets/services.css',
  '/themes/ecclesia/assets/worship.css',
];

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>ChurchOS Offline</title>
  <style>
    body { margin:0; min-height:100vh; display:grid; place-items:center; font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; background:#fffaf3; color:#1d1812; }
    main { max-width:480px; padding:32px; text-align:center; }
    h1 { margin:0 0 12px; font-size:28px; }
    p { margin:0; color:#74685e; line-height:1.6; }
  </style>
</head>
<body><main><h1>Offline</h1><p>This page has not been cached yet. Reconnect once, open it, and ChurchOS will keep a local copy for later.</p></main></body>
</html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.allSettled(APP_SHELL_URLS.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => (key === CACHE_NAME ? undefined : caches.delete(key)))))
      .then(() => self.clients.claim())
  );
});

function isCacheableResponse(response) {
  return response && (response.status === 200 || response.type === 'opaque');
}

async function putInCache(request, response) {
  if (!isCacheableResponse(response)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

async function networkFirst(request, fallbackUrl) {
  try {
    const response = await fetch(request);
    await putInCache(request, response);
    if (fallbackUrl) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(fallbackUrl, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return undefined;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    await putInCache(request, response);
    return response;
  } catch {
    return new Response('', { status: 504, statusText: 'Offline cache miss' });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const fresh = fetch(request)
    .then((response) => {
      if (isCacheableResponse(response)) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (cached) return cached;
  const freshResponse = await fresh;
  return freshResponse || caches.match('/index.html') || new Response('', { status: 504, statusText: 'Offline cache miss' });
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      networkFirst(event.request, '/index.html').then((response) => {
        return response || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      })
    );
    return;
  }

  if (isSameOrigin && requestUrl.pathname.startsWith('/api/cms/')) {
    event.respondWith(
      networkFirst(event.request).then((response) => {
        return response || new Response(JSON.stringify({ error: 'offline-cache-miss' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        });
      })
    );
    return;
  }

  const destination = event.request.destination;
  const isRuntimeAsset =
    ['image', 'font', 'audio', 'video', 'style', 'script'].includes(destination) ||
    (isSameOrigin && (
      requestUrl.pathname.startsWith('/assets/') ||
      requestUrl.pathname.startsWith('/themes/') ||
      requestUrl.pathname.startsWith('/media/') ||
      requestUrl.pathname.startsWith('/uploads/')
    ));

  if (isRuntimeAsset) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request));
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'PREFETCH_URLS' || !Array.isArray(event.data.urls)) return;

  event.waitUntil(prefetchUrls(event.data.urls));
});

async function prefetchUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean))).slice(0, 80);

  await Promise.allSettled(uniqueUrls.map(async (rawUrl) => {
    const url = new URL(rawUrl, self.location.origin);
    if (!/^https?:$/i.test(url.protocol)) return;

    const isSameOrigin = url.origin === self.location.origin;
    const request = isSameOrigin
      ? new Request(url.href, { credentials: 'same-origin' })
      : new Request(url.href, { mode: 'no-cors' });

    const cached = await cache.match(request);
    if (cached) return;

    const response = await fetch(request);
    if (isCacheableResponse(response)) await cache.put(request, response.clone());
  }));
}
