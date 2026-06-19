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
  'access-control-allow-headers':
    'content-type,authorization,x-tenant-id,x-tenant-name,x-tenant-subdomain,x-churchos-onboarding-context',
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

function findDemoPage(pageId: string, pages = demoPages) {
  return pages.find((page) => page.id === pageId) || pages[0];
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

function decodeHeaderValue(value: string | null) {
  if (!value) return '';
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseContextHeader(request: Request): Record<string, any> {
  const raw = request.headers.get('x-churchos-onboarding-context');
  if (!raw) return {};
  try {
    return JSON.parse(decodeHeaderValue(raw));
  } catch {
    return {};
  }
}

function titleFromSubdomain(subdomain: string) {
  return subdomain
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Demo';
}

function subdomainFromTenantId(value: unknown) {
  const tenantId = String(value || '');
  if (tenantId.startsWith('tenant-') && tenantId.length > 'tenant-'.length) {
    return tenantId.slice('tenant-'.length);
  }
  if (tenantId === demoTenant.id) return demoTenant.subdomain;
  return '';
}

function subdomainFromHost(hostname: string) {
  const host = hostname.toLowerCase().split(':')[0];
  if (host === platformDomain || host === `www.${platformDomain}` || host.endsWith('.workers.dev')) return '';
  if (host.endsWith(`.${platformDomain}`)) {
    return host.slice(0, -(platformDomain.length + 1));
  }
  if (host.endsWith('.localhost')) {
    return host.slice(0, -'.localhost'.length);
  }
  return '';
}

function customDomainFromHost(hostname: string) {
  const host = hostname.toLowerCase().split(':')[0];
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.workers.dev')) return '';
  if (host === platformDomain || host === `www.${platformDomain}` || host.endsWith(`.${platformDomain}`)) return '';
  return host;
}

function getRequestContext(request: Request, url: URL, body: Record<string, unknown> = {}) {
  const stored = parseContextHeader(request);
  const storedTenant = stored.tenant || {};
  const storedSteps = stored.steps || {};
  const headerTenantId = request.headers.get('x-tenant-id') || '';
  const headerName = decodeHeaderValue(request.headers.get('x-tenant-name'));
  const headerSubdomain = decodeHeaderValue(request.headers.get('x-tenant-subdomain'));
  const hostSubdomain = subdomainFromHost(url.hostname);
  const hostCustomDomain = customDomainFromHost(url.hostname);

  const subdomain = cleanSubdomain(
    body.subdomain ||
    url.searchParams.get('subdomain') ||
    headerSubdomain ||
    storedTenant.subdomain ||
    hostSubdomain ||
    (hostCustomDomain ? hostCustomDomain.split('.')[0] : '') ||
    subdomainFromTenantId(headerTenantId) ||
    demoTenant.subdomain,
  );

  const name = String(
    body.name ||
    body.churchName ||
    url.searchParams.get('tenantName') ||
    headerName ||
    storedTenant.name ||
    (hostCustomDomain ? `${titleFromSubdomain(hostCustomDomain.split('.')[0])} Church` : '') ||
    (subdomain === demoTenant.subdomain ? demoTenant.name : `${titleFromSubdomain(subdomain)} Church`),
  ).trim();

  const tenant = {
    ...demoTenant,
    ...storedTenant,
    id: headerTenantId || storedTenant.id || (subdomain === demoTenant.subdomain ? demoTenant.id : `tenant-${subdomain}`),
    name,
    subdomain,
    subdomainHost: makeSubdomainHost(subdomain),
    customDomain: String(body.customDomain || storedTenant.customDomain || hostCustomDomain || '').trim() || null,
    country: String(body.country || storedTenant.country || demoTenant.country),
    city: String(body.city || storedTenant.city || demoTenant.city),
    status: 'active',
    onboardingStatus: stored.completedAt ? 'completed' : 'in_progress',
  };

  return {
    tenant,
    steps: storedSteps,
    completedAt: stored.completedAt || null,
  };
}

function getStep(context: ReturnType<typeof getRequestContext>, key: string) {
  const step = context.steps?.[key];
  return step && typeof step === 'object' ? step : {};
}

function makeThemeForContext(context: ReturnType<typeof getRequestContext>) {
  const settings = createEcclesiaThemeSettings({
    installation: {
      installedForTenantId: context.tenant.id,
      installedAt: '2026-06-18T00:00:00.000Z',
      autoProvisioned: true,
      runtime: 'cloudflare-api-worker',
    },
    marketplace: {
      version: '1.0.0',
      author: 'Church OS',
    },
  });

  return {
    ...demoEcclesiaTheme,
    tenantId: context.tenant.id,
    settings: JSON.stringify(settings),
  };
}

function makeBrandingForContext(context: ReturnType<typeof getRequestContext>) {
  const profile = getStep(context, 'profile');
  const logo = getStep(context, 'logo');
  const website = getStep(context, 'website');
  const phone = [profile.phoneCode, profile.phone].filter(Boolean).join(' ').trim();

  return {
    churchName: context.tenant.name,
    description: website.homepageSubtitle || `${context.tenant.name} church website`,
    address: profile.address || '',
    venueAddress: profile.venueAddress || '',
    isVenueDifferent: Boolean(profile.isVenueDifferent),
    phone,
    phoneCode: profile.phoneCode || '',
    publicEmail: profile.email || '',
    email: profile.email || '',
    timezone: profile.timezone || 'UTC',
    serviceTimes: Array.isArray(profile.serviceTimes) ? profile.serviceTimes : [],
    logo: logo.logoUrl || '',
    darkLogo: logo.darkLogoUrl || '',
    favicon: logo.faviconUrl || '',
    accent: '#4f46e5',
    language: 'en',
    city: context.tenant.city,
    country: context.tenant.country,
    subdomainHost: context.tenant.subdomainHost,
    plan: context.tenant.plan,
  };
}

function makeWebsiteForContext(context: ReturnType<typeof getRequestContext>) {
  const website = getStep(context, 'website');
  const theme = makeThemeForContext(context);
  return {
    ...demoWebsite,
    id: `website-${context.tenant.subdomain}`,
    tenantId: context.tenant.id,
    themeId: theme.id,
    title: context.tenant.name,
    description: website.homepageSubtitle || `${context.tenant.name} church website`,
    domain: context.tenant.customDomain || context.tenant.subdomainHost,
    theme,
  };
}

function makePagesForContext(context: ReturnType<typeof getRequestContext>) {
  const website = makeWebsiteForContext(context);
  const websiteStep = getStep(context, 'website');
  return [
    {
      ...demoPages[0],
      id: `page-home-${context.tenant.subdomain}`,
      tenantId: context.tenant.id,
      websiteId: website.id,
      title: 'Home',
      content: JSON.stringify([
        {
          type: 'hero',
          title: websiteStep.homepageTitle || context.tenant.name,
          subtitle: websiteStep.homepageSubtitle || 'Welcome to our church community.',
          aboutText: websiteStep.aboutText || '',
          buttonText: websiteStep.primaryCtaText || 'Plan a Visit',
          buttonUrl: websiteStep.primaryCtaUrl || '/visit',
        },
      ]),
    },
  ];
}

function makeGlobalContentForContext(context: ReturnType<typeof getRequestContext>) {
  const profile = getStep(context, 'profile');
  const logo = getStep(context, 'logo');
  const website = getStep(context, 'website');
  const globalContent = createEcclesiaGlobalContent(context.tenant.name);
  return {
    ...globalContent,
    churchIdentity: {
      ...globalContent.churchIdentity,
      churchName: context.tenant.name,
      logoUrl: logo.logoUrl || globalContent.churchIdentity.logoUrl,
      faviconUrl: logo.faviconUrl || globalContent.churchIdentity.faviconUrl,
      tagline: website.homepageTitle || globalContent.churchIdentity.tagline,
      description: website.homepageSubtitle || globalContent.churchIdentity.description,
    },
    contact: {
      ...globalContent.contact,
      phone: [profile.phoneCode, profile.phone].filter(Boolean).join(' ').trim() || globalContent.contact.phone,
      email: profile.email || globalContent.contact.email,
      address: profile.venueAddress || profile.address || globalContent.contact.address,
    },
    services: {
      ...globalContent.services,
      serviceTimes: Array.isArray(profile.serviceTimes) && profile.serviceTimes.length
        ? profile.serviceTimes.map((item: any) => ({
            label: item.day || 'Service',
            time: item.time || '',
            location: profile.venueAddress || profile.address || undefined,
          }))
        : globalContent.services.serviceTimes,
    },
  };
}

function makeSiteContextForContext(context: ReturnType<typeof getRequestContext>) {
  const theme = makeThemeForContext(context);
  return {
    tenant: {
      id: context.tenant.id,
      name: context.tenant.name,
      subdomain: context.tenant.subdomain,
      status: 'active',
    },
    theme: {
      id: theme.id,
      name: theme.name,
      settings: JSON.parse(theme.settings),
      draftSettings: null,
    },
    moduleEntitlements: [
      'website-cms',
      'theme-engine',
      'domain-tenant-management',
      'livestream',
      'giving',
      'member-crm',
      'church-services',
    ].map((moduleKey) => ({ moduleKey, enabled: true })),
    navigation: {
      id: `nav-${context.tenant.subdomain}`,
      items: createEcclesiaNavigationItems(),
    },
    footer: {
      id: `footer-${context.tenant.subdomain}`,
      copyrightText: `Copyright ${new Date().getFullYear()} ${context.tenant.name}`,
      socialLinks: [],
      secondaryLinks: createEcclesiaFooterLinks(),
    },
    announcement: {
      id: `announcement-${context.tenant.subdomain}`,
      isActive: false,
      text: '',
    },
    enabledPlugins: [],
    pluginSettings: {},
  };
}

function makeRenderForContext(context: ReturnType<typeof getRequestContext>, slug = '') {
  const page = makePagesForContext(context)[0];
  const siteContext = makeSiteContextForContext(context);
  return {
    pageId: page.id,
    title: page.title,
    slug,
    isHome: slug === '',
    contentBlocks: [],
    isPreview: false,
    seoTitle: `${context.tenant.name} | Home`,
    seoDescription: makeWebsiteForContext(context).description,
    seoKeywords: null,
    globalContent: makeGlobalContentForContext(context),
    navigation: siteContext.navigation,
    footer: siteContext.footer,
    theme: {
      name: siteContext.theme.name,
      settings: siteContext.theme.settings,
    },
  };
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

function routeGet(request: Request, pathname: string, url: URL) {
  const context = getRequestContext(request, url);
  const tenant = context.tenant;
  const theme = makeThemeForContext(context);
  const website = makeWebsiteForContext(context);
  const pages = makePagesForContext(context);

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
    return withJson({ data: [website] as unknown as JsonValue });
  }

  if (pathname === '/api/cms/pages') {
    return withJson({ data: pages as unknown as JsonValue });
  }

  if (pathname.startsWith('/api/cms/pages/')) {
    const pageId = pathname.split('/').filter(Boolean).pop() || '';
    return withJson({ data: findDemoPage(pageId, pages) as unknown as JsonValue });
  }

  if (pathname === '/api/cms/global-content') {
    return withJson({ data: makeGlobalContentForContext(context) as unknown as JsonValue });
  }

  if (pathname === '/api/cms/site-context') {
    return withJson({ data: makeSiteContextForContext(context) as unknown as JsonValue });
  }

  if (pathname === '/api/cms/render') {
    return withJson({ data: makeRenderForContext(context, url.searchParams.get('slug') || '') as unknown as JsonValue });
  }

  if (pathname === '/api/theme-engine/themes') {
    return withJson({ data: [theme] as unknown as JsonValue });
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
        name: theme.name,
        settings: JSON.parse(theme.settings),
        version: '1.0.0',
        isPreview: true,
        timestamp: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (pathname === '/api/onboarding') {
    return withJson({
      data: {
        tenant,
        steps: onboardingSteps,
        progressPercent: context.completedAt ? 100 : 20,
        completedAt: context.completedAt,
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
        tenant,
        branding: makeBrandingForContext(context),
      } as unknown as JsonValue,
    });
  }

  if (pathname === '/api/tenant/domain') {
    return withJson({
      data: {
        subdomain: tenant.subdomain,
        subdomainHost: tenant.subdomainHost,
        customDomain: tenant.customDomain || '',
        primaryDomain: tenant.customDomain || tenant.subdomainHost,
        websiteDomain: website.domain,
        status: 'verified',
        dnsStatus: {
          verified: true,
          sslActive: true,
        },
      } as unknown as JsonValue,
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
        ...getThemeEngineOverview(),
        settings: {
          ...getThemeEngineSettings(),
          tenantId: tenant.id,
        },
        activeWebsite: {
          id: website.id,
          title: website.title,
          themeId: theme.id,
          themeName: ECCLESIA_THEME_NAME,
        },
      } as unknown as JsonValue,
    });
  }

  if (pathname === '/api/theme-engine/reports') {
    return withJson({
      data: getThemeEngineOverview().recentActivity as JsonValue,
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
        copyright: `${tenant.name}`,
      } as JsonValue,
    });
  }

  if (pathname === '/api/public/resolve-website-tenant') {
    return withJson({
      data: {
        tenantId: tenant.id,
        tenant,
        website,
      } as JsonValue,
    });
  }

  if (pathname === '/api/public/resolve-subdomain') {
    const subdomain = cleanSubdomain(url.searchParams.get('subdomain'));
    const resolvedContext = getRequestContext(request, url, { subdomain });
    const resolvedTenant = resolvedContext.tenant;
    return withJson({
      tenantId: resolvedTenant.id,
      tenant: resolvedTenant,
      data: resolvedTenant,
    });
  }

  return withJson({
    data: collectionResponse(pathname),
    meta: { source: 'churchos-api-worker', demo: true },
  });
}

async function routeMutation(request: Request, pathname: string) {
  const body = await readBody(request);
  const url = new URL(request.url);
  const context = getRequestContext(request, url, body);
  const tenant = context.tenant;
  const theme = makeThemeForContext(context);
  const website = makeWebsiteForContext(context);
  const pages = makePagesForContext(context);

  if (pathname === '/api/cms/websites') {
    return withJson({ data: { ...website, ...(body as Record<string, JsonValue>) } as unknown as JsonValue }, { status: 201 });
  }

  if (pathname === '/api/cms/pages') {
    const title = String(body.title || 'Untitled page');
    const slug = String(body.slug || '').replace(/^\/+/, '');
    const page = {
      id: makeId('page'),
      tenantId: tenant.id,
      websiteId: String(body.websiteId || website.id),
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
    const pageId = pathname.split('/').filter(Boolean).at(-2) || pages[0].id;
    const page = findDemoPage(pageId, pages);
    return withJson({
      data: {
        ...page,
        draftContent: JSON.stringify(body.draftContent || []),
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (/^\/api\/cms\/pages\/[^/]+\/publish$/.test(pathname)) {
    const pageId = pathname.split('/').filter(Boolean).at(-2) || pages[0].id;
    const page = findDemoPage(pageId, pages);
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
    const pageId = pathname.split('/').filter(Boolean).pop() || pages[0].id;
    return withJson({
      data: {
        ...findDemoPage(pageId, pages),
        ...(body as Record<string, JsonValue>),
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (pathname === '/api/theme-engine/settings') {
    return withJson({
      data: {
        ...getThemeEngineSettings(),
        tenantId: tenant.id,
        ...(body as Record<string, JsonValue>),
      } as JsonValue,
    });
  }

  if (pathname === '/api/theme-engine/ecclesia/provision') {
    return withJson({ data: { theme, website } as unknown as JsonValue });
  }

  if (pathname === '/api/theme-engine/themes/install') {
    return withJson({ data: theme as unknown as JsonValue }, { status: 201 });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/activate$/.test(pathname)) {
    return withJson({
      data: {
        ...website,
        id: String(body.websiteId || website.id),
        themeId: pathname.split('/').filter(Boolean).at(-2) || theme.id,
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customization\/draft$/.test(pathname)) {
    return withJson({
      data: {
        ...theme,
        id: pathname.split('/').filter(Boolean).at(-3) || theme.id,
        draftSettings: JSON.stringify(body),
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customization\/(publish|discard|reset)$/.test(pathname)) {
    return withJson({
      data: {
        ...theme,
        id: pathname.split('/').filter(Boolean).at(-3) || theme.id,
        draftSettings: null,
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customize$/.test(pathname)) {
    return withJson({
      data: {
        ...theme,
        id: pathname.split('/').filter(Boolean).at(-2) || theme.id,
        settings: JSON.stringify({ ...JSON.parse(theme.settings), ...(body as Record<string, JsonValue>) }),
        updatedAt: new Date().toISOString(),
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/preview\/customize$/.test(pathname)) {
    return withJson({
      data: {
        themeId: pathname.split('/').filter(Boolean).at(-3) || theme.id,
        settings: { ...JSON.parse(theme.settings), ...(body as Record<string, JsonValue>) },
        isPreview: true,
        staging: true,
      } as JsonValue,
    });
  }

  if (pathname === '/api/public/check-subdomain') {
    return withJson({ available: true, data: { available: true } });
  }

  if (pathname === '/api/tenant/branding') {
    return withJson({
      data: {
        tenant: {
          ...tenant,
          name: String(body.name || tenant.name),
        },
        branding: {
          ...makeBrandingForContext(context),
          ...(body as Record<string, JsonValue>),
        },
      } as unknown as JsonValue,
    });
  }

  if (pathname === '/api/tenant/domain') {
    const customDomain = String(body.customDomain || '').trim().toLowerCase();
    return withJson({
      data: {
        subdomain: tenant.subdomain,
        subdomainHost: tenant.subdomainHost,
        customDomain,
        primaryDomain: customDomain || tenant.subdomainHost,
        websiteDomain: customDomain || tenant.subdomainHost,
        status: 'verified',
        dnsStatus: {
          verified: true,
          sslActive: true,
        },
      } as unknown as JsonValue,
    });
  }

  if (pathname === '/api/public/resolve-subdomain') {
    const subdomain = cleanSubdomain(body.subdomain);
    const resolvedContext = getRequestContext(request, url, { ...body, subdomain });
    const resolvedTenant = resolvedContext.tenant;
    return withJson({
      tenantId: resolvedTenant.id,
      tenant: resolvedTenant,
      data: resolvedTenant,
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
      title: tenant.name,
      description: `${tenant.name} church website`,
      domain: tenant.subdomainHost,
      status: 'published',
      isPrimary: true,
      isActive: true,
      theme: {
        ...demoEcclesiaTheme,
        tenantId: tenant.id,
      },
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
    const stepKey = pathname.split('/').filter(Boolean).pop() || 'profile';
    const normalizedStepKey = stepKey === 'website-basics' ? 'website' : stepKey;
    return withJson({
      ok: true,
      data: {
        id: makeId('onboarding'),
        tenant,
        steps: onboardingSteps.map((step) => step.stepKey === normalizedStepKey
          ? { ...step, status: 'completed', metadataJson: JSON.stringify(body) }
          : step),
        progressPercent: pathname.endsWith('/complete') ? 100 : 40,
        completedAt: pathname.endsWith('/complete') ? new Date().toISOString() : null,
        step: {
          stepKey: normalizedStepKey,
          status: 'completed',
          metadataJson: JSON.stringify(body),
        },
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
        return routeGet(request, pathname, url);
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
