/// <reference lib="webworker" />

type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

type ApiResponse = {
  data?: JsonValue;
  error?: string;
  ok?: boolean;
  status?: string;
  token?: string;
  tenantId?: string;
  tenant?: JsonValue;
  user?: JsonValue;
  website?: JsonValue;
  available?: boolean;
  plan?: JsonValue;
  meta?: JsonValue;
};

const jsonHeaders = {
  'content-type': 'application/json; charset=utf-8',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'access-control-allow-headers': 'content-type,authorization,x-tenant-id',
};

const onboardingSteps = [
  'profile',
  'logo',
  'theme',
  'design',
  'modules',
  'website',
  'domain',
  'giving',
  'invite',
  'complete',
].map((stepKey, index) => ({
  id: `step-${index + 1}`,
  stepKey,
  status: index < 2 ? 'completed' : 'pending',
  metadataJson: '{}',
}));

const demoTenant = {
  id: 'demo-church-local',
  name: 'Demo Church',
  subdomain: 'demo',
  subdomainHost: 'demo.churched.online',
  plan: 'growth',
  country: 'United States',
  city: 'Online',
};

const demoUser = {
  id: 'user-demo-admin',
  name: 'Admin User',
  email: 'admin@demo.church',
  role: 'Owner',
  status: 'active',
};

const demoRoles = [
  {
    id: 'role-owner',
    name: 'Owner',
    description: 'Full workspace access',
    permissions: ['*'],
  },
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Operational administration',
    permissions: ['cms.*', 'members.*', 'settings.*'],
  },
];

const demoPages = [
  {
    id: 'page-home',
    websiteId: 'website-main',
    title: 'Home',
    slug: '',
    content: '<h1>Welcome to Demo Church</h1>',
    isHome: true,
    isPublished: true,
    updatedAt: new Date().toISOString(),
  },
];

const demoMarketplaceAssets = [
  {
    id: 'asset-next-theme',
    name: 'Next Church Theme',
    title: 'Next Church Theme',
    type: 'theme',
    category: 'Website',
    price: 0,
    status: 'published',
    developer: 'ChurchOS',
    rating: 5,
  },
  {
    id: 'asset-giving-plugin',
    name: 'Giving Starter',
    title: 'Giving Starter',
    type: 'plugin',
    category: 'Giving',
    price: 0,
    status: 'published',
    developer: 'ChurchOS',
    rating: 5,
  },
];

function withJson(body: ApiResponse, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      ...jsonHeaders,
      ...(init.headers || {}),
    },
  });
}

