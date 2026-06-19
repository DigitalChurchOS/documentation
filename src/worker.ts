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

async function resolveTenantSubdomain(request: Request, env: Env, subdomain: string) {
  if (!env.API || !subdomain) return false;
  const resolveUrl = new URL('/api/public/resolve-subdomain', request.url);
  resolveUrl.searchParams.set('subdomain', subdomain);
  const response = await env.API.fetch(new Request(resolveUrl.toString(), {
    headers: {
      accept: 'application/json',
    },
  }));
  return response.ok;
}

function tenantNotFoundResponse() {
  return new Response('Church website not found.', {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
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
      if (hostContext.isTenantPlatformSubdomain) {
        const resolved = await resolveTenantSubdomain(request, env, hostContext.tenantSubdomain);
        if (!resolved) return tenantNotFoundResponse();
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
    if (hostContext.isTenantPlatformSubdomain) {
      const resolved = await resolveTenantSubdomain(request, env, hostContext.tenantSubdomain);
      if (!resolved) return tenantNotFoundResponse();
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

    if (isTenantPublicHost && (pathname === '/sw.js' || pathname === '/manifest.json' || pathname.startsWith('/assets/'))) {
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
