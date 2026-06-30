/// <reference lib="webworker" />

import {
  ECCLESIA_THEME_KEY,
  ECCLESIA_THEME_NAME,
  createEcclesiaFooterLinks,
  createEcclesiaDefaultPages,
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

type TenantRegistry = {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
};

type Env = {
  CHURCHOS_TENANTS?: TenantRegistry;
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
const defaultTenantValues = {
  plan: 'growth',
  country: 'United States',
  city: 'Online',
};
const reservedSubdomains = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'central',
  'church',
  'developer',
  'docs',
  'help',
  'live',
  'mail',
  'marketplace',
  'onboarding',
  'start',
  'status',
  'support',
  'super-admin',
  'www',
]);

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
  id: 'website-demo',
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
    id: 'page-demo-home',
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

function isDemoWebsiteId(value: unknown) {
  const websiteId = String(value || '');
  return websiteId === demoWebsite.id || websiteId === 'website-main';
}

type TenantPageRecord = {
  id: string;
  tenantId: string;
  websiteId: string;
  title: string;
  slug: string;
  status: string;
  content: string;
  draftContent: string | null;
  isHome: boolean;
  isPublished: boolean;
  updatedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string | null;
  sourceFile?: string;
  sourceUrl?: string;
  module?: string;
};

type TenantThemeState = {
  settings: Record<string, any>;
  draftSettings: Record<string, any> | null;
  updatedAt: string;
};

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

function findDemoPage<T extends { id: string; slug: string }>(pageId: string, pages = demoPages as unknown as T[]) {
  const slug = String(pageId || '').replace(/^\/+/, '');
  return pages.find((page) => page.id === pageId || page.slug === slug) || pages[0];
}

function tenantThemeStateKey(tenantId: string) {
  return `tenant-theme:${tenantId}`;
}

function tenantPagesStateKey(tenantId: string) {
  return `tenant-pages:${tenantId}`;
}

function tenantNavigationStateKey(tenantId: string) {
  return `tenant-navigation:${tenantId}`;
}

function tenantMembersStateKey(tenantId: string) {
  return `tenant-members:${tenantId}`;
}

function pageIdFromSlug(context: ReturnType<typeof getRequestContext>, slug: string) {
  const slugKey = cleanSubdomain(slug || 'home') || 'home';
  const tenantKey = cleanSubdomain(context.tenant.subdomain || context.tenant.id) || 'tenant';
  return `page-${tenantKey}-${slugKey}`;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function parseStoredJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function stringifyCmsContent(value: unknown) {
  if (typeof value === 'string') return value;
  return JSON.stringify(value || []);
}

function mergeRecords(base: Record<string, any>, patch: Record<string, any>): Record<string, any> {
  const next: Record<string, any> = { ...base };
  Object.entries(patch).forEach(([key, value]) => {
    if (isRecord(value) && isRecord(next[key])) {
      next[key] = mergeRecords(next[key], value);
      return;
    }
    next[key] = value;
  });
  return next;
}

function cleanSubdomain(value: unknown) {
  const cleaned = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return cleaned;
}

function tenantRegistryKey(subdomain: string) {
  return `tenant:${cleanSubdomain(subdomain)}`;
}

function cleanCustomDomain(value: unknown) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .replace(/^\.+|\.+$/g, '');
}

function domainRegistryKey(hostname: string) {
  return `domain:${cleanCustomDomain(hostname)}`;
}

function isReservedSubdomain(subdomain: string) {
  const clean = cleanSubdomain(subdomain);
  return !clean || reservedSubdomains.has(clean);
}

function serializeTenantForRegistry(tenant: Record<string, any>) {
  const subdomain = cleanSubdomain(tenant.subdomain);
  if (!subdomain) {
    throw new Error('Tenant subdomain is required');
  }
  const customDomain = cleanCustomDomain(tenant.customDomain);
  return {
    ...defaultTenantValues,
    ...tenant,
    id: String(tenant.id || `tenant-${subdomain}`),
    name: String(tenant.name || `${titleFromSubdomain(subdomain)} Church`),
    subdomain,
    subdomainHost: makeSubdomainHost(subdomain),
    customDomain: customDomain || null,
    status: tenant.status || 'active',
  };
}

