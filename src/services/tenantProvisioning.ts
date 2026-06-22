import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { BillingService } from './billing';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
const JWT_SIGNING_SECRET: string = JWT_SECRET;

export const PUBLIC_DOMAIN_SUFFIX = 'churched.online';
export const ONBOARDING_MODULE_KEY = 'onboarding';
export const CHURCH_DETAILS_MODULE_KEY = 'domain-tenant-management';

const RESERVED_SUBDOMAINS = new Set([
  'admin',
  'api',
  'app',
  'assets',
  'central',
  'church',
  'developer',
  'docs',
  'help',
  'marketplace',
  'live',
  'mail',
  'onboarding',
  'start',
  'status',
  'support',
  'super-admin',
  'www',
]);

const CORE_MODULES = [
  // System / Core Modules
  { key: 'website-cms', name: 'CMS & Pages', category: 'Core' },
  { key: 'theme-engine', name: 'Theme Engine', category: 'Core' },
  { key: 'domain-tenant-management', name: 'Church Details', category: 'Core' },
  { key: 'billing-subscription-management', name: 'Billing & Subscription Management', category: 'Admin' },
  { key: 'marketplace', name: 'Marketplace', category: 'Core' },
  { key: 'developer-marketplace', name: 'Developer Marketplace', category: 'Core' },
  { key: 'plugin-extensions-engine', name: 'Plugin Extensions Engine', category: 'Core' },
  
  // Church/Ministry Modules
  { key: 'blog', name: 'Blog', category: 'Core' },
  { key: 'member-crm', name: 'Member Management', category: 'Engagement' },
  { key: 'media', name: 'Media', category: 'Content' },
  { key: 'events', name: 'Events', category: 'Operations' },
  { key: 'cells', name: 'Cells/Fellowships', category: 'Engagement' },
  { key: 'live-meetings', name: 'Live Meetings', category: 'Operations' },
  { key: 'live-chat', name: 'Live Chat Support', category: 'Engagement' },
  { key: 'campaigns', name: 'Campaigns', category: 'Marketing' },
  { key: 'courses', name: 'Courses', category: 'Discipleship' },
  { key: 'resource-library', name: 'Resource Library', category: 'Content' },
  { key: 'devotions', name: 'Devotions', category: 'Discipleship' },
  { key: 'livestream', name: 'Livestream', category: 'Content' },
];

const ESSENTIAL_PERMISSIONS = [
  'tenant.settings',
  'member.create',
  'member.read',
  'member.update',
  'member.delete',
  'user.create',
  'user.read',
  'user.update',
  'user.delete',
  'role.create',
  'role.read',
  'role.update',
  'role.delete',
  'core-website-cms.read',
  'core-website-cms.create',
  'core-website-cms.update',
  'core-website-cms.delete',
  'core-website-cms.manage_settings',
  'core-website-cms.view_reports',
  'theme-engine.read',
  'theme-engine.create',
  'theme-engine.update',
  'theme-engine.delete',
  'theme-engine.manage_settings',
  'theme-engine.view_reports',
  'domain-tenant-management.read',
  'domain-tenant-management.create',
  'domain-tenant-management.update',
  'domain-tenant-management.delete',
  'domain-tenant-management.manage_settings',
  'domain-tenant-management.view_reports',
  'billing-subscription-management.read',
  'billing-subscription-management.create',
  'billing-subscription-management.update',
  'billing-subscription-management.delete',
  'billing-subscription-management.manage_settings',
  'billing-subscription-management.view_reports',
  'developer-marketplace.read',
  'developer-marketplace.create',
  'developer-marketplace.update',
  'developer-marketplace.delete',
  'developer-marketplace.manage_settings',
  'developer-marketplace.view_reports',
  'church-services.read',
  'church-services.create',
  'church-services.update',
  'church-services.delete',
  'church-services.manage_settings',
  'church-services.view_reports',
  'livestream.read',
  'livestream.create',
  'livestream.update',
  'livestream.delete',
  'livestream.manage_settings',
  'livestream.view_reports',
  'salvation-new-believer-journey.read',
  'salvation-new-believer-journey.create',
  'salvation-new-believer-journey.update',
  'salvation-new-believer-journey.delete',
  'salvation-new-believer-journey.manage_settings',
  'salvation-new-believer-journey.view_reports',
];

