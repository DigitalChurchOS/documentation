/// <reference lib="webworker" />

import {
  ECCLESIA_THEME_KEY,
  ECCLESIA_THEME_NAME,
  createEcclesiaFooterLinks,
  createEcclesiaGlobalContent,
  createEcclesiaNavigationItems,
  createEcclesiaThemeSettings,
  getEcclesiaPageTemplates,
  getEcclesiaSectionTemplates,
} from './themes/ecclesia';

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

const platformDomain = 'churched.online';

function makeSubdomainHost(subdomain: string) {
  return `${subdomain}.${platformDomain}`;
}

const demoTenant = {
  id: 'demo-church-local',
  name: 'Demo Church',
  subdomain: 'demo',
  subdomainHost: makeSubdomainHost('demo'),
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

const demoThemeSettings = createEcclesiaThemeSettings({
  installation: {
    installedForTenantId: demoTenant.id,
    installedAt: '2026-06-18T00:00:00.000Z',
    autoProvisioned: true,
    runtime: 'cloudflare-api-worker',
  },
  marketplace: {
    version: '1.0.0',
    author: 'Church OS',
  },
});

const demoEcclesiaTheme = {
  id: 'theme-ecclesia',
  tenantId: demoTenant.id,
  name: ECCLESIA_THEME_NAME,
  slug: ECCLESIA_THEME_KEY,
  description: 'System default church website theme with full Ecclesia page templates, source assets, and builder-aware styling.',
  settings: JSON.stringify(demoThemeSettings),
  draftSettings: null,
  isCustom: false,
  status: 'active',
  previewUrl: '/themes/ecclesia/index.html',
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z',
};

const demoWebsite = {
  id: 'website-main',
  tenantId: demoTenant.id,
  themeId: demoEcclesiaTheme.id,
  title: `${demoTenant.name} Website`,
  description: createEcclesiaGlobalContent(demoTenant.name).churchIdentity.description,
  domain: demoTenant.subdomainHost,
  isActive: true,
  isPrimary: true,
  status: 'published',
  theme: demoEcclesiaTheme,
  createdAt: '2026-06-18T00:00:00.000Z',
  updatedAt: '2026-06-18T00:00:00.000Z',
};

const demoPages = [
  {
    id: 'page-home',
    tenantId: demoTenant.id,
    websiteId: demoWebsite.id,
    title: 'Home',
    slug: '',
    status: 'published',
    content: '[]',
    draftContent: null,
    isHome: true,
    isPublished: true,
    updatedAt: '2026-06-18T00:00:00.000Z',
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

function getThemeEngineSettings() {
  return {
    tenantId: demoTenant.id,
    moduleKey: 'theme-engine',
    enabled: true,
    billingPlan: 'platform',
    providerMode: 'platform_managed',
    configJson: JSON.stringify({
      sections: [],
      pageTemplates: [],
      defaults: {
        systemTheme: ECCLESIA_THEME_KEY,
        activeThemeId: demoEcclesiaTheme.id,
      },
    }),
  };
}

function getThemeEngineOverview() {
  return {
    moduleKey: 'theme-engine',
    settings: getThemeEngineSettings(),
    activeTheme: ECCLESIA_THEME_NAME,
    installedThemes: 1,
    draftChanges: 0,
    counts: {
      moduleProfiles: 1,
      installedThemes: 1,
      globalThemes: 1,
      websites: 1,
      sectionTemplates: getEcclesiaSectionTemplates().length,
      pageTemplates: getEcclesiaPageTemplates().length,
    },
    activeWebsite: {
      id: demoWebsite.id,
      title: demoWebsite.title,
      themeId: demoEcclesiaTheme.id,
      themeName: ECCLESIA_THEME_NAME,
    },
    recentActivity: [
      {
        id: 'activity-provision-ecclesia',
        tenantId: demoTenant.id,
        userId: 'System',
        actionType: 'provision_ecclesia',
        metadataJson: JSON.stringify({ themeId: demoEcclesiaTheme.id, websiteId: demoWebsite.id }),
        createdAt: '2026-06-18T00:00:00.000Z',
      },
    ],
  };
}

function findDemoPage(pageId: string) {
  return demoPages.find((page) => page.id === pageId) || demoPages[0];
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
  if (pathname.includes('/websites')) return [demoWebsite] as JsonValue;
  if (pathname.includes('/themes')) return [demoEcclesiaTheme] as JsonValue;
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

  if (pathname === '/api/cms/websites') {
    return withJson({ data: [demoWebsite] as JsonValue });
  }

  if (pathname === '/api/cms/pages') {
    return withJson({ data: demoPages as JsonValue });
  }

  if (pathname.startsWith('/api/cms/pages/')) {
    const pageId = pathname.split('/').filter(Boolean).pop() || '';
    return withJson({ data: findDemoPage(pageId) as JsonValue });
  }

  if (pathname === '/api/cms/global-content') {
    return withJson({ data: createEcclesiaGlobalContent(demoTenant.name) as JsonValue });
  }

  if (pathname === '/api/theme-engine/themes') {
    return withJson({ data: [demoEcclesiaTheme] as JsonValue });
  }

  if (pathname === '/api/theme-engine/sections') {
    return withJson({ data: getEcclesiaSectionTemplates() as unknown as JsonValue });
  }

  if (pathname === '/api/theme-engine/page-templates') {
    return withJson({ data: getEcclesiaPageTemplates() as unknown as JsonValue });
  }

  if (pathname === '/api/theme-engine/settings' || pathname === '/api/settings/theme-engine') {
    return withJson({ data: getThemeEngineSettings() as JsonValue });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/preview$/.test(pathname)) {
    return withJson({
      data: {
        themeId: demoEcclesiaTheme.id,
        name: demoEcclesiaTheme.name,
        settings: demoThemeSettings,
        version: '1.0.0',
        isPreview: true,
        timestamp: new Date().toISOString(),
      } as JsonValue,
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
    return withJson({ data: getThemeEngineOverview() as JsonValue });
  }

  if (pathname === '/api/theme-engine/reports') {
    return withJson({
      data: getThemeEngineOverview().recentActivity as JsonValue,
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
    return withJson({ data: { items: createEcclesiaNavigationItems() } as JsonValue });
  }

  if (pathname === '/api/cms/footer') {
    return withJson({
      data: {
        columns: [],
        secondaryLinks: createEcclesiaFooterLinks(),
        copyright: `${demoTenant.name}`,
      } as JsonValue,
    });
  }

  if (pathname === '/api/public/resolve-website-tenant') {
    return withJson({
      data: {
        tenantId: demoTenant.id,
        tenant: demoTenant,
        website: demoWebsite,
      } as JsonValue,
    });
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

  if (pathname === '/api/cms/websites') {
    return withJson({ data: { ...demoWebsite, ...(body as Record<string, JsonValue>) } as JsonValue }, { status: 201 });
  }

  if (pathname === '/api/cms/pages') {
    const title = String(body.title || 'Untitled page');
    const slug = String(body.slug || '').replace(/^\/+/, '');
    const page = {
      id: makeId('page'),
      tenantId: demoTenant.id,
      websiteId: String(body.websiteId || demoWebsite.id),
      title,
      slug,
      status: String(body.status || 'draft'),
      content: JSON.stringify(body.content || []),
      draftContent: null,
      isHome: slug === '',
      isPublished: body.status === 'published',
      updatedAt: new Date().toISOString(),
    };
    return withJson({ data: page as JsonValue }, { status: 201 });
  }

  if (/^\/api\/cms\/pages\/[^/]+\/draft$/.test(pathname)) {
    const pageId = pathname.split('/').filter(Boolean).at(-2) || demoPages[0].id;
    const page = findDemoPage(pageId);
    return withJson({
      data: {
        ...page,
        draftContent: JSON.stringify(body.draftContent || []),
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (/^\/api\/cms\/pages\/[^/]+\/publish$/.test(pathname)) {
    const pageId = pathname.split('/').filter(Boolean).at(-2) || demoPages[0].id;
    const page = findDemoPage(pageId);
    return withJson({
      data: {
        ...page,
        status: 'published',
        isPublished: true,
        draftContent: null,
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (/^\/api\/cms\/pages\/[^/]+$/.test(pathname)) {
    const pageId = pathname.split('/').filter(Boolean).pop() || demoPages[0].id;
    return withJson({
      data: {
        ...findDemoPage(pageId),
        ...(body as Record<string, JsonValue>),
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (pathname === '/api/theme-engine/settings') {
    return withJson({
      data: {
        ...getThemeEngineSettings(),
        ...(body as Record<string, JsonValue>),
      } as JsonValue,
    });
  }

  if (pathname === '/api/theme-engine/ecclesia/provision') {
    return withJson({ data: { theme: demoEcclesiaTheme, website: demoWebsite } as JsonValue });
  }

  if (pathname === '/api/theme-engine/themes/install') {
    return withJson({ data: demoEcclesiaTheme as JsonValue }, { status: 201 });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/activate$/.test(pathname)) {
    return withJson({
      data: {
        ...demoWebsite,
        id: String(body.websiteId || demoWebsite.id),
        themeId: pathname.split('/').filter(Boolean).at(-2) || demoEcclesiaTheme.id,
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customization\/draft$/.test(pathname)) {
    return withJson({
      data: {
        ...demoEcclesiaTheme,
        id: pathname.split('/').filter(Boolean).at(-3) || demoEcclesiaTheme.id,
        draftSettings: JSON.stringify(body),
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customization\/(publish|discard|reset)$/.test(pathname)) {
    return withJson({
      data: {
        ...demoEcclesiaTheme,
        id: pathname.split('/').filter(Boolean).at(-3) || demoEcclesiaTheme.id,
        draftSettings: null,
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customize$/.test(pathname)) {
    return withJson({
      data: {
        ...demoEcclesiaTheme,
        id: pathname.split('/').filter(Boolean).at(-2) || demoEcclesiaTheme.id,
        settings: JSON.stringify({ ...demoThemeSettings, ...(body as Record<string, JsonValue>) }),
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/preview\/customize$/.test(pathname)) {
    return withJson({
      data: {
        themeId: pathname.split('/').filter(Boolean).at(-3) || demoEcclesiaTheme.id,
        settings: { ...demoThemeSettings, ...(body as Record<string, JsonValue>) },
        isPreview: true,
        staging: true,
      } as JsonValue,
    });
  }

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