async function readRegisteredTenant(env: Env, subdomain: string) {
  const clean = cleanSubdomain(subdomain);
  if (isReservedSubdomain(clean)) return null;
  const raw = await env.CHURCHOS_TENANTS?.get(tenantRegistryKey(clean));
  if (!raw) return null;
  try {
    return serializeTenantForRegistry(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function readRegisteredTenantByDomain(env: Env, hostname: string) {
  const clean = cleanCustomDomain(hostname);
  if (!clean || clean === platformDomain || clean === `www.${platformDomain}` || clean.endsWith(`.${platformDomain}`)) {
    return null;
  }
  const raw = await env.CHURCHOS_TENANTS?.get(domainRegistryKey(clean));
  if (!raw) return null;
  try {
    return serializeTenantForRegistry(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function writeRegisteredTenant(env: Env, tenant: Record<string, any>) {
  const record = serializeTenantForRegistry(tenant);
  if (isReservedSubdomain(record.subdomain)) {
    throw new Error('This subdomain is reserved. Please choose another.');
  }
  const existing = await readRegisteredTenant(env, record.subdomain);
  await env.CHURCHOS_TENANTS?.put(tenantRegistryKey(record.subdomain), JSON.stringify(record));
  const oldDomain = cleanCustomDomain(existing?.customDomain);
  const nextDomain = cleanCustomDomain(record.customDomain);
  if (oldDomain && oldDomain !== nextDomain) {
    await env.CHURCHOS_TENANTS?.delete(domainRegistryKey(oldDomain));
  }
  if (nextDomain) {
    await env.CHURCHOS_TENANTS?.put(domainRegistryKey(nextDomain), JSON.stringify(record));
  }
  return record;
}

async function getSubdomainAvailability(env: Env, input: unknown) {
  const subdomain = cleanSubdomain(input);
  const invalid = !subdomain;
  const reserved = isReservedSubdomain(subdomain);
  const existing = reserved ? null : await readRegisteredTenant(env, subdomain);
  return {
    subdomain,
    host: makeSubdomainHost(subdomain),
    available: !invalid && !reserved && !existing,
    reason: invalid ? 'invalid' : reserved ? 'reserved' : existing ? 'taken' : null,
    suggestions: !reserved && !existing ? [] : [`${subdomain}-church`, `${subdomain}-online`, `${subdomain}-${new Date().getFullYear()}`]
      .map(cleanSubdomain)
      .filter((candidate) => candidate && !isReservedSubdomain(candidate) && candidate !== subdomain)
      .slice(0, 3),
  };
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
  if (tenantId === demoTenant.id) {
    return demoTenant.subdomain;
  }
  if (tenantId.startsWith('tenant-') && tenantId.length > 'tenant-'.length) {
    return tenantId.slice('tenant-'.length);
  }
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

function getRequestContext(
  request: Request,
  url: URL,
  body: Record<string, unknown> = {},
  resolvedTenant: Record<string, any> = {},
) {
  const stored = parseContextHeader(request);
  const storedTenant = {
    ...resolvedTenant,
    ...(stored.tenant || {}),
  };
  const storedSteps = {
    ...(resolvedTenant.steps || {}),
    ...(stored.steps || {}),
  };
  const headerTenantId = request.headers.get('x-tenant-id') || '';
  const headerName = decodeHeaderValue(request.headers.get('x-tenant-name'));
  const headerSubdomain = decodeHeaderValue(request.headers.get('x-tenant-subdomain'));
  const hostSubdomain = subdomainFromHost(url.hostname);
  const hostCustomDomain = customDomainFromHost(url.hostname);

  const subdomain = cleanSubdomain(
    body.subdomain ||
    headerSubdomain ||
    storedTenant.subdomain ||
    hostSubdomain ||
    (hostCustomDomain ? hostCustomDomain.split('.')[0] : '') ||
    subdomainFromTenantId(headerTenantId),
  );

  const name = String(
    body.name ||
    body.churchName ||
    headerName ||
    storedTenant.name ||
    (hostCustomDomain ? `${titleFromSubdomain(hostCustomDomain.split('.')[0])} Church` : '') ||
    (subdomain ? `${titleFromSubdomain(subdomain)} Church` : 'Church Workspace'),
  ).trim();

  const tenant = {
    ...defaultTenantValues,
    ...storedTenant,
    id: headerTenantId || storedTenant.id || String(body.id || '') || (subdomain ? `tenant-${subdomain}` : 'tenant-unresolved'),
    name,
    subdomain,
    subdomainHost: subdomain ? makeSubdomainHost(subdomain) : '',
    customDomain: cleanCustomDomain(body.customDomain || storedTenant.customDomain || hostCustomDomain) || null,
    country: String(body.country || storedTenant.country || defaultTenantValues.country),
    city: String(body.city || storedTenant.city || defaultTenantValues.city),
    status: 'active',
    onboardingStatus: stored.completedAt ? 'completed' : 'in_progress',
  };

  return {
    tenant,
    steps: storedSteps,
    completedAt: stored.completedAt || null,
  };
}

async function resolveRequestTenant(
  env: Env,
  request: Request,
  url: URL,
  body: Record<string, unknown> = {},
) {
  const hostSubdomain = subdomainFromHost(url.hostname);
  const hostCustomDomain = customDomainFromHost(url.hostname);

  if (hostSubdomain === demoTenant.subdomain) {
    return demoTenant;
  }

  if (hostSubdomain) {
    const tenant = await readRegisteredTenant(env, hostSubdomain);
    if (tenant) return tenant;
  }

  if (hostCustomDomain) {
    const tenant = await readRegisteredTenantByDomain(env, hostCustomDomain);
    if (tenant) return tenant;
  }

  const stored = parseContextHeader(request);
  const storedTenant = stored.tenant || {};
  const headerSubdomain = decodeHeaderValue(request.headers.get('x-tenant-subdomain'));
  const headerTenantId = request.headers.get('x-tenant-id') || '';
  const bodyTenant = body.tenant && typeof body.tenant === 'object'
    ? body.tenant as Record<string, unknown>
    : {};

  const candidates = [
    headerSubdomain,
    body.subdomain,
    bodyTenant.subdomain,
    storedTenant.subdomain,
    subdomainFromTenantId(headerTenantId),
    subdomainFromTenantId(body.tenantId),
    subdomainFromTenantId(bodyTenant.id),
    subdomainFromTenantId(storedTenant.id),
  ]
    .map(cleanSubdomain)
    .filter(Boolean);

  for (const subdomain of Array.from(new Set(candidates))) {
    const tenant = await readRegisteredTenant(env, subdomain);
    if (tenant) return tenant;
  }

  if (isDemoWebsiteId(url.searchParams.get('websiteId'))) {
    return demoTenant;
  }

  if (headerTenantId === demoTenant.id) {
    return demoTenant;
  }

  return null;
}

function getStep(context: ReturnType<typeof getRequestContext>, key: string) {
  const step = context.steps?.[key];
  return step && typeof step === 'object' ? step : {};
}

function makeDefaultThemeSettingsForContext(context: ReturnType<typeof getRequestContext>) {
  return createEcclesiaThemeSettings({
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
}

function coerceRecord(value: unknown, fallback: Record<string, any> = {}) {
  if (typeof value === 'string') {
    return coerceRecord(parseStoredJson<Record<string, any>>(value, fallback), fallback);
  }
  return isRecord(value) ? value : fallback;
}

async function readTenantThemeState(env: Env, context: ReturnType<typeof getRequestContext>): Promise<TenantThemeState> {
  const fallback: TenantThemeState = {
    settings: makeDefaultThemeSettingsForContext(context),
    draftSettings: null,
    updatedAt: '2026-06-18T00:00:00.000Z',
  };
  const raw = await env.CHURCHOS_TENANTS?.get(tenantThemeStateKey(context.tenant.id));
  const stored = parseStoredJson<Record<string, any>>(raw, {});
  const settings = coerceRecord(stored.settings, fallback.settings);
  const draftSettings = stored.draftSettings == null ? null : coerceRecord(stored.draftSettings, null as unknown as Record<string, any>);
  return {
    settings,
    draftSettings,
    updatedAt: String(stored.updatedAt || fallback.updatedAt),
  };
}

async function writeTenantThemeState(env: Env, context: ReturnType<typeof getRequestContext>, state: TenantThemeState) {
  await env.CHURCHOS_TENANTS?.put(
    tenantThemeStateKey(context.tenant.id),
    JSON.stringify({
      settings: state.settings,
      draftSettings: state.draftSettings,
      updatedAt: state.updatedAt,
    }),
  );
}

function makeThemeForContext(context: ReturnType<typeof getRequestContext>, state?: TenantThemeState) {
  const themeState = state || {
    settings: makeDefaultThemeSettingsForContext(context),
    draftSettings: null,
    updatedAt: '2026-06-18T00:00:00.000Z',
  };
  return {
    ...demoEcclesiaTheme,
    tenantId: context.tenant.id,
    settings: JSON.stringify(themeState.settings),
    draftSettings: themeState.draftSettings ? JSON.stringify(themeState.draftSettings) : null,
    updatedAt: themeState.updatedAt,
  };
}

function makeBrandingForContext(context: ReturnType<typeof getRequestContext>) {
  const profile = getStep(context, 'profile');
  const logo = getStep(context, 'logo');
  const website = getStep(context, 'website');
  const phone = [profile.phoneCode, profile.phone].filter(Boolean).join(' ').trim() || profile.phone || '';

  return {
    churchName: context.tenant.name,
    description: website.homepageSubtitle || `${context.tenant.name} church website`,
    address: profile.address || '',
    venueAddress: profile.venueAddress || '',
    isVenueDifferent: Boolean(profile.isVenueDifferent),
    phone,
    phoneCode: profile.phoneCode || '',
    publicEmail: profile.publicEmail || profile.email || '',
    email: profile.email || '',
    timezone: profile.timezone || 'UTC',
    serviceTimes: Array.isArray(profile.serviceTimes) ? profile.serviceTimes : [],
    logo: logo.logoUrl || logo.logo || '',
    darkLogo: logo.darkLogoUrl || logo.darkLogo || '',
    favicon: logo.faviconUrl || logo.favicon || '',
    accent: '#4f46e5',
    language: 'en',
    city: context.tenant.city,
    country: context.tenant.country,
    subdomainHost: context.tenant.subdomainHost,
    plan: context.tenant.plan,
  };
}

function makeWebsiteForContext(context: ReturnType<typeof getRequestContext>, theme = makeThemeForContext(context)) {
  const website = getStep(context, 'website');
  const websiteSubdomain = context.tenant.subdomain || subdomainFromTenantId(context.tenant.id);
  const websiteId = context.tenant.id === demoTenant.id || websiteSubdomain === demoTenant.subdomain
    ? demoWebsite.id
    : `website-${cleanSubdomain(websiteSubdomain || context.tenant.id) || 'workspace'}`;
  return {
    ...demoWebsite,
    id: websiteId,
    tenantId: context.tenant.id,
    themeId: theme.id,
    title: context.tenant.name,
    description: website.homepageSubtitle || `${context.tenant.name} church website`,
    domain: context.tenant.customDomain || context.tenant.subdomainHost || (websiteSubdomain ? makeSubdomainHost(websiteSubdomain) : ''),
    theme,
  };
}

function normalizeTenantPage(
  context: ReturnType<typeof getRequestContext>,
  website: ReturnType<typeof makeWebsiteForContext>,
  page: Record<string, any>,
): TenantPageRecord {
  const slug = String(page.slug || '').replace(/^\/+/, '');
  const template = getEcclesiaPageTemplates().find((item) => item.slug === slug);
  const isHome = slug === '' || Boolean(page.isHome);
  return {
    id: String(page.id || pageIdFromSlug(context, slug)),
    tenantId: context.tenant.id,
    websiteId: String(page.websiteId || website.id),
    title: String(page.title || page.name || template?.title || 'Untitled page'),
    slug,
    status: String(page.status || 'draft'),
    content: stringifyCmsContent(page.content),
    draftContent: page.draftContent == null ? null : stringifyCmsContent(page.draftContent),
    isHome,
    isPublished: page.isPublished == null ? String(page.status || 'draft') === 'published' : Boolean(page.isPublished),
    updatedAt: String(page.updatedAt || '2026-06-18T00:00:00.000Z'),
    seoTitle: page.seoTitle || template?.seo?.title?.replace('{{churchName}}', context.tenant.name),
    seoDescription: page.seoDescription || template?.seo?.description?.replace('{{churchName}}', context.tenant.name),
    seoKeywords: page.seoKeywords || template?.seo?.keywords || null,
    sourceFile: page.sourceFile || template?.sourceFile,
    sourceUrl: page.sourceUrl || template?.sourceUrl,
    module: page.module || template?.module,
  };
}

function makePagesForContext(
  context: ReturnType<typeof getRequestContext>,
  website = makeWebsiteForContext(context),
  storedPages: Record<string, any>[] = [],
): TenantPageRecord[] {
  const websiteStep = getStep(context, 'website');
  const defaults = createEcclesiaDefaultPages(context.tenant.id, website.id, context.tenant.name)
    .map((page) => normalizeTenantPage(context, website, {
      ...page,
      id: pageIdFromSlug(context, page.slug),
      isHome: page.slug === '' || Boolean(page.isHome),
      isPublished: page.status === 'published',
    }));

  const homePage = defaults.find((page) => page.slug === '');
  if (homePage && (websiteStep.homepageTitle || websiteStep.homepageSubtitle || websiteStep.aboutText)) {
    homePage.content = JSON.stringify([
      {
        type: 'hero',
        title: websiteStep.homepageTitle || context.tenant.name,
        subtitle: websiteStep.homepageSubtitle || 'Welcome to our church community.',
        aboutText: websiteStep.aboutText || '',
        buttonText: websiteStep.primaryCtaText || 'Plan a Visit',
        buttonUrl: websiteStep.primaryCtaUrl || '/visit',
      },
    ]);
  }

  const bySlug = new Map(defaults.map((page) => [page.slug, page]));
  storedPages.forEach((page) => {
    const normalized = normalizeTenantPage(context, website, page);
    bySlug.set(normalized.slug, normalized);
  });

  return Array.from(bySlug.values());
}

async function readTenantPages(
  env: Env,
  context: ReturnType<typeof getRequestContext>,
  website = makeWebsiteForContext(context),
) {
  const raw = await env.CHURCHOS_TENANTS?.get(tenantPagesStateKey(context.tenant.id));
  const stored = parseStoredJson<Record<string, any>[]>(raw, []);
  return makePagesForContext(context, website, Array.isArray(stored) ? stored : []);
}

async function writeTenantPages(
  env: Env,
  context: ReturnType<typeof getRequestContext>,
  pages: TenantPageRecord[],
) {
  await env.CHURCHOS_TENANTS?.put(tenantPagesStateKey(context.tenant.id), JSON.stringify(pages));
}

function normalizeNavigationItems(items: unknown) {
  const rawItems = typeof items === 'string'
    ? parseStoredJson<Record<string, any>[]>(items, [])
    : Array.isArray(items)
      ? items
      : [];

  return rawItems
    .filter((item) => item && typeof item === 'object')
    .map((item: any) => ({
      label: String(item.label || item.name || 'Page'),
      url: String(item.url || item.href || '/'),
      icon: item.icon ? String(item.icon) : undefined,
    }));
}

function defaultTenantNavigationMenus(websiteId: string) {
  const menu = (name: string, items: Array<{ label: string; url: string; icon?: string }>) => ({
    id: `nav-${cleanSubdomain(name) || makeId('nav')}`,
    websiteId,
    name,
    items,
    isActive: true,
  });

  return [
    menu('Header Menu', [
      { label: 'Home', url: '/' },
      { label: 'Connect', url: '/connect' },
      { label: 'About', url: '/about' },
      { label: 'Events', url: '/events' },
      { label: 'Ministries', url: '/ministries' },
      { label: 'Contact', url: '/contact' },
    ]),
    menu('Rail Navigation', [
      { label: 'Media', url: '/media', icon: 'tv' },
      { label: 'Blogs', url: '/blogs', icon: 'newspaper' },
      { label: 'Resources', url: '/resources', icon: 'book-open' },
      { label: 'Podcasts', url: '/podcasts', icon: 'mic' },
      { label: 'Fellowship', url: '/fellowship', icon: 'users' },
      { label: 'Store', url: '/store', icon: 'shopping-bag' },
      { label: 'Devortion', url: '/devortion', icon: 'heart' },
    ]),
    menu('Footer Menu 1', [
      { label: 'Connect', url: '/connect' },
      { label: 'Plan a Visit', url: '/plan-a-visit' },
      { label: 'Get in touch', url: '/get-in-touch' },
    ]),
    menu('Footer Menu 2', [
      { label: 'Prayer', url: '/prayer' },
      { label: 'Worship', url: '/worship' },
      { label: 'Study', url: '/study' },
      { label: 'Cells', url: '/cells' },
      { label: 'Giving', url: '/giving' },
    ]),
    menu('Main Mobile Drawer Menu', [
      { label: 'Connect', url: '/connect' },
      { label: 'About', url: '/about' },
      { label: 'Events', url: '/events' },
      { label: 'Ministries', url: '/ministries' },
      { label: 'Contact', url: '/contact' },
    ]),
    menu('Bottom Mobile Menu', [
      { label: 'Home', url: '/' },
      { label: 'Media', url: '/media' },
      { label: 'Connect', url: '/connect' },
      { label: 'Devortion', url: '/devortion' },
      { label: 'Fellowship', url: '/fellowship' },
    ]),
    menu('Mobile Rail Navigation', [
      { label: 'Media', url: '/media', icon: 'tv' },
      { label: 'Blogs', url: '/blogs', icon: 'newspaper' },
      { label: 'Resources', url: '/resources', icon: 'book-open' },
      { label: 'Podcasts', url: '/podcasts', icon: 'mic' },
      { label: 'Fellowship', url: '/fellowship', icon: 'users' },
      { label: 'Store', url: '/store', icon: 'shopping-bag' },
      { label: 'Devortion', url: '/devortion', icon: 'heart' },
    ]),
    menu('Footer Menu 3', [
      { label: 'Prayer', url: '/prayer' },
      { label: 'Worship', url: '/worship' },
      { label: 'Study', url: '/study' },
      { label: 'Cells', url: '/cells' },
      { label: 'Giving', url: '/giving' },
    ]),
  ];
}

function normalizeNavigationMenu(
  menu: Record<string, any>,
  fallbackWebsiteId: string,
) {
  return {
    id: String(menu.id || `nav-${cleanSubdomain(menu.name) || makeId('nav')}`),
    websiteId: String(menu.websiteId || fallbackWebsiteId),
    name: String(menu.name || 'Navigation Menu'),
    items: normalizeNavigationItems(menu.items),
    isActive: menu.isActive == null ? true : Boolean(menu.isActive),
    updatedAt: String(menu.updatedAt || new Date().toISOString()),
  };
}

async function readTenantNavigationMenus(
  env: Env,
  context: ReturnType<typeof getRequestContext>,
  website = makeWebsiteForContext(context),
) {
  const defaults = defaultTenantNavigationMenus(website.id);
  const raw = await env.CHURCHOS_TENANTS?.get(tenantNavigationStateKey(context.tenant.id));
  const stored = parseStoredJson<Record<string, any>[]>(raw, []);
  const byName = new Map(defaults.map((menu) => [menu.name.toLowerCase(), menu]));

  if (Array.isArray(stored)) {
    stored.forEach((menu) => {
      const normalized = normalizeNavigationMenu(menu, website.id);
      byName.set(normalized.name.toLowerCase(), normalized);
    });
  }

  return Array.from(byName.values()).map((menu) => normalizeNavigationMenu(menu, website.id));
}

async function writeTenantNavigationMenus(
  env: Env,
  context: ReturnType<typeof getRequestContext>,
  menus: Array<Record<string, any>>,
) {
  await env.CHURCHOS_TENANTS?.put(tenantNavigationStateKey(context.tenant.id), JSON.stringify(menus));
}

function makeGlobalContentForContext(context: ReturnType<typeof getRequestContext>) {
  const profile = getStep(context, 'profile');
  const logo = getStep(context, 'logo');
  const website = getStep(context, 'website');
  const phone = [profile.phoneCode, profile.phone].filter(Boolean).join(' ').trim() || profile.phone;
  const globalContent = createEcclesiaGlobalContent(context.tenant.name);
  return {
    ...globalContent,
    churchIdentity: {
      ...globalContent.churchIdentity,
      churchName: context.tenant.name,
      logoUrl: logo.logoUrl || logo.logo || globalContent.churchIdentity.logoUrl,
      faviconUrl: logo.faviconUrl || logo.favicon || globalContent.churchIdentity.faviconUrl,
      tagline: website.homepageTitle || globalContent.churchIdentity.tagline,
      description: website.homepageSubtitle || globalContent.churchIdentity.description,
    },
    contact: {
      ...globalContent.contact,
      phone: phone || globalContent.contact.phone,
      email: profile.publicEmail || profile.email || globalContent.contact.email,
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

function mergeBrandingBodyIntoSteps(
  steps: Record<string, any>,
  body: Record<string, unknown>,
) {
  const nextSteps = {
    ...steps,
    profile: { ...(steps.profile || {}) },
    logo: { ...(steps.logo || {}) },
    website: { ...(steps.website || {}) },
  };

  if (body.address != null) nextSteps.profile.address = body.address;
  if (body.venueAddress != null) nextSteps.profile.venueAddress = body.venueAddress;
  if (body.isVenueDifferent != null) nextSteps.profile.isVenueDifferent = Boolean(body.isVenueDifferent);
  if (body.phone != null) nextSteps.profile.phone = body.phone;
  if (body.phoneCode != null) nextSteps.profile.phoneCode = body.phoneCode;
  if (body.email != null) nextSteps.profile.email = body.email;
  if (body.publicEmail != null) nextSteps.profile.publicEmail = body.publicEmail;
  if (body.timezone != null) nextSteps.profile.timezone = body.timezone;
  if (Array.isArray(body.serviceTimes)) nextSteps.profile.serviceTimes = body.serviceTimes;

  if (body.logo != null) nextSteps.logo.logoUrl = body.logo;
  if (body.logoUrl != null) nextSteps.logo.logoUrl = body.logoUrl;
  if (body.darkLogo != null) nextSteps.logo.darkLogoUrl = body.darkLogo;
  if (body.darkLogoUrl != null) nextSteps.logo.darkLogoUrl = body.darkLogoUrl;
  if (body.favicon != null) nextSteps.logo.faviconUrl = body.favicon;
  if (body.faviconUrl != null) nextSteps.logo.faviconUrl = body.faviconUrl;

  if (body.description != null) nextSteps.website.homepageSubtitle = body.description;
  if (body.homepageSubtitle != null) nextSteps.website.homepageSubtitle = body.homepageSubtitle;
  if (body.tagline != null) nextSteps.website.homepageTitle = body.tagline;
  if (body.homepageTitle != null) nextSteps.website.homepageTitle = body.homepageTitle;
  if (body.aboutText != null) nextSteps.website.aboutText = body.aboutText;

  return nextSteps;
}

async function persistTenantSteps(
  env: Env,
  tenant: Record<string, any>,
  steps: Record<string, any>,
  extra: Record<string, any> = {},
) {
  if (!tenant.subdomain) return tenant;
  return writeRegisteredTenant(env, {
    ...tenant,
    ...extra,
    steps,
  });
}

function findNavigationMenuItems(navigationMenus: Array<Record<string, any>>, name: string) {
  const menu = navigationMenus.find((item) => item.name?.toLowerCase() === name.toLowerCase());
  return normalizeNavigationItems(menu?.items);
}

function makeSiteContextForContext(
  context: ReturnType<typeof getRequestContext>,
  theme = makeThemeForContext(context),
  navigationMenus: Array<Record<string, any>> = defaultTenantNavigationMenus(makeWebsiteForContext(context, theme).id),
) {
  const headerItems = findNavigationMenuItems(navigationMenus, 'Header Menu');
  const footerItems = [
    ...findNavigationMenuItems(navigationMenus, 'Footer Menu 1'),
    ...findNavigationMenuItems(navigationMenus, 'Footer Menu 2'),
    ...findNavigationMenuItems(navigationMenus, 'Footer Menu 3'),
  ];

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
      'giving-donations',
      'member-crm',
      'members',
      'church-services',
      'events',
      'prayer',
      'media',
      'media-sermons',
      'podcast',
      'library',
      'digital-library-resource-center',
      'lms',
      'lms-discipleship-training',
      'blog',
      'dynamic-blog-publishing-engine',
      'worship',
      'cell-fellowship',
      'groups',
      'cell-groups',
      'store',
      'children',
      'forms',
      'bookings',
      'salvation',
      'salvation-new-believer-journey',
    ].map((moduleKey) => ({ moduleKey, enabled: true })),
    navigation: {
      id: `nav-${context.tenant.subdomain}`,
      items: headerItems.length ? headerItems : createEcclesiaNavigationItems(),
    },
    footer: {
      id: `footer-${context.tenant.subdomain}`,
      copyrightText: `Copyright ${new Date().getFullYear()} ${context.tenant.name}`,
      socialLinks: [],
      secondaryLinks: footerItems.length ? footerItems : createEcclesiaFooterLinks(),
    },
    navigationMenus,
    collections: getTenantDashboardCollections(context),
    announcement: {
      id: `announcement-${context.tenant.subdomain}`,
      isActive: false,
      text: '',
    },
    enabledPlugins: [],
    pluginSettings: {},
  };
}

function makeRenderForContext(
  context: ReturnType<typeof getRequestContext>,
  slug = '',
  theme = makeThemeForContext(context),
  website = makeWebsiteForContext(context, theme),
  pages = makePagesForContext(context, website),
  navigationMenus: Array<Record<string, any>> = defaultTenantNavigationMenus(website.id),
) {
  const normalizedSlug = String(slug || '').replace(/^\/+/, '');
  const page = findDemoPage(normalizedSlug, pages);
  const siteContext = makeSiteContextForContext(context, theme, navigationMenus);
  const contentBlocks = parseStoredJson<JsonValue>(page.content, []);
  return {
    pageId: page.id,
    title: page.title,
    slug: page.slug,
    isHome: page.isHome,
    contentBlocks: Array.isArray(contentBlocks) ? contentBlocks : [],
    isPreview: false,
    seoTitle: page.seoTitle || `${context.tenant.name} | ${page.title}`,
    seoDescription: page.seoDescription || website.description,
    seoKeywords: page.seoKeywords || null,
    globalContent: makeGlobalContentForContext(context),
    navigation: siteContext.navigation,
    footer: siteContext.footer,
    navigationMenus,
    collections: getTenantDashboardCollections(context),
    theme: {
      name: siteContext.theme.name,
      settings: siteContext.theme.settings,
    },
  };
}

function makeTenantFromBody(body: Record<string, unknown>) {
  const subdomain = cleanSubdomain(body.subdomain);
  const plan = String(body.plan || defaultTenantValues.plan);
  return {
    ...defaultTenantValues,
    id: `tenant-${subdomain}`,
    name: String(body.name || body.churchName || `${titleFromSubdomain(subdomain)} Church`),
    subdomain,
    subdomainHost: makeSubdomainHost(subdomain),
    plan,
    country: String(body.country || defaultTenantValues.country),
    city: String(body.city || defaultTenantValues.city),
    status: 'active',
    onboardingStatus: 'in_progress',
  };
}

function makeSessionToken(tenantId: string, userId: string) {
  const encoded = btoa(`${tenantId}:${userId}:${Date.now()}`);
  return `churchos-session-${encoded.replace(/=+$/g, '')}`;
}

function isDemoShowcaseContext(context: ReturnType<typeof getRequestContext>) {
  return context.tenant.id === demoTenant.id || cleanSubdomain(context.tenant.subdomain) === demoTenant.subdomain;
}

function createDemoDashboardCollections() {
  const now = '2026-06-30T10:00:00.000Z';
  return {
    media: [
      {
        id: 'media-sunday-worship-recap',
        slug: 'sunday-worship-recap',
        title: 'Sunday Worship Recap',
        type: 'Video',
        duration: '18 min',
        publishedAt: 'Jun 28, 2026',
        speaker: 'Media Team',
        description: 'Highlights from worship, testimonies, and the Word during our latest Sunday service.',
        videoUrl: 'https://example.com/demo/sunday-worship-recap.mp4',
      },
      {
        id: 'media-prayer-audio',
        slug: 'midweek-prayer-audio',
        title: 'Midweek Prayer Audio',
        type: 'Audio',
        duration: '42 min',
        publishedAt: 'Jun 25, 2026',
        speaker: 'Prayer Team',
        description: 'A focused prayer session for families, leaders, and city outreach.',
        audioUrl: 'https://example.com/demo/midweek-prayer-audio.mp3',
      },
    ],
    sermons: [
      {
        id: 'sermon-faith-that-builds',
        slug: 'faith-that-builds',
        title: 'Faith That Builds',
        speaker: 'Pastor Daniel Stone',
        series: 'Kingdom Foundations',
        duration: '48 min',
        publishedAt: 'Jun 23, 2026',
        description: 'A message on building a resilient life of faith, service, and obedience.',
        videoUrl: 'https://example.com/demo/faith-that-builds.mp4',
      },
      {
        id: 'sermon-light-in-the-city',
        slug: 'light-in-the-city',
        title: 'Light in the City',
        speaker: 'Pastor Miriam Cole',
        series: 'Witness',
        duration: '39 min',
        publishedAt: 'Jun 16, 2026',
        description: 'A teaching on evangelism, compassion, and becoming visible hope in the city.',
        audioUrl: 'https://example.com/demo/light-in-the-city.mp3',
      },
    ],
    services: [
      {
        id: 'service-sunday-celebration',
        slug: 'sunday-celebration',
        title: 'Sunday Celebration Service',
        date: 'Every Sunday',
        location: 'Main Auditorium',
        duration: '9:30 AM',
        description: 'Worship, the Word, prayer, children ministry, and fellowship for the whole family.',
      },
      {
        id: 'service-midweek-word-prayer',
        slug: 'midweek-word-prayer',
        title: 'Midweek Word & Prayer',
        date: 'Every Wednesday',
        location: 'Online and Prayer Hall',
        duration: '7:00 PM',
        description: 'A focused midweek gathering for teaching, intercession, and spiritual growth.',
      },
    ],
    resources: [
      {
        id: 'resource-new-believers-guide',
        slug: 'new-believers-guide',
        title: 'New Believers Guide',
        type: 'PDF',
        publishedAt: 'Jun 20, 2026',
        description: 'A starter guide for salvation, prayer, Bible reading, and next steps in church life.',
        downloadUrl: 'https://example.com/demo/new-believers-guide.pdf',
      },
      {
        id: 'resource-cell-leader-toolkit',
        slug: 'cell-leader-toolkit',
        title: 'Cell Leader Toolkit',
        type: 'Toolkit',
        publishedAt: 'Jun 14, 2026',
        description: 'Meeting agenda, follow-up checklist, and discussion prompts for cell leaders.',
        downloadUrl: 'https://example.com/demo/cell-leader-toolkit.pdf',
      },
    ],
    articles: [
      {
        id: 'article-growing-in-prayer',
        slug: 'growing-in-prayer',
        title: 'Growing in Prayer This Month',
        author: 'Pastoral Team',
        publishedAt: 'Jun 29, 2026',
        excerpt: 'Simple rhythms to help members build a consistent prayer life and pray with confidence.',
        content: 'Simple rhythms to help members build a consistent prayer life and pray with confidence.',
      },
      {
        id: 'article-serving-with-joy',
        slug: 'serving-with-joy',
        title: 'Serving With Joy',
        author: 'Volunteer Team',
        publishedAt: 'Jun 21, 2026',
        excerpt: 'A short encouragement for every volunteer carrying ministry with excellence and love.',
        content: 'A short encouragement for every volunteer carrying ministry with excellence and love.',
      },
    ],
    courses: [
      {
        id: 'course-foundations',
        slug: 'foundations-of-faith',
        title: 'Foundations of Faith',
        instructor: 'Discipleship School',
        duration: '4 weeks',
        description: 'A beginner-friendly discipleship course covering salvation, prayer, the Word, and service.',
        modules: [
          {
            title: 'New Life in Christ',
            description: 'Identity, assurance, and the gift of salvation.',
            lessons: [{ title: 'Assurance of Salvation' }, { title: 'Your New Identity' }],
            quizzes: [{ title: 'Foundations Quiz 1' }],
          },
          {
            title: 'Prayer and the Word',
            description: 'Building daily spiritual habits.',
            lessons: [{ title: 'How to Pray' }, { title: 'How to Study Scripture' }],
            quizzes: [{ title: 'Foundations Quiz 2' }],
          },
        ],
      },
      {
        id: 'course-leadership',
        slug: 'cell-leadership-basics',
        title: 'Cell Leadership Basics',
        instructor: 'Growth Track',
        duration: '3 weeks',
        description: 'Practical training for hosting, shepherding, and multiplying healthy cell groups.',
        modules: [
          {
            title: 'Shepherding People',
            description: 'Care, follow-up, and pastoral sensitivity.',
            lessons: [{ title: 'Leading Conversations' }, { title: 'Follow-up Systems' }],
            quizzes: [{ title: 'Care Quiz' }],
          },
        ],
      },
    ],
    podcasts: [
      {
        id: 'podcast-family-table',
        slug: 'family-table-prayer',
        title: 'Family Table: Prayer at Home',
        host: 'Grace & Home Podcast',
        duration: '31 min',
        publishedAt: 'Jun 27, 2026',
        description: 'A practical conversation about leading prayer rhythms with children and young adults.',
        audioUrl: 'https://example.com/demo/family-table-prayer.mp3',
      },
      {
        id: 'podcast-serving-teams',
        slug: 'healthy-serving-teams',
        title: 'Healthy Serving Teams',
        host: 'Ministry Lab',
        duration: '26 min',
        publishedAt: 'Jun 18, 2026',
        description: 'How ministry teams can serve with clarity, rest, and spiritual focus.',
        audioUrl: 'https://example.com/demo/healthy-serving-teams.mp3',
      },
    ],
    products: [
      {
        id: 'product-prayer-journal',
        slug: 'prayer-journal',
        title: 'Prayer Journal',
        price: '$14.00',
        type: 'Book',
        description: 'A guided journal for prayer requests, testimonies, scriptures, and weekly reflections.',
      },
      {
        id: 'product-discipleship-workbook',
        slug: 'discipleship-workbook',
        title: 'Discipleship Workbook',
        price: '$22.00',
        type: 'Workbook',
        description: 'Companion workbook for the Foundations of Faith course.',
      },
    ],
    events: [
      {
        id: 'event-youth-night',
        slug: 'youth-night',
        title: 'Youth Night',
        startDate: 'Jul 12, 2026',
        location: 'Youth Hall',
        price: 'Free',
        description: 'Worship, games, teaching, and small groups for teenagers and young adults.',
      },
      {
        id: 'event-leaders-retreat',
        slug: 'leaders-retreat',
        title: 'Leaders Retreat',
        startDate: 'Aug 02, 2026',
        location: 'Retreat Center',
        price: '$45.00',
        description: 'A one-day training and refreshing retreat for cell leaders, workers, and ministry heads.',
      },
    ],
    updatedAt: now,
  };
}

function getTenantDashboardCollections(context: ReturnType<typeof getRequestContext>) {
  if (!isDemoShowcaseContext(context)) {
    return {
      media: [],
      sermons: [],
      services: [],
      resources: [],
      articles: [],
      courses: [],
      podcasts: [],
      products: [],
      events: [],
    };
  }
  return createDemoDashboardCollections();
}

function normalizeEmail(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function makeMemberAccount(context: ReturnType<typeof getRequestContext>, body: Record<string, any>) {
  const email = normalizeEmail(body.email);
  const firstName = String(body.firstName || 'Member').trim() || 'Member';
  const lastName = String(body.lastName || 'Account').trim() || 'Account';
  const now = new Date().toISOString();
  return {
    id: String(body.id || `account-${cleanSubdomain(email) || makeId('member')}`),
    user: {
      id: String(body.userId || `user-${cleanSubdomain(email) || makeId('member')}`),
      email,
      member: {
        id: String(body.memberId || `member-${cleanSubdomain(email) || makeId('member')}`),
        firstName,
        lastName,
      },
    },
    password: String(body.password || ''),
    member: {
      id: String(body.memberId || `member-${cleanSubdomain(email) || makeId('member')}`),
      tenantId: context.tenant.id,
      userId: String(body.userId || `user-${cleanSubdomain(email) || makeId('member')}`),
      firstName,
      lastName,
      email,
      phone: String(body.phone || ''),
      birthday: body.birthday || null,
      address: String(body.address || ''),
      membershipStatus: String(body.membershipStatus || 'member'),
      createdAt: String(body.createdAt || now),
      notificationPref: {
        preferEmail: true,
        preferSms: Boolean(body.phone),
        preferPush: true,
        preferWhatsapp: false,
      },
      groupMemberships: body.groupMemberships || [],
      lmsEnrollments: body.lmsEnrollments || [],
      eventRegistrations: body.eventRegistrations || [],
      checkIns: body.checkIns || [],
    },
    giving: body.giving || {
      donations: [],
      partnerships: [],
      recurringGivings: [],
      recurringPartnerships: [],
      totalGiven: 0,
    },
    settings: body.settings || {
      memberPortalEnabled: true,
      allowPublicRegistration: true,
      showGivingHistory: true,
      showGroupMemberships: true,
      showCourseProgress: true,
      showAttendanceHistory: true,
      showEventRegistrations: true,
      memberOnlyContent: true,
    },
  };
}

function demoMemberAccount(context: ReturnType<typeof getRequestContext>) {
  return makeMemberAccount(context, {
    id: 'account-demo-member',
    userId: 'user-demo-member',
    memberId: 'member-demo-profile',
    firstName: 'Demo',
    lastName: 'Member',
    email: 'demo@churched.online',
    password: 'Pass1234',
    phone: '+1 555 010 2026',
    birthday: '1994-10-14T00:00:00.000Z',
    address: '101 Fellowship Way, Demo City',
    membershipStatus: 'Cell Leader',
    createdAt: '2026-06-17T00:00:00.000Z',
    groupMemberships: [
      { id: 'group-membership-youth', role: 'Leader', joinedAt: '2026-06-17T00:00:00.000Z', group: { name: 'Young Adults Cell' } },
      { id: 'group-membership-outreach', role: 'Member', joinedAt: '2026-06-20T00:00:00.000Z', group: { name: 'Outreach Team' } },
    ],
    lmsEnrollments: [
      { id: 'enrollment-foundations', status: 'active', progressPercent: 62, course: { title: 'Foundations of Faith' } },
      { id: 'enrollment-leadership', status: 'active', progressPercent: 35, course: { title: 'Cell Leadership Basics' } },
    ],
    eventRegistrations: [
      { id: 'registration-youth-night', paymentStatus: 'confirmed', createdAt: '2026-06-26T00:00:00.000Z', event: { title: 'Youth Night', startDate: '2026-07-12T18:00:00.000Z' } },
    ],
    checkIns: [
      { id: 'checkin-sunday', type: 'Sunday Service', targetId: 'Main Auditorium', checkedInAt: '2026-06-28T09:20:00.000Z' },
      { id: 'checkin-midweek', type: 'Midweek Word & Prayer', targetId: 'Prayer Hall', checkedInAt: '2026-06-25T18:55:00.000Z' },
    ],
    giving: {
      donations: [
        { id: 'giving-tithe-june', amount: 150, currency: 'USD', status: 'success', createdAt: '2026-06-28T00:00:00.000Z', category: { name: 'Weekly Tithes' } },
        { id: 'giving-missions-june', amount: 400, currency: 'USD', status: 'success', createdAt: '2026-06-15T00:00:00.000Z', category: { name: 'Missions Fund' } },
      ],
      partnerships: [
        { id: 'partnership-building', amount: 250, currency: 'USD', status: 'success', createdAt: '2026-06-10T00:00:00.000Z', category: { name: 'Building Fund' } },
      ],
      recurringGivings: [],
      recurringPartnerships: [],
      totalGiven: 800,
    },
  });
}

async function readTenantMemberAccounts(env: Env, context: ReturnType<typeof getRequestContext>) {
  const raw = await env.CHURCHOS_TENANTS?.get(tenantMembersStateKey(context.tenant.id));
  const stored = parseStoredJson<Record<string, any>[]>(raw, []);
  const accounts = Array.isArray(stored) ? stored : [];
  if (!isDemoShowcaseContext(context)) return accounts;

  const hasDemo = accounts.some((account) => normalizeEmail(account?.user?.email || account?.member?.email) === 'demo@churched.online');
  return hasDemo ? accounts : [demoMemberAccount(context), ...accounts];
}

async function writeTenantMemberAccounts(env: Env, context: ReturnType<typeof getRequestContext>, accounts: Record<string, any>[]) {
  await env.CHURCHOS_TENANTS?.put(tenantMembersStateKey(context.tenant.id), JSON.stringify(accounts));
}

function makeMemberSessionToken(tenantId: string, userId: string) {
  return makeSessionToken(tenantId, userId);
}

function userIdFromSessionToken(token: string) {
  const clean = String(token || '').replace(/^Bearer\s+/i, '').replace(/^churchos-session-/, '');
  if (!clean) return '';
  try {
    const padded = clean.padEnd(Math.ceil(clean.length / 4) * 4, '=');
    const decoded = atob(padded);
    return decoded.split(':')[1] || '';
  } catch {
    return '';
  }
}

async function findMemberAccountFromRequest(env: Env, context: ReturnType<typeof getRequestContext>, request: Request) {
  const token = request.headers.get('authorization') || '';
  const userId = userIdFromSessionToken(token);
  if (!userId) return null;
  const accounts = await readTenantMemberAccounts(env, context);
  return accounts.find((account) => account?.user?.id === userId || account?.member?.userId === userId) || null;
}

function collectionResponse(pathname: string, context: ReturnType<typeof getRequestContext>): JsonValue {
  if (pathname.includes('/users')) return [demoUser];
  if (pathname.includes('/roles')) return demoRoles;
  if (pathname.includes('/invitations')) return [];
  if (pathname.includes('/pages')) return demoPages;
  if (pathname.includes('/websites')) return [demoWebsite] as JsonValue;
  if (pathname.includes('/themes')) return [demoEcclesiaTheme] as JsonValue;
  if (pathname.includes('/assets')) return demoMarketplaceAssets;
  const collections = getTenantDashboardCollections(context);
  if (pathname.includes('/media')) return collections.media as JsonValue;
  if (pathname.includes('/sermons')) return collections.sermons as JsonValue;
  if (pathname.includes('/services')) return collections.services as JsonValue;
  if (pathname.includes('/resources') || pathname.includes('/library')) return collections.resources as JsonValue;
  if (pathname.includes('/articles') || pathname.includes('/blogs') || pathname.includes('/posts')) return collections.articles as JsonValue;
  if (pathname.includes('/podcasts')) return collections.podcasts as JsonValue;
  if (pathname.includes('/products') || pathname.includes('/store')) return collections.products as JsonValue;
  if (pathname.includes('/events')) return collections.events as JsonValue;
  if (pathname.includes('/courses') || pathname.includes('/modules') || pathname.includes('/lessons') || pathname.includes('/quizzes')) return collections.courses as JsonValue;
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
    pathname.includes('/orders') ||
    pathname.includes('/members') ||
    pathname.includes('/contacts') ||
    pathname.includes('/tasks') ||
    pathname.includes('/streams') ||
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

async function routeGet(request: Request, pathname: string, url: URL, env: Env) {
  const hostSubdomain = subdomainFromHost(url.hostname);
  const hostCustomDomain = customDomainFromHost(url.hostname);
  const resolvedHostTenant = hostSubdomain
    ? hostSubdomain === demoTenant.subdomain
      ? demoTenant
      : await readRegisteredTenant(env, hostSubdomain)
    : hostCustomDomain
      ? await readRegisteredTenantByDomain(env, hostCustomDomain)
      : null;
  const resolvedRequestTenant = resolvedHostTenant || await resolveRequestTenant(env, request, url);
  const context = getRequestContext(request, url, {}, (resolvedRequestTenant || {}) as Record<string, any>);
  const tenant = context.tenant;
  const themeState = await readTenantThemeState(env, context);
  const theme = makeThemeForContext(context, themeState);
  const website = makeWebsiteForContext(context, theme);
  const pages = await readTenantPages(env, context, website);
  const navigationMenus = await readTenantNavigationMenus(env, context, website);

  if (pathname === '/health' || pathname === '/api/health') {
    return withJson({
      status: 'ok',
      data: {
        runtime: 'cloudflare-api-worker',
        timestamp: new Date().toISOString(),
      },
    });
  }

  if (pathname === '/api/public/check-subdomain') {
    return withJson({ data: await getSubdomainAvailability(env, url.searchParams.get('subdomain') || url.searchParams.get('host')) });
  }

  if (pathname === '/api/public/resolve-subdomain') {
    const subdomain = cleanSubdomain(url.searchParams.get('subdomain') || hostSubdomain);
    if (subdomain === demoTenant.subdomain) {
      return withJson({
        tenantId: demoTenant.id,
        tenant: demoTenant as unknown as JsonValue,
        data: demoTenant as unknown as JsonValue,
      });
    }
    const resolvedTenant = await readRegisteredTenant(env, subdomain);
    if (!resolvedTenant) {
      return withJson({ error: 'Church workspace not found' }, { status: 404 });
    }
    return withJson({
      tenantId: resolvedTenant.id,
      tenant: resolvedTenant as unknown as JsonValue,
      data: resolvedTenant as unknown as JsonValue,
    });
  }

  if (pathname === '/api/public/resolve-domain') {
    const hostname = cleanCustomDomain(url.searchParams.get('host') || hostCustomDomain);
    const resolvedTenant = await readRegisteredTenantByDomain(env, hostname);
    if (!resolvedTenant) {
      return withJson({ error: 'Church workspace not found' }, { status: 404 });
    }
    return withJson({
      tenantId: resolvedTenant.id,
      tenant: resolvedTenant as unknown as JsonValue,
      data: resolvedTenant as unknown as JsonValue,
    });
  }

  if ((hostSubdomain || hostCustomDomain) && !resolvedHostTenant) {
    return withJson({ error: 'Church website not found' }, { status: 404 });
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
    return withJson({ data: makeSiteContextForContext(context, theme, navigationMenus) as unknown as JsonValue });
  }

  if (pathname === '/api/cms/render') {
    return withJson({ data: makeRenderForContext(context, url.searchParams.get('slug') || '', theme, website, pages, navigationMenus) as unknown as JsonValue });
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
    return withJson({ data: navigationMenus as unknown as JsonValue });
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

  if (pathname === '/api/members/me') {
    const account = await findMemberAccountFromRequest(env, context, request);
    if (!account) {
      return withJson({ error: 'Member session not found' }, { status: 401 });
    }
    return withJson({
      data: {
        member: account.member,
        giving: account.giving,
        settings: account.settings,
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

  return withJson({
    data: collectionResponse(pathname, context),
    meta: { source: 'churchos-api-worker', mock: true },
  });
}

async function routeMutation(request: Request, pathname: string, env: Env) {
  const body = await readBody(request);
  const url = new URL(request.url);
  const resolvedRequestTenant = await resolveRequestTenant(env, request, url, body);
  const context = getRequestContext(request, url, body, (resolvedRequestTenant || {}) as Record<string, any>);
  const tenant = context.tenant;
  const themeState = await readTenantThemeState(env, context);
  const theme = makeThemeForContext(context, themeState);
  const website = makeWebsiteForContext(context, theme);
  const pages = await readTenantPages(env, context, website);
  const navigationMenus = await readTenantNavigationMenus(env, context, website);

  if (pathname === '/api/cms/websites') {
    return withJson({ data: { ...website, ...(body as Record<string, JsonValue>) } as unknown as JsonValue }, { status: 201 });
  }

  if (pathname === '/api/cms/navigation') {
    const incoming = normalizeNavigationMenu(body as Record<string, any>, website.id);
    const index = navigationMenus.findIndex((menu) => (
      String(menu.id || '') === incoming.id ||
      String(menu.name || '').toLowerCase() === incoming.name.toLowerCase()
    ));
    const nextMenus = [...navigationMenus];
    if (index >= 0) {
      nextMenus[index] = {
        ...nextMenus[index],
        ...incoming,
        updatedAt: new Date().toISOString(),
      };
    } else {
      nextMenus.push({
        ...incoming,
        updatedAt: new Date().toISOString(),
      });
    }
    await writeTenantNavigationMenus(env, context, nextMenus);
    return withJson({ data: incoming as unknown as JsonValue }, { status: 201 });
  }

  if (pathname === '/api/cms/pages') {
    const title = String(body.title || 'Untitled page');
    const slug = String(body.slug || '').replace(/^\/+/, '');
    const page = normalizeTenantPage(context, website, {
      id: pageIdFromSlug(context, slug) || makeId('page'),
      tenantId: tenant.id,
      websiteId: String(body.websiteId || website.id),
      title,
      slug,
      status: String(body.status || 'draft'),
      content: body.content || [],
      draftContent: null,
      isHome: slug === '',
      isPublished: body.status === 'published',
      updatedAt: new Date().toISOString(),
    });
    const existingIndex = pages.findIndex((item) => item.id === page.id || item.slug === page.slug);
    if (existingIndex >= 0) {
      pages[existingIndex] = { ...pages[existingIndex], ...page };
    } else {
      pages.push(page);
    }
    await writeTenantPages(env, context, pages);
    return withJson({ data: page as JsonValue }, { status: 201 });
  }

  if (/^\/api\/cms\/pages\/[^/]+\/draft$/.test(pathname)) {
    const pageId = pathname.split('/').filter(Boolean).at(-2) || pages[0].id;
    const pageIndex = pages.findIndex((page) => page.id === pageId || page.slug === pageId);
    const page = pageIndex >= 0 ? pages[pageIndex] : pages[0];
    const updatedPage = {
      ...page,
      draftContent: stringifyCmsContent(body.draftContent || []),
      updatedAt: new Date().toISOString(),
    };
    pages[pageIndex >= 0 ? pageIndex : 0] = updatedPage;
    await writeTenantPages(env, context, pages);
    return withJson({
      data: updatedPage as unknown as JsonValue,
    });
  }

  if (/^\/api\/cms\/pages\/[^/]+\/publish$/.test(pathname)) {
    const pageId = pathname.split('/').filter(Boolean).at(-2) || pages[0].id;
    const pageIndex = pages.findIndex((page) => page.id === pageId || page.slug === pageId);
    const page = pageIndex >= 0 ? pages[pageIndex] : pages[0];
    const updatedPage = {
      ...page,
      status: 'published',
      isPublished: true,
      content: page.draftContent || page.content,
      draftContent: null,
      updatedAt: new Date().toISOString(),
    };
    pages[pageIndex >= 0 ? pageIndex : 0] = updatedPage;
    await writeTenantPages(env, context, pages);
    return withJson({
      data: updatedPage as unknown as JsonValue,
    });
  }

  if (/^\/api\/cms\/pages\/[^/]+$/.test(pathname)) {
    const pageId = pathname.split('/').filter(Boolean).pop() || pages[0].id;
    const pageIndex = pages.findIndex((page) => page.id === pageId || page.slug === pageId);
    const page = pageIndex >= 0 ? pages[pageIndex] : pages[0];
    const updatedPage = normalizeTenantPage(context, website, {
      ...page,
      ...body,
      id: page.id,
      content: body.content == null ? page.content : body.content,
      draftContent: body.draftContent == null ? page.draftContent : body.draftContent,
      updatedAt: new Date().toISOString(),
    });
    pages[pageIndex >= 0 ? pageIndex : 0] = updatedPage;
    await writeTenantPages(env, context, pages);
    return withJson({
      data: updatedPage as unknown as JsonValue,
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
    const incoming = coerceRecord((body as Record<string, unknown>).settings || body, {});
    const nextState: TenantThemeState = {
      settings: themeState.settings,
      draftSettings: mergeRecords(themeState.draftSettings || themeState.settings, incoming),
      updatedAt: new Date().toISOString(),
    };
    await writeTenantThemeState(env, context, nextState);
    const updatedTheme = makeThemeForContext(context, nextState);
    return withJson({
      data: {
        ...updatedTheme,
        id: pathname.split('/').filter(Boolean).at(-3) || theme.id,
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customization\/(publish|discard|reset)$/.test(pathname)) {
    const action = pathname.split('/').filter(Boolean).pop();
    const nextState: TenantThemeState = {
      settings: themeState.settings,
      draftSettings: themeState.draftSettings,
      updatedAt: new Date().toISOString(),
    };
    if (action === 'publish') {
      nextState.settings = themeState.draftSettings || themeState.settings;
      nextState.draftSettings = null;
    }
    if (action === 'discard') {
      nextState.draftSettings = null;
    }
    if (action === 'reset') {
      nextState.settings = makeDefaultThemeSettingsForContext(context);
      nextState.draftSettings = null;
    }
    await writeTenantThemeState(env, context, nextState);
    const updatedTheme = makeThemeForContext(context, nextState);
    return withJson({
      data: {
        ...updatedTheme,
        id: pathname.split('/').filter(Boolean).at(-3) || theme.id,
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/customize$/.test(pathname)) {
    const incoming = coerceRecord((body as Record<string, unknown>).settings || body, {});
    const nextState: TenantThemeState = {
      settings: mergeRecords(themeState.settings, incoming),
      draftSettings: null,
      updatedAt: new Date().toISOString(),
    };
    await writeTenantThemeState(env, context, nextState);
    const updatedTheme = makeThemeForContext(context, nextState);
    return withJson({
      data: {
        ...updatedTheme,
        id: pathname.split('/').filter(Boolean).at(-2) || theme.id,
      } as JsonValue,
    });
  }

  if (/^\/api\/theme-engine\/themes\/[^/]+\/preview\/customize$/.test(pathname)) {
    const incoming = coerceRecord((body as Record<string, unknown>).settings || body, {});
    return withJson({
      data: {
        themeId: pathname.split('/').filter(Boolean).at(-3) || theme.id,
        settings: mergeRecords(themeState.draftSettings || themeState.settings, incoming),
        isPreview: true,
        staging: true,
      } as JsonValue,
    });
  }

  if (pathname === '/api/public/check-subdomain') {
    const availability = await getSubdomainAvailability(env, body.subdomain || body.host);
    return withJson({ available: availability.available, data: availability as unknown as JsonValue });
  }

  if (pathname === '/api/tenant/branding') {
    const nextTenantName = String(body.churchName || body.name || tenant.name);
    const nextSteps = mergeBrandingBodyIntoSteps(context.steps || {}, body);
    const nextTenant = await persistTenantSteps(env, tenant, nextSteps, {
      name: nextTenantName,
    });
    const nextContext = getRequestContext(request, url, {}, nextTenant as Record<string, any>);
    return withJson({
      data: {
        tenant: {
          ...nextTenant,
          name: nextTenantName,
        },
        branding: {
          ...makeBrandingForContext(nextContext),
          ...(body as Record<string, JsonValue>),
        },
      } as unknown as JsonValue,
    });
  }

  if (pathname === '/api/tenant/domain') {
    const customDomain = String(body.customDomain || '').trim().toLowerCase();
    if (!tenant.subdomain) {
      return withJson({ error: 'Tenant subdomain is required before connecting a custom domain' }, { status: 400 });
    }
    const existingDomainTenant = customDomain ? await readRegisteredTenantByDomain(env, customDomain) : null;
    if (existingDomainTenant && existingDomainTenant.subdomain !== tenant.subdomain) {
      return withJson({ error: 'This custom domain is already connected to another church.' }, { status: 409 });
    }
    await writeRegisteredTenant(env, { ...tenant, customDomain });
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
    const resolvedTenant = await readRegisteredTenant(env, subdomain);
    if (!resolvedTenant) {
      return withJson({ error: 'Church workspace not found' }, { status: 404 });
    }
    return withJson({
      tenantId: resolvedTenant.id,
      tenant: resolvedTenant as unknown as JsonValue,
      data: resolvedTenant as unknown as JsonValue,
    });
  }

  if (pathname === '/api/public/resolve-domain') {
    const hostname = cleanCustomDomain(body.host || body.domain || body.customDomain);
    const resolvedTenant = await readRegisteredTenantByDomain(env, hostname);
    if (!resolvedTenant) {
      return withJson({ error: 'Church workspace not found' }, { status: 404 });
    }
    return withJson({
      tenantId: resolvedTenant.id,
      tenant: resolvedTenant as unknown as JsonValue,
      data: resolvedTenant as unknown as JsonValue,
    });
  }

  if (pathname === '/api/auth/register-tenant') {
    const availability = await getSubdomainAvailability(env, body.subdomain || body.name || body.churchName);
    if (!availability.available) {
      return withJson({
        error: availability.reason === 'reserved'
          ? 'This subdomain is reserved. Please choose another.'
          : availability.reason === 'taken'
            ? 'This subdomain is already assigned to another church.'
            : 'A valid subdomain is required.',
        data: availability as unknown as JsonValue,
      }, { status: 409 });
    }
    body.subdomain = availability.subdomain;
    const tenant = await writeRegisteredTenant(env, makeTenantFromBody(body));
    const ownerName = String(body.ownerName || 'Church Owner');
    const ownerEmail = String(body.ownerEmail || `owner@${tenant.subdomain}.church`);
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

  if (pathname === '/api/auth/member-register') {
    const email = normalizeEmail(body.email);
    const password = String(body.password || '');
    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    if (!email || !password || !firstName || !lastName) {
      return withJson({ error: 'email, password, firstName, lastName are required' }, { status: 400 });
    }
    const accounts = await readTenantMemberAccounts(env, context);
    if (accounts.some((account) => normalizeEmail(account?.user?.email || account?.member?.email) === email)) {
      return withJson({ error: 'Email already registered in this church' }, { status: 409 });
    }
    const account = makeMemberAccount(context, {
      ...body,
      email,
      password,
      firstName,
      lastName,
    });
    await writeTenantMemberAccounts(env, context, [account, ...accounts]);
    const token = makeMemberSessionToken(context.tenant.id, account.user.id);
    return withJson({
      token,
      user: account.user as JsonValue,
      data: {
        token,
        user: account.user,
      } as JsonValue,
    }, { status: 201 });
  }

  if (pathname === '/api/auth/login' || pathname === '/api/super-admin/login') {
    if (pathname === '/api/auth/login') {
      const email = normalizeEmail(body.email);
      const password = String(body.password || '');
      const accounts = await readTenantMemberAccounts(env, context);
      const account = accounts.find((entry) => normalizeEmail(entry?.user?.email || entry?.member?.email) === email);
      if (account) {
        if (String(account.password || '') !== password) {
          return withJson({ error: 'Invalid credentials' }, { status: 401 });
        }
        const token = makeMemberSessionToken(context.tenant.id, account.user.id);
        return withJson({
          token,
          user: account.user as JsonValue,
          data: {
            token,
            user: account.user,
            tenant,
          } as JsonValue,
        });
      }
    }

    const token = makeSessionToken(tenant.id, demoUser.id);
    const user = {
      ...demoUser,
      tenantId: tenant.id,
      email: tenant.subdomain ? `admin@${tenant.subdomain}.${platformDomain}` : 'admin@churched.online',
    };
    return withJson({
      token,
      user: user as JsonValue,
      data: {
        token,
        user,
        tenant,
      },
    });
  }

  if (pathname === '/api/members/me' || pathname === '/api/members/me/preferences') {
    const account = await findMemberAccountFromRequest(env, context, request);
    if (!account) {
      return withJson({ error: 'Member session not found' }, { status: 401 });
    }
    const accounts = await readTenantMemberAccounts(env, context);
    const nextAccounts = accounts.map((entry) => {
      if (entry?.user?.id !== account.user.id) return entry;
      if (pathname.endsWith('/preferences')) {
        return {
          ...entry,
          member: {
            ...entry.member,
            notificationPref: {
              ...(entry.member?.notificationPref || {}),
              ...(body as Record<string, unknown>),
            },
          },
        };
      }
      return {
        ...entry,
        member: {
          ...entry.member,
          firstName: String(body.firstName || entry.member?.firstName || ''),
          lastName: String(body.lastName || entry.member?.lastName || ''),
          email: normalizeEmail(body.email || entry.member?.email || entry.user?.email),
          phone: String(body.phone || entry.member?.phone || ''),
          birthday: body.birthday || entry.member?.birthday || null,
          address: String(body.address || entry.member?.address || ''),
        },
        user: {
          ...entry.user,
          email: normalizeEmail(body.email || entry.user?.email),
          member: {
            ...(entry.user?.member || {}),
            firstName: String(body.firstName || entry.member?.firstName || ''),
            lastName: String(body.lastName || entry.member?.lastName || ''),
          },
        },
      };
    });
    await writeTenantMemberAccounts(env, context, nextAccounts);
    const updated = nextAccounts.find((entry) => entry?.user?.id === account.user.id) || account;
    return withJson({
      data: pathname.endsWith('/preferences')
        ? updated.member.notificationPref as JsonValue
        : updated.member as JsonValue,
    });
  }

  if (pathname.startsWith('/api/onboarding')) {
    const stepKey = pathname.split('/').filter(Boolean).pop() || 'profile';
    const normalizedStepKey = stepKey === 'website-basics' ? 'website' : stepKey;
    const nextSteps = {
      ...(context.steps || {}),
      [normalizedStepKey]: {
        ...getStep(context, normalizedStepKey),
        ...(body as Record<string, unknown>),
      },
    };
    const nextTenant = await persistTenantSteps(env, tenant, nextSteps, {
      onboardingStatus: pathname.endsWith('/complete') ? 'completed' : 'in_progress',
    });
    return withJson({
      ok: true,
      data: {
        id: makeId('onboarding'),
        tenant: nextTenant,
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
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: jsonHeaders });
    }

    const url = new URL(request.url);
    const pathname = url.pathname;

    try {
      if (request.method === 'GET' || request.method === 'HEAD') {
        return routeGet(request, pathname, url, env);
      }
      return routeMutation(request, pathname, env);
    } catch (err) {
      return withJson(
        { error: err instanceof Error ? err.message : 'API request failed' },
        { status: 500 },
      );
    }
  },
};