const DEFAULT_ONBOARDING_STEPS = [
  'profile',
  'logo',
  'modules',
  'website',
  'domain',
  'giving',
  'invite',
  'complete',
];

type RegistrationInput = {
  name?: string;
  churchName?: string;
  subdomain?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string;
  password?: string;
  plan?: string;
  planId?: string;
  trialDays?: number | string;
  country?: string;
  city?: string;
};

type OnboardingSettings = {
  steps: Array<{ stepKey: string; status: string; metadataJson: string }>;
  completedAt?: string | null;
  updatedAt?: string;
};

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function jsonString(value: unknown): string {
  return JSON.stringify(value ?? {});
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }
  return value.trim();
}

function titleFromKey(key: string): string {
  return key.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || 'Church',
    lastName: parts.slice(1).join(' ') || 'Owner',
  };
}

export function normalizeSubdomain(input: unknown, fallbackName?: string): string {
  const raw = typeof input === 'string' && input.trim().length > 0 ? input : fallbackName || '';
  const normalized = raw
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
  return normalized || `church-${Date.now().toString(36)}`;
}

export function subdomainHost(subdomain: string) {
  return `${subdomain}.${PUBLIC_DOMAIN_SUFFIX}`;
}

export function sanitizeTenantPublic(tenant: any) {
  if (!tenant) return null;
  return {
    id: tenant.id,
    name: tenant.name,
    subdomain: tenant.subdomain,
    subdomainHost: subdomainHost(tenant.subdomain),
    customDomain: tenant.customDomain || null,
    status: tenant.status,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
  };
}

async function getPlanFromInput(input: RegistrationInput) {
  await BillingService.ensureDefaultPlans();
  const raw = String(input.planId || input.plan || 'growth').trim().toLowerCase();
  const slug = raw === 'pro' ? 'enterprise' : raw;

  let plan = await prisma.subscriptionPlan.findFirst({
    where: {
      isActive: true,
      OR: [
        { id: raw },
        { slug },
        { name: { equals: slug } },
      ],
    },
  });

  if (!plan) {
    plan = await prisma.subscriptionPlan.findFirst({ where: { slug: 'growth', isActive: true } });
  }

  return plan;
}

function defaultOnboardingSettings(seed: Record<string, any> = {}): OnboardingSettings {
  return {
    updatedAt: new Date().toISOString(),
    completedAt: null,
    steps: DEFAULT_ONBOARDING_STEPS.map((stepKey) => ({
      stepKey,
      status: stepKey === 'profile' && Object.keys(seed).length > 0 ? 'in_progress' : 'pending',
      metadataJson: stepKey === 'profile' ? jsonString(seed) : '{}',
    })),
  };
}

function progressFromSteps(settings: OnboardingSettings) {
  const done = settings.steps.filter((step) => step.status === 'completed' || step.status === 'skipped').length;
  return Math.round((done / DEFAULT_ONBOARDING_STEPS.length) * 100);
}

async function loadOnboardingSettings(tenantId: string): Promise<OnboardingSettings> {
  const record = await prisma.moduleSettings.findUnique({
    where: { tenantId_moduleKey: { tenantId, moduleKey: ONBOARDING_MODULE_KEY } },
  });
  const parsed = parseJson<OnboardingSettings | null>(record?.settings, null);
  if (parsed?.steps?.length) {
    const known = new Map(parsed.steps.map((step) => [step.stepKey, step]));
    return {
      ...parsed,
      steps: DEFAULT_ONBOARDING_STEPS.map((stepKey) => known.get(stepKey) || {
        stepKey,
        status: 'pending',
        metadataJson: '{}',
      }),
    };
  }
  return defaultOnboardingSettings();
}

