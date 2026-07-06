type Env = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  API?: {
    fetch(request: Request): Promise<Response>;
  };
};

const PLATFORM_HOSTS = new Set([
  'churched.online',
  'www.churched.online',
  'churchos.com',
  'www.churchos.com',
  'churchos.local',
  'localhost',
]);
const TENANT_BASE_DOMAINS = ['churched.online'];
const WORKER_HOST_SUFFIXES = ['workers.dev'];

function getHostContext(hostname: string) {
  const host = hostname.toLowerCase();
  let tenantSubdomain = '';
  for (const base of TENANT_BASE_DOMAINS) {
    if (host !== base && host !== `www.${base}` && host.endsWith(`.${base}`)) {
      tenantSubdomain = host.slice(0, -(base.length + 1));
      break;
    }
  }
  const isWorkerHost = WORKER_HOST_SUFFIXES.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  const isLocalHost = host === 'localhost' || host.endsWith('.localhost');
  const isPlatformHost = PLATFORM_HOSTS.has(host) || isWorkerHost || isLocalHost;
  return {
    tenantSubdomain,
    isTenantPlatformSubdomain: Boolean(tenantSubdomain),
    isTenantCustomDomain: !isPlatformHost && !tenantSubdomain,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function resolveTenantHost(request: Request, env: Env, hostContext: ReturnType<typeof getHostContext>) {
  if (!env.API) return false;

  const resolveUrl = new URL(
    hostContext.isTenantPlatformSubdomain ? '/api/public/resolve-subdomain' : '/api/public/resolve-domain',
    request.url,
  );
  if (hostContext.isTenantPlatformSubdomain) {
    resolveUrl.searchParams.set('subdomain', hostContext.tenantSubdomain);
  } else if (hostContext.isTenantCustomDomain) {
    resolveUrl.searchParams.set('host', new URL(request.url).hostname);
  } else {
    return false;
  }

  const response = await env.API.fetch(new Request(resolveUrl.toString(), {
    headers: {
      accept: 'application/json',
    },
  }));
  return response.ok;
}

function tenantNotFoundResponse(request: Request, hostContext: ReturnType<typeof getHostContext>) {
  const url = new URL(request.url);
  const wantsJson = url.pathname.startsWith('/api/') || request.headers.get('accept')?.includes('application/json');
  if (wantsJson) {
    return Response.json(
      { error: 'Church website not found' },
      {
        status: 404,
        headers: { 'cache-control': 'no-store' },
      },
    );
  }

  const attemptedHost = escapeHtml(url.hostname);
  const attemptedSubdomain = escapeHtml(hostContext.tenantSubdomain || url.hostname.split('.')[0] || 'this church');
  const createUrl = new URL('/onboarding', 'https://churched.online');
  if (hostContext.tenantSubdomain) {
    createUrl.searchParams.set('subdomain', hostContext.tenantSubdomain);
  }
  createUrl.searchParams.set('source', 'tenant-not-found');
  const loginUrl = new URL('/admin', 'https://churched.online');

  return new Response(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Church Not Found | Digital Church OS</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #171717;
      --muted: #706960;
      --line: rgba(23, 23, 23, 0.12);
      --soft: #fff7ed;
      --accent: #ff7a1a;
      --accent-strong: #ea580c;
      --surface: #fffdf9;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: var(--ink);
      background:
        linear-gradient(rgba(23, 23, 23, 0.035) 1px, transparent 1px),
        linear-gradient(90deg, rgba(23, 23, 23, 0.035) 1px, transparent 1px),
        radial-gradient(circle at 82% 20%, rgba(255, 122, 26, 0.14), transparent 34%),
        linear-gradient(135deg, #fff8ef 0%, #fffdf9 52%, #f8f4ff 100%);
      background-size: 92px 92px, 92px 92px, auto, auto;
    }
    main {
      width: min(1120px, calc(100% - 40px));
      min-height: 100vh;
      margin: 0 auto;
      display: grid;
      grid-template-rows: auto 1fr auto;
      gap: 36px;
      padding: 32px 0;
    }
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      width: fit-content;
      color: var(--ink);
      text-decoration: none;
      font-weight: 850;
      letter-spacing: 0;
    }
    .mark {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border: 1px solid rgba(255, 122, 26, 0.28);
      border-radius: 8px;
      background: linear-gradient(135deg, #ff7a1a, #ffb25f);
      color: #fff;
      font-size: 17px;
      font-weight: 900;
      box-shadow: 0 18px 44px rgba(234, 88, 12, 0.22);
    }
    .content {
      align-self: center;
      max-width: 720px;
      padding: 72px 0 84px;
    }
    .status {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 9px 14px;
      border: 1px solid rgba(255, 122, 26, 0.22);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.66);
      color: var(--accent-strong);
      font-size: 14px;
      font-weight: 800;
    }
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: var(--accent);
      box-shadow: 0 0 0 5px rgba(255, 122, 26, 0.14);
    }
    h1 {
      margin: 24px 0 18px;
      max-width: 760px;
      font-size: clamp(42px, 8vw, 82px);
      line-height: 0.95;
      letter-spacing: 0;
    }
    p {
      margin: 0;
      max-width: 610px;
      color: var(--muted);
      font-size: clamp(17px, 2vw, 21px);
      line-height: 1.65;
    }
    .host {
      margin-top: 28px;
      width: fit-content;
      max-width: 100%;
      padding: 13px 16px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.72);
      color: #4c463f;
      font: 700 15px ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace;
      overflow-wrap: anywhere;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 34px;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 50px;
      padding: 0 22px;
      border-radius: 8px;
      border: 1px solid transparent;
      text-decoration: none;
      font-size: 15px;
      font-weight: 850;
      letter-spacing: 0;
    }
    .primary {
      background: linear-gradient(135deg, #ff7a1a, #ffb25f);
      color: #fff;
      box-shadow: 0 18px 44px rgba(234, 88, 12, 0.22);
    }
    .secondary {
      background: rgba(255, 255, 255, 0.74);
      border-color: var(--line);
      color: var(--ink);
    }
    .note {
      color: #8a8177;
      font-size: 13px;
    }
    @media (max-width: 640px) {
      main {
        width: min(100% - 28px, 1120px);
        padding: 22px 0;
      }
      .content {
        padding: 42px 0 56px;
      }
      .actions {
        flex-direction: column;
      }
      .btn {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <main>
    <a class="brand" href="https://churched.online/" aria-label="Digital Church OS home">
      <span class="mark">OS</span>
      <span>Digital Church OS</span>
    </a>
    <section class="content" aria-labelledby="page-title">
      <div class="status"><span class="dot" aria-hidden="true"></span> Church not found</div>
      <h1 id="page-title">No church is connected to ${attemptedSubdomain} yet.</h1>
      <p>This address is not assigned to a church workspace. If this is your church, create an account to reserve the subdomain. If you already have an account, log in from the main platform.</p>
      <div class="host">${attemptedHost}</div>
      <div class="actions">
        <a class="btn primary" href="${escapeHtml(createUrl.toString())}">Create church account</a>
        <a class="btn secondary" href="${escapeHtml(loginUrl.toString())}">Log in</a>
      </div>
    </section>
    <div class="note">Each church gets one assigned subdomain or a verified custom domain.</div>
  </main>
</body>
</html>`, {
    status: 404,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const hostContext = getHostContext(url.hostname);
    const isTenantPublicHost = hostContext.isTenantPlatformSubdomain || hostContext.isTenantCustomDomain;

    // 1. Health check route
    if (pathname === '/health') {
      return Response.json({
        status: 'ok',
        runtime: 'cloudflare-worker',
        timestamp: new Date().toISOString(),
      });
    }

    if (pathname === '/page-builder' || pathname.startsWith('/page-builder/')) {
      const redirectUrl = new URL('/admin', request.url);
      redirectUrl.searchParams.set('module', 'customizer');
      redirectUrl.searchParams.set('tab', 'pages');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    if (pathname === '/builder' || pathname.startsWith('/builder/')) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = pathname.replace(/^\/builder/, '/customizer');
      return Response.redirect(redirectUrl.toString(), 302);
    }

    // 2. API requests proxy to service binding
    if (pathname.startsWith('/api/')) {
      if (isTenantPublicHost) {
        const resolved = await resolveTenantHost(request, env, hostContext);
        if (!resolved) return tenantNotFoundResponse(request, hostContext);
      }
      if (env.API) {
        return env.API.fetch(request);
      }
      return Response.json(
        { error: 'API service binding not configured in wrangler.toml' },
        { status: 502 }
      );
    }

    // 3. Public church website routing
    // Tenant sites are available only on [churchname].churched.online or a connected custom domain.
    if (isTenantPublicHost) {
      const resolved = await resolveTenantHost(request, env, hostContext);
      if (!resolved) return tenantNotFoundResponse(request, hostContext);
    }

    if (
      !isTenantPublicHost &&
      (pathname === '/church' ||
        pathname.startsWith('/church/') ||
        pathname === '/churchos.html' ||
        pathname === '/live.html' ||
        pathname.startsWith('/live/'))
    ) {
      return new Response('Tenant websites are available on tenant subdomains or connected custom domains only.', {
        status: 404,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    if (isTenantPublicHost && pathname === '/manifest.json') {
      if (env.API) {
        try {
          const globalContentUrl = new URL('/api/cms/global-content', request.url);
          const apiResponse = await env.API.fetch(new Request(globalContentUrl.toString(), {
            headers: {
              'accept': 'application/json',
              'x-tenant-id': request.headers.get('x-tenant-id') || '',
              'x-tenant-subdomain': hostContext.tenantSubdomain || '',
            }
          }));
          if (apiResponse.ok) {
            const json = await apiResponse.json() as any;
            const identity = json?.data?.churchIdentity;
            const churchName = identity?.churchName || 'Digital Church OS Portal';
            const logoUrl = identity?.logoUrl || '/light.png';
            
            const manifest = {
              "name": churchName,
              "short_name": churchName.length > 12 ? (churchName.split(' ')[0] || 'Church') : churchName,
              "description": identity?.description || "CMS-driven modern church website with native application feel and offline support.",
              "start_url": "/",
              "display": "standalone",
              "background_color": "#f8fafc",
              "theme_color": "#f97316",
              "icons": [
                {
                  "src": logoUrl || "/light.png",
                  "sizes": "512x512",
                  "type": "image/png"
                },
                {
                  "src": logoUrl || "/dark.png",
                  "sizes": "512x512",
                  "type": "image/png"
                }
              ]
            };
            return new Response(JSON.stringify(manifest), {
              headers: {
                'content-type': 'application/json; charset=utf-8',
                'cache-control': 'public, max-age=3600',
              }
            });
          }
        } catch (err) {
          console.error('Error generating dynamic manifest.json:', err);
        }
      }
      // Fallback
      const assetUrl = new URL(request.url);
      assetUrl.pathname = `/church/manifest.json`;
      return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    }

    if (isTenantPublicHost && (pathname === '/sw.js' || pathname.startsWith('/assets/'))) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = `/church${pathname}`;
      return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    }

    if (isTenantPublicHost && pathname.startsWith('/themes/')) {
      return env.ASSETS.fetch(request);
    }

    // 4. Static assets: serve directly if it looks like a physical file (has extension)
    // We check for '.' to identify file extensions like .js, .css, .png, .ico, etc.
    // We exclude .html files from being served as static assets on tenant requests so that
    // the SPA router can handle them (e.g. /about.html, /sermons.html).
    const isTenantRequest = isTenantPublicHost || pathname.startsWith('/church/') || pathname === '/church';
    const isStaticFile = pathname.includes('.') && !pathname.endsWith('/') && !(isTenantRequest && pathname.endsWith('.html'));
    if (isStaticFile) {
      return env.ASSETS.fetch(request);
    }

    // 5. SPA path-based routing (rewrites client-side routes to their respective index.html entries)
    let targetPath = isTenantPublicHost ? '/church/index.html' : '/index.html';

    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      targetPath = '/admin/index.html';
    } else if (pathname === '/central' || pathname.startsWith('/central/')) {
      targetPath = '/central/index.html';
    } else if (pathname === '/marketplace' || pathname.startsWith('/marketplace/')) {
      targetPath = '/marketplace/index.html';
    } else if (pathname === '/developer' || pathname.startsWith('/developer/')) {
      targetPath = '/developer/index.html';
    } else if (pathname === '/onboarding') {
      targetPath = '/onboarding.html';
    } else if (pathname === '/live.html' || pathname.startsWith('/live/')) {
      targetPath = '/live.html';
    } else if (pathname === '/church' || pathname.startsWith('/church/')) {
      targetPath = '/church/index.html';
    } else if (pathname === '/customizer' || pathname.startsWith('/customizer/')) {
      targetPath = '/customizer/index.html';
    }

    // Rewrite request URL and fetch from assets
    const rewrittenUrl = new URL(request.url);
    rewrittenUrl.pathname = targetPath;
    const rewrittenRequest = new Request(rewrittenUrl.toString(), request);
    return env.ASSETS.fetch(rewrittenRequest);
  },
};
