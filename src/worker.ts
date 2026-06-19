type Env = {
  ASSETS: {
    fetch(request: Request): Promise<Response>;
  };
  API?: {
    fetch(request: Request): Promise<Response>;
  };
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

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
      if (env.API) {
        return env.API.fetch(request);
      }
      return Response.json(
        { error: 'API service binding not configured in wrangler.toml' },
        { status: 502 }
      );
    }

    // 3. Subdomain-aware church website routing
    // Production: [churchname].churched.online → serve church-frontend SPA
    const WORKER_BASE_DOMAINS = ['churched.online', 'churchos.local', 'churchos.com', 'localhost'];
    const WORKER_HOST_SUFFIXES = ['workers.dev'];
    const hostname = url.hostname.toLowerCase();
    let isSubdomain = false;
    for (const base of WORKER_BASE_DOMAINS) {
      if (hostname !== base && hostname.endsWith(`.${base}`)) {
        isSubdomain = true;
        break;
      }
    }
    const isWorkerHost = WORKER_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
    if (!isSubdomain && !isWorkerHost && hostname.split('.').length > 2) {
      isSubdomain = true;
    }

    if (isSubdomain && (pathname === '/sw.js' || pathname === '/manifest.json' || pathname.startsWith('/assets/'))) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = `/church${pathname}`;
      return env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    }

    // 4. Static assets: serve directly if it looks like a physical file (has extension)
    // We check for '.' to identify file extensions like .js, .css, .png, .ico, etc.
    const isStaticFile = pathname.includes('.') && !pathname.endsWith('/');
    if (isStaticFile) {
      return env.ASSETS.fetch(request);
    }

    // 5. SPA path-based routing (rewrites client-side routes to their respective index.html entries)
    let targetPath = isSubdomain ? '/church/index.html' : '/index.html'; // Subdomain → church frontend

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