async function readBody(request: Request) {
  if (request.method === 'GET' || request.method === 'HEAD') return {};
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function cleanSubdomain(value: unknown) {
  const cleaned = String(value || demoTenant.subdomain)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return cleaned || demoTenant.subdomain;
}

function makeSubdomainHost(subdomain: string) {
  return `${subdomain}.churched.online`;
}

function makeTenantFromBody(body: Record<string, unknown>) {
  const subdomain = cleanSubdomain(body.subdomain);
  const plan = String(body.plan || demoTenant.plan);
  return {
    ...demoTenant,
    id: `tenant-${subdomain}`,
    name: String(body.name || demoTenant.name),
    subdomain,
    subdomainHost: makeSubdomainHost(subdomain),
    plan,
    country: String(body.country || demoTenant.country),
    city: String(body.city || demoTenant.city),
    status: 'active',
    onboardingStatus: 'in_progress',
  };
}

function makeSessionToken(tenantId: string, userId: string) {
  const encoded = btoa(`${tenantId}:${userId}:${Date.now()}`);
  return `churchos-demo-${encoded.replace(/=+$/g, '')}`;
}

function collectionResponse(pathname: string): JsonValue {
  if (pathname.includes('/users')) return [demoUser];
  if (pathname.includes('/roles')) return demoRoles;
  if (pathname.includes('/invitations')) return [];
  if (pathname.includes('/pages')) return demoPages;
  if (pathname.includes('/themes')) {
    return [
      {
        id: 'theme-next',
        name: 'Next Church',
        status: 'active',
        previewUrl: '/churchos.html',
        customizationJson: '{}',
      },
    ];
  }
  if (pathname.includes('/assets')) return demoMarketplaceAssets;
  if (pathname.includes('/plans')) {
    return [
      { id: 'starter', name: 'Starter', priceMonthly: 29 },
      { id: 'growth', name: 'Growth', priceMonthly: 79 },
      { id: 'pro', name: 'Pro', priceMonthly: 149 },
    ];
  }
  if (
    pathname.includes('/categories') ||
    pathname.includes('/tags') ||
    pathname.includes('/playlists') ||
    pathname.includes('/speakers') ||
    pathname.includes('/products') ||
    pathname.includes('/orders') ||
    pathname.includes('/events') ||
    pathname.includes('/members') ||
    pathname.includes('/contacts') ||
    pathname.includes('/tasks') ||
    pathname.includes('/streams') ||
    pathname.includes('/courses') ||
    pathname.includes('/modules') ||
    pathname.includes('/lessons') ||
    pathname.includes('/jobs') ||
    pathname.includes('/logs') ||
    pathname.includes('/reports')
  ) {
    return [];
  }
  return {
    id: makeId('demo'),
    status: 'ready',
    message: 'Demo API response',
  };
}

function routeGet(pathname: string, url: URL) {
  if (pathname === '/health' || pathname === '/api/health') {
    return withJson({
      status: 'ok',
      data: {
        runtime: 'cloudflare-api-worker',
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (pathname === '/api/onboarding') {
    return withJson({
      data: {
        tenant: demoTenant,
        steps: onboardingSteps,
        progressPercent: 20,
      },
    });
  }

  if (pathname === '/api/billing-subscription-management/current') {
    return withJson({
      plan: { slug: 'growth', name: 'Growth' },
      data: { plan: { slug: 'growth', name: 'Growth' } },
    });
  }

  if (pathname === '/api/settings/schema') {
    return withJson({
      data: [
        { key: 'liveChat.enabled', label: 'Live chat', type: 'boolean', moduleKey: 'liveChat' },
        { key: 'cms.autoSave', label: 'CMS autosave', type: 'boolean', moduleKey: 'cms' },
      ],
    });
  }

  if (pathname === '/api/settings') {
    return withJson({
      data: {
        liveChat: { enabled: true },
        cms: { autoSave: true, searchIndexing: true },
      },
    });
  }

  if (pathname === '/api/tenant/branding') {
    return withJson({
      data: {
        churchName: demoTenant.name,
        logoUrl: '/logo.png',
        primaryColor: '#2563eb',
      },
    });
  }

  if (pathname === '/api/tenant/domain') {
    return withJson({
      data: {
        subdomain: demoTenant.subdomain,
        customDomain: 'churched.online',
        status: 'verified',
      },
    });
  }

  if (pathname === '/api/tenant/checklist') {
    return withJson({
      data: onboardingSteps.map((step) => ({
        key: step.stepKey,
        label: step.stepKey,
        status: step.status,
      })),
    });
  }

  if (pathname === '/api/theme-engine/overview') {
    return withJson({
      data: {
        activeTheme: 'Next Church',
        installedThemes: 1,
        draftChanges: 0,
      },
    });
  }

  if (pathname === '/api/theme-engine/reports') {
    return withJson({
      data: {
        performanceScore: 96,
        accessibilityScore: 94,
      },
    });
  }

  if (pathname === '/api/cms/render') {
    return withJson({
      data: {
        page: demoPages[0],
        navigation: [],
        footer: { columns: [] },
      },
    });
  }

  if (pathname === '/api/cms/navigation') {
    return withJson({ data: { items: [{ label: 'Home', href: '/' }] } });
  }

  if (pathname === '/api/cms/footer') {
    return withJson({ data: { columns: [], copyright: 'Demo Church' } });
  }

  if (pathname === '/api/public/resolve-subdomain') {
    const subdomain = cleanSubdomain(url.searchParams.get('subdomain'));
    const tenant = { ...demoTenant, id: `tenant-${subdomain}`, subdomain, subdomainHost: makeSubdomainHost(subdomain) };
    return withJson({
      tenantId: tenant.id,
      tenant,
      data: tenant,
    });
  }

  return withJson({
    data: collectionResponse(pathname),
    meta: { source: 'churchos-api-worker', demo: true },
  });
}

async function routeMutation(request: Request, pathname: string) {
  const body = await readBody(request);

  if (pathname === '/api/public/check-subdomain') {
    return withJson({ available: true, data: { available: true } });
  }

  if (pathname === '/api/public/resolve-subdomain') {
    const subdomain = cleanSubdomain(body.subdomain);
    const tenant = { ...demoTenant, id: `tenant-${subdomain}`, subdomain, subdomainHost: makeSubdomainHost(subdomain) };
    return withJson({
      tenantId: tenant.id,
      tenant,
      data: tenant,
    });
  }

  if (pathname === '/api/auth/register-tenant') {
    const tenant = makeTenantFromBody(body);
    const ownerName = String(body.ownerName || demoUser.name);
    const ownerEmail = String(body.ownerEmail || demoUser.email);
    const user = {
      ...demoUser,
      id: `user-${tenant.subdomain}`,
      name: ownerName,
      email: ownerEmail,
      member: {
        id: `member-${tenant.subdomain}`,
        firstName: ownerName.split(/\s+/)[0] || 'Church',
        lastName: ownerName.split(/\s+/).slice(1).join(' ') || 'Owner',
      },
    };
    const website = {
      id: `website-${tenant.subdomain}`,
      tenantId: tenant.id,
      domain: tenant.subdomainHost,
      status: 'published',
      isPrimary: true,
    };
    const plan = {
      slug: tenant.plan,
      name: tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1),
    };
    const token = makeSessionToken(tenant.id, user.id);
    const session = {
      token,
      tenantId: tenant.id,
      tenant,
      user,
      website,
      plan,
    };
    return withJson({ ...session, data: session }, { status: 201 });
  }

  if (pathname === '/api/auth/login' || pathname === '/api/super-admin/login') {
    return withJson({
      token: 'churchos-demo-token',
      data: {
        token: 'churchos-demo-token',
        user: demoUser,
        tenant: demoTenant,
      },
    });
  }

  if (pathname.startsWith('/api/onboarding')) {
    return withJson({
      ok: true,
      data: {
        id: makeId('onboarding'),
        ...body,
        status: pathname.endsWith('/complete') ? 'completed' : 'saved',
      } as JsonValue,
    });
  }

  if (request.method === 'DELETE') {
    return withJson({ ok: true, data: null });
  }

  return withJson({
    ok: true,
    data: {
      id: makeId('item'),
      ...body,
      status: 'saved',
      updatedAt: new Date().toISOString(),
    } as JsonValue,
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: jsonHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      if (request.method === 'GET' || request.method === 'HEAD') {
        return routeGet(pathname, url);
      }
      return routeMutation(request, pathname);
    } catch (err) {
      return withJson(
        { error: err instanceof Error ? err.message : 'API request failed' },
        { status: 500 },
      );
    }
  },
};