async function saveOnboardingSettings(tenantId: string, settings: OnboardingSettings) {
  const next = { ...settings, updatedAt: new Date().toISOString() };
  await prisma.moduleSettings.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: ONBOARDING_MODULE_KEY } },
    create: { tenantId, moduleKey: ONBOARDING_MODULE_KEY, settings: jsonString(next) },
    update: { settings: jsonString(next) },
  });
  return next;
}

async function ensureModuleDefinitions(tx: any, moduleKeys: string[]) {
  const known = new Map(CORE_MODULES.map((item) => [item.key, item]));
  for (const moduleKey of Array.from(new Set(moduleKeys))) {
    const meta = known.get(moduleKey);
    await tx.moduleDefinition.upsert({
      where: { key: moduleKey },
      update: meta ? { name: meta.name, category: meta.category, dependencies: '[]' } : {},
      create: {
        key: moduleKey,
        name: meta?.name || titleFromKey(moduleKey),
        category: meta?.category || 'Plan',
        dependencies: '[]',
      },
    });
  }
}

async function ensureOwnerRole(tx: any, tenantId: string) {
  const role = await tx.role.create({
    data: {
      tenantId,
      name: 'Owner',
      description: 'Primary church owner with full tenant administration access',
      isCustom: false,
    },
  });

  const existingPermissions = await tx.permission.findMany();
  const existingNames = new Set(existingPermissions.map((permission: any) => permission.name));

  for (const name of ESSENTIAL_PERMISSIONS) {
    if (!existingNames.has(name)) {
      const permission = await tx.permission.create({
        data: { name, description: `Autogenerated permission for ${name}` },
      });
      existingPermissions.push(permission);
      existingNames.add(name);
    }
  }

  for (const permission of existingPermissions) {
    await tx.rolePermission.create({
      data: { roleId: role.id, permissionId: permission.id },
    });
  }

  return role;
}

export class TenantProvisioningService {
  static async checkSubdomainAvailability(input: unknown) {
    const subdomain = normalizeSubdomain(input);
    const reserved = RESERVED_SUBDOMAINS.has(subdomain);
    const existing = reserved ? null : await prisma.tenant.findUnique({ where: { subdomain } });
    return {
      subdomain,
      host: subdomainHost(subdomain),
      available: !reserved && !existing,
      reason: reserved ? 'reserved' : existing ? 'taken' : null,
      suggestions: !reserved && !existing ? [] : await this.suggestSubdomains(subdomain),
    };
  }

  static async suggestSubdomains(base: string) {
    const clean = normalizeSubdomain(base);
    const candidates = [clean, `${clean}-church`, `${clean}-online`, `${clean}-${new Date().getFullYear()}`]
      .filter((candidate) => !RESERVED_SUBDOMAINS.has(candidate));
    const existing = await prisma.tenant.findMany({
      where: { subdomain: { in: candidates } },
      select: { subdomain: true },
    });
    const taken = new Set(existing.map((item) => item.subdomain));
    return candidates.filter((candidate) => !taken.has(candidate)).slice(0, 3);
  }

  static async resolveSubdomain(input: unknown) {
    const subdomain = normalizeSubdomain(String(input || '').replace(`.${PUBLIC_DOMAIN_SUFFIX}`, ''));
    const tenant = await prisma.tenant.findUnique({ where: { subdomain } });
    if (!tenant) return null;
    return sanitizeTenantPublic(tenant);
  }

  static async resolveCustomDomain(input: unknown) {
    const domain = String(input || '')
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '')
      .replace(/^\.+|\.+$/g, '');
    if (!domain || domain === PUBLIC_DOMAIN_SUFFIX || domain.endsWith(`.${PUBLIC_DOMAIN_SUFFIX}`)) {
      return null;
    }
    const tenant = await prisma.tenant.findFirst({
      where: {
        status: 'active',
        OR: [
          { customDomain: domain },
          { websites: { some: { domain, isActive: true } } },
        ],
      },
    });
    if (!tenant) return null;
    return sanitizeTenantPublic(tenant);
  }

  static async registerTenant(input: RegistrationInput) {
    const name = requireString(input.name || input.churchName, 'church name');
    const ownerEmail = requireString(input.ownerEmail, 'owner email').toLowerCase();
    const password = requireString(input.ownerPassword || input.password, 'owner password');
    const ownerName = requireString(input.ownerName || 'Church Owner', 'owner name');
    const subdomain = normalizeSubdomain(input.subdomain, name);

    if (RESERVED_SUBDOMAINS.has(subdomain)) {
      const error: any = new Error('This subdomain is reserved. Please choose another.');
      error.status = 409;
      error.details = await this.suggestSubdomains(subdomain);
      throw error;
    }

    const duplicate = await prisma.tenant.findUnique({ where: { subdomain } });
    if (duplicate) {
      const error: any = new Error('This subdomain is already assigned to another church.');
      error.status = 409;
      error.details = await this.suggestSubdomains(subdomain);
      throw error;
    }

    const plan = await getPlanFromInput(input);
    if (!plan) {
      throw new Error('No active subscription plans are configured.');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const ownerParts = splitName(ownerName);
    const trialDays = Number(input.trialDays || 14);
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const trialEndsAt = trialDays > 0 ? new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000) : null;
    const planModuleKeys = parseJson<string[]>(plan.modulesJson, []);
    const coreModuleKeys = CORE_MODULES.map((item) => item.key);
    const activeModuleKeys = Array.from(new Set([...coreModuleKeys, ...planModuleKeys]));
    const brandingSeed = {
      country: input.country || '',
      city: input.city || '',
      publicEmail: ownerEmail,
      email: ownerEmail,
      timezone: 'UTC',
      address: '',
      phone: '',
      subdomainHost: subdomainHost(subdomain),
      plan: plan.slug || plan.name,
    };

    const result = await prisma.$transaction(async (tx) => {
      await ensureModuleDefinitions(tx, activeModuleKeys);

      const tenant = await tx.tenant.create({
        data: { name, subdomain, status: 'active' },
      });

      const theme = await tx.theme.create({
        data: {
          tenantId: tenant.id,
          name: 'Ecclesia',
          isCustom: false,
          settings: jsonString({
            sourcePackage: 'ecclesia-full-theme',
            colorMode: 'light',
            accentPreset: 'orange',
          }),
        },
      });

      const website = await tx.website.create({
        data: {
          tenantId: tenant.id,
          themeId: theme.id,
          title: name,
          description: `${name} church website`,
          domain: subdomainHost(subdomain),
          isActive: true,
        },
      });

      await tx.page.create({
        data: {
          tenantId: tenant.id,
          websiteId: website.id,
          slug: '',
          title: 'Home',
          status: 'published',
          isHome: true,
          seoTitle: `${name} | Home`,
          seoDescription: `${name} on ${PUBLIC_DOMAIN_SUFFIX}`,
          content: jsonString([
            {
              type: 'hero',
              title: name,
              subtitle: 'Welcome to our church community.',
              buttonText: 'Plan a Visit',
              buttonUrl: '/visit',
            },
          ]),
        },
      });

      await tx.navigationMenu.create({
        data: {
          tenantId: tenant.id,
          websiteId: website.id,
          name: 'Header',
          items: jsonString([
            { label: 'Home', url: '/' },
            { label: 'About', url: '/about' },
            { label: 'Services', url: '/services' },
            { label: 'Watch Live', url: '/livestream' },
            { label: 'Give', url: '/giving' },
            { label: 'Account', url: '/account' },
          ]),
        },
      });

      await tx.cmsFooter.create({
        data: {
          tenantId: tenant.id,
          websiteId: website.id,
          copyrightText: `© ${new Date().getFullYear()} ${name}`,
          socialLinks: '[]',
          secondaryLinks: '[]',
        },
      });

      const ownerRole = await ensureOwnerRole(tx, tenant.id);
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: ownerEmail,
          passwordHash,
          status: 'active',
        },
      });

      const member = await tx.member.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          firstName: ownerParts.firstName,
          lastName: ownerParts.lastName,
          email: ownerEmail,
          membershipStatus: 'leader',
        },
      });

      await tx.userRole.create({ data: { userId: user.id, roleId: ownerRole.id } });

      for (const moduleKey of activeModuleKeys) {
        await tx.tenantModule.upsert({
          where: { tenantId_moduleKey: { tenantId: tenant.id, moduleKey } },
          update: { status: 'active' },
          create: {
            tenantId: tenant.id,
            moduleKey,
            status: 'active',
            billingRule: planModuleKeys.includes(moduleKey) ? 'plan_included' : 'free',
          },
        });
      }

      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: trialEndsAt ? 'trialing' : 'active',
          provider: 'internal',
          providerMode: 'platform_managed',
          trialEndsAt,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      await tx.moduleSettings.create({
        data: {
          tenantId: tenant.id,
          moduleKey: CHURCH_DETAILS_MODULE_KEY,
          settings: jsonString(brandingSeed),
        },
      });

      const livestreamPublicSettings = {
        enabled: true,
        adminPreviewOnly: false,
        publicPublishingEnabled: true,
        providerMode: 'hybrid',
        chatEnabled: true,
        replayAutoArchive: true,
        givingButtonEnabled: true,
        prayerRequestEnabled: true,
        salvationResponseEnabled: true,
        biblePanelEnabled: true,
        notesPanelEnabled: true,
        serviceMomentCtas: [
          {
            id: 'welcome',
            title: 'First Time Here?',
            summary: 'Tell us you are worshipping with us and a host can help you take the next step.',
            details: 'Use this card to route first-time guests toward a welcome form, connection card, or membership path during the livestream.',
            buttonLabel: 'Connect With Us',
            buttonUrl: '/account',
            theme: 'sunrise',
            enabled: true,
          },
          {
            id: 'prayer',
            title: 'Need Prayer?',
            summary: 'Share a prayer request with the ministry team while service is in progress.',
            details: 'Prayer requests submitted from the livestream are captured as broadcast interactions for follow-up.',
            buttonLabel: 'Open Prayer',
            buttonUrl: '#prayer',
            theme: 'ocean',
            enabled: true,
          },
          {
            id: 'giving',
            title: 'Give During Service',
            summary: 'Honor God with your giving through the secure church giving page.',
            details: 'Giving clicks are tracked as livestream interactions so admins can understand service engagement.',
            buttonLabel: 'Give Now',
            buttonUrl: '/giving',
            theme: 'rose',
            enabled: true,
          },
          {
            id: 'notes',
            title: 'Capture The Word',
            summary: 'Open the Bible and notes panel to keep scriptures and sermon points together.',
            details: 'Viewers can search the KJV Bible, copy selected verses, and save personal notes locally.',
            buttonLabel: 'Open Notes',
            buttonUrl: '#notes',
            theme: 'forest',
            enabled: true,
          },
        ],
        analyticsTrackingEnabled: true,
        autoAttachToServices: true,
        defaultVisibility: 'public',
      };

      await tx.livestreamModuleSettings.create({
        data: {
          tenantId: tenant.id,
          moduleKey: 'livestream',
          enabled: true,
          billingPlan: 'free',
          providerMode: 'hybrid',
          configJson: jsonString(livestreamPublicSettings),
        },
      });

      await tx.moduleSettings.create({
        data: {
          tenantId: tenant.id,
          moduleKey: 'livestream',
          settings: jsonString(livestreamPublicSettings),
        },
      });

      await tx.moduleSettings.create({
        data: {
          tenantId: tenant.id,
          moduleKey: ONBOARDING_MODULE_KEY,
          settings: jsonString(defaultOnboardingSettings({
            churchName: name,
            ownerName,
            ownerEmail,
            country: input.country || '',
            city: input.city || '',
            plan: plan.slug || plan.name,
            subdomain,
            subdomainHost: subdomainHost(subdomain),
          })),
        },
      });

      await tx.domainTenantManagementModuleActivity.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          actionType: 'tenant_registered',
          metadataJson: jsonString({ source: 'registration', subdomain, planId: plan.id }),
        },
      });

      return { tenant, user, member, website };
    });

    const token = jwt.sign(
      { userId: result.user.id, tenantId: result.tenant.id, email: result.user.email },
      JWT_SIGNING_SECRET,
      { expiresIn: '24h' },
    );

    return {
      token,
      tenant: sanitizeTenantPublic(result.tenant),
      user: {
        id: result.user.id,
        email: result.user.email,
        member: {
          id: result.member.id,
          firstName: result.member.firstName,
          lastName: result.member.lastName,
        },
      },
      website: result.website,
      plan,
    };
  }

  static async getOnboarding(tenantId: string) {
    const [tenant, settings, branding, subscription] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      loadOnboardingSettings(tenantId),
      prisma.moduleSettings.findUnique({
        where: { tenantId_moduleKey: { tenantId, moduleKey: CHURCH_DETAILS_MODULE_KEY } },
      }),
      prisma.tenantSubscription.findUnique({
        where: { tenantId },
        include: { plan: true },
      }),
    ]);
    if (!tenant) throw new Error('Tenant not found');

    const brandingData = parseJson<Record<string, any>>(branding?.settings, {});
    return {
      tenant: {
        ...sanitizeTenantPublic(tenant),
        ...brandingData,
      },
      steps: settings.steps,
      progressPercent: progressFromSteps(settings),
      completedAt: settings.completedAt || null,
      plan: subscription?.plan ? {
        id: subscription.plan.id,
        name: subscription.plan.name,
        slug: subscription.plan.slug,
      } : null,
    };
  }

  static async updateOnboardingStep(tenantId: string, stepKey: string, metadata: Record<string, any>, userId?: string | null) {
    const settings = await loadOnboardingSettings(tenantId);
    const step = settings.steps.find((item) => item.stepKey === stepKey);
    if (!step) {
      const error: any = new Error('Unknown onboarding step');
      error.status = 404;
      throw error;
    }

    const existing = parseJson<Record<string, any>>(step.metadataJson, {});
    const nextMetadata = { ...existing, ...metadata, updatedAt: new Date().toISOString() };
    step.status = 'completed';
    step.metadataJson = jsonString(nextMetadata);

    await this.applyOnboardingSideEffects(tenantId, stepKey, nextMetadata, userId || null);
    const nextSettings = await saveOnboardingSettings(tenantId, settings);

    await prisma.domainTenantManagementModuleActivity.create({
      data: {
        tenantId,
        userId: userId || null,
        actionType: `onboarding_${stepKey}`,
        metadataJson: jsonString(nextMetadata),
      },
    }).catch(() => undefined);

    return {
      steps: nextSettings.steps,
      progressPercent: progressFromSteps(nextSettings),
      step,
    };
  }

  static async skipOnboardingStep(tenantId: string, stepKey: string) {
    const settings = await loadOnboardingSettings(tenantId);
    const step = settings.steps.find((item) => item.stepKey === stepKey);
    if (!step) throw new Error('Unknown onboarding step');
    step.status = 'skipped';
    const nextSettings = await saveOnboardingSettings(tenantId, settings);
    return { steps: nextSettings.steps, progressPercent: progressFromSteps(nextSettings), step };
  }

  static async completeOnboarding(tenantId: string, userId?: string | null) {
    const settings = await loadOnboardingSettings(tenantId);
    for (const step of settings.steps) {
      if (step.stepKey === 'complete') {
        step.status = 'completed';
        step.metadataJson = jsonString({ completedAt: new Date().toISOString() });
      }
    }
    settings.completedAt = new Date().toISOString();
    const nextSettings = await saveOnboardingSettings(tenantId, settings);

    await prisma.domainTenantManagementModuleActivity.create({
      data: {
        tenantId,
        userId: userId || null,
        actionType: 'onboarding_complete',
        metadataJson: jsonString({ completedAt: settings.completedAt }),
      },
    }).catch(() => undefined);

    return { steps: nextSettings.steps, progressPercent: progressFromSteps(nextSettings), completedAt: settings.completedAt };
  }

  static async inviteTeamMember(tenantId: string, email: string, roleName: string, userId?: string | null) {
    const cleanEmail = requireString(email, 'email').toLowerCase();
    const roleLabel = requireString(roleName || 'Admin', 'roleName');
    const existing = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: cleanEmail } },
    });
    if (existing) {
      const error: any = new Error('Email already exists in this church tenant');
      error.status = 409;
      throw error;
    }

    const randomPassword = await bcrypt.hash(`invite-${Date.now()}-${cleanEmail}`, 12);
    const result = await prisma.$transaction(async (tx) => {
      let role = await tx.role.findFirst({ where: { tenantId, name: roleLabel } });
      if (!role) {
        role = await tx.role.create({
          data: { tenantId, name: roleLabel, description: `${roleLabel} staff role`, isCustom: true },
        });
      }
      const user = await tx.user.create({
        data: { tenantId, email: cleanEmail, passwordHash: randomPassword, status: 'invited' },
      });
      const nameBits = cleanEmail.split('@')[0].split(/[._-]/);
      await tx.member.create({
        data: {
          tenantId,
          userId: user.id,
          firstName: nameBits[0] || 'Invited',
          lastName: nameBits.slice(1).join(' ') || 'Staff',
          email: cleanEmail,
          membershipStatus: 'visitor',
        },
      });
      await tx.userRole.create({ data: { userId: user.id, roleId: role.id } });
      return user;
    });

    await this.updateOnboardingStep(tenantId, 'invite', { invitedEmail: cleanEmail, roleName: roleLabel }, userId || null);
    return result;
  }

  static async applyOnboardingSideEffects(tenantId: string, stepKey: string, metadata: Record<string, any>, userId: string | null) {
    if (stepKey === 'profile') {
      const phone = [metadata.phoneCode, metadata.phone].filter(Boolean).join(' ').trim();
      
      if (metadata.churchName) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { name: metadata.churchName }
        });
      }

      await this.mergeChurchDetails(tenantId, {
        address: metadata.address || '',
        venueAddress: metadata.venueAddress || '',
        isVenueDifferent: Boolean(metadata.isVenueDifferent),
        phone,
        phoneCode: metadata.phoneCode || '',
        email: metadata.email || '',
        publicEmail: metadata.email || '',
        timezone: metadata.timezone || 'UTC',
        serviceTimes: metadata.serviceTimes || [],
        city: metadata.city || '',
        country: metadata.country || '',
        ownerName: metadata.ownerName || '',
        ownerEmail: metadata.ownerEmail || '',
      });
    }

    if (stepKey === 'logo') {
      await this.mergeChurchDetails(tenantId, {
        logo: metadata.logoUrl || '',
        darkLogo: metadata.darkLogoUrl || '',
        favicon: metadata.faviconUrl || '',
      });
    }

    if (stepKey === 'modules') {
      const keys = Array.isArray(metadata.enabledModuleKeys) ? metadata.enabledModuleKeys : [];
      await ensureModuleDefinitions(prisma as any, keys);
      for (const moduleKey of keys) {
        await prisma.tenantModule.upsert({
          where: { tenantId_moduleKey: { tenantId, moduleKey } },
          create: { tenantId, moduleKey, status: 'active', billingRule: 'free' },
          update: { status: 'active' },
        });
      }
    }

    if (stepKey === 'website') {
      const website = await prisma.website.findFirst({ where: { tenantId, isActive: true } });
      if (website) {
        await prisma.page.upsert({
          where: { websiteId_slug: { websiteId: website.id, slug: '' } },
          create: {
            tenantId,
            websiteId: website.id,
            slug: '',
            title: metadata.homepageTitle || 'Home',
            status: 'published',
            isHome: true,
            seoTitle: metadata.homepageTitle || website.title,
            seoDescription: metadata.homepageSubtitle || website.description || '',
            content: jsonString([
              {
                type: 'hero',
                title: metadata.homepageTitle || website.title,
                subtitle: metadata.homepageSubtitle || '',
                aboutText: metadata.aboutText || '',
                buttonText: metadata.primaryCtaText || 'Plan a Visit',
                buttonUrl: metadata.primaryCtaUrl || '/visit',
              },
            ]),
          },
          update: {
            title: metadata.homepageTitle || 'Home',
            seoTitle: metadata.homepageTitle || website.title,
            seoDescription: metadata.homepageSubtitle || website.description || '',
            content: jsonString([
              {
                type: 'hero',
                title: metadata.homepageTitle || website.title,
                subtitle: metadata.homepageSubtitle || '',
                aboutText: metadata.aboutText || '',
                buttonText: metadata.primaryCtaText || 'Plan a Visit',
                buttonUrl: metadata.primaryCtaUrl || '/visit',
              },
            ]),
          },
        });
        await prisma.website.update({
          where: { id: website.id },
          data: {
            title: metadata.homepageTitle || website.title,
            description: metadata.homepageSubtitle || website.description,
          },
        });
      }
    }

    if (stepKey === 'domain') {
      const customDomain = metadata.customDomain ? String(metadata.customDomain).trim().toLowerCase() : null;
      const tenant = await prisma.tenant.update({ where: { id: tenantId }, data: { customDomain } });
      const website = await prisma.website.findFirst({ where: { tenantId, isActive: true } });
      if (website) {
        await prisma.website.update({
          where: { id: website.id },
          data: { domain: customDomain || subdomainHost(tenant.subdomain) },
        });
      }
    }

    if (stepKey === 'giving') {
      await this.mergeChurchDetails(tenantId, {
        giving: {
          gatewayProvider: metadata.gatewayProvider || 'manual',
          integrationMode: metadata.integrationMode || 'pending',
        },
      });
    }

    if (userId) {
      await prisma.cmsActivityLog.create({
        data: {
          tenantId,
          userId,
          actionType: `onboarding_${stepKey}`,
          metadataJson: jsonString(metadata),
        },
      }).catch(() => undefined);
    }
  }

  static async mergeChurchDetails(tenantId: string, patch: Record<string, any>) {
    const current = await prisma.moduleSettings.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: CHURCH_DETAILS_MODULE_KEY } },
    });
    const next = { ...parseJson<Record<string, any>>(current?.settings, {}), ...patch };
    await prisma.moduleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: CHURCH_DETAILS_MODULE_KEY } },
      create: { tenantId, moduleKey: CHURCH_DETAILS_MODULE_KEY, settings: jsonString(next) },
      update: { settings: jsonString(next) },
    });
    return next;
  }

  static async onboardingSummary(tenantId: string) {
    const settings = await loadOnboardingSettings(tenantId);
    const progressPercent = progressFromSteps(settings);
    const hasStarted = settings.steps.some((step) => step.status !== 'pending');
    return {
      status: settings.completedAt ? 'completed' : hasStarted || progressPercent > 0 ? 'in_progress' : 'pending',
      progressPercent,
      completedAt: settings.completedAt || null,
    };
  }

  static async tenantListItem(tenant: any) {
    const [branding, onboarding] = await Promise.all([
      prisma.moduleSettings.findUnique({
        where: { tenantId_moduleKey: { tenantId: tenant.id, moduleKey: CHURCH_DETAILS_MODULE_KEY } },
      }),
      this.onboardingSummary(tenant.id),
    ]);
    const brandingData = parseJson<Record<string, any>>(branding?.settings, {});
    return {
      ...tenant,
      subdomainHost: subdomainHost(tenant.subdomain),
      city: brandingData.city || '',
      country: brandingData.country || '',
      onboardingStatus: onboarding.status,
      onboardingProgress: onboarding.progressPercent,
      trialEndsAt: tenant.subscription?.trialEndsAt || null,
    };
  }
}
