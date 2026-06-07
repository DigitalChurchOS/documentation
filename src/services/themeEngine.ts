import prisma from '../lib/prisma';
import { trackEvent } from './analytics';
import {
  ECCLESIA_GLOBAL_CONTENT_KEY,
  ECCLESIA_THEME_NAME,
  createEcclesiaDefaultPages,
  createEcclesiaFooterLinks,
  createEcclesiaGlobalContent,
  createEcclesiaNavigationItems,
  createEcclesiaThemeSettings,
  getEcclesiaPageTemplates,
  getEcclesiaSectionTemplates,
  getEcclesiaWidgets,
} from '../themes/ecclesia';

const MODULE_KEY = 'theme-engine';
const VALID_STATUSES = new Set(['active', 'inactive', 'suspended']);
const VALID_VISIBILITIES = new Set(['public', 'private']);
const VALID_BILLING_PLANS = new Set(['free', 'premium', 'platform']);
const VALID_PROVIDER_MODES = new Set(['bring_your_own', 'platform_managed', 'marketplace']);
const CUSTOM_CSS_LIMIT = 20000;

const DEFAULT_THEME_ENGINE_CONFIG = {
  allowMarketplaceThemes: true,
  allowCustomCss: true,
  publicPublishingRequiresActiveEntitlement: true,
  systemThemeKey: 'ecclesia',
  referenceTheme: ECCLESIA_THEME_NAME,
  defaultHeaderStyle: 'default',
  defaultFooterStyle: 'simple',
  mobileLayout: 'stacked',
  sections: [],
  pageTemplates: [],
  widgets: getEcclesiaWidgets(),
};

export interface CustomizeThemeInput {
  [key: string]: any;
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  fonts?: {
    heading?: string;
    body?: string;
  };
  logos?: {
    primaryUrl?: string;
    secondaryUrl?: string;
  };
  layout?: {
    headerStyle?: string;
    footerStyle?: string;
    mobileLayout?: string;
  };
  customCss?: string;
}

export interface ThemeEngineModuleInput {
  title: string;
  description?: string;
  visibility?: string;
  createdBy?: string | null;
}

export interface ThemeEngineSettingsInput {
  enabled?: boolean;
  billingPlan?: string;
  providerMode?: string;
  configJson?: any;
}

export interface ThemeEngineTemplateInput {
  name: string;
  key: string;
  structureJson: any;
}

function jsonString(value: any, fallback: any = {}): string {
  if (typeof value === 'string') {
    JSON.parse(value);
    return value;
  }

  return JSON.stringify(value ?? fallback);
}

function safeParseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required`);
  }

  return value.trim();
}

function normalizeTemplateKey(value: unknown): string {
  const key = requireNonEmptyString(value, 'key')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!key) {
    throw new Error('key must contain letters or numbers');
  }

  return key;
}

function assertAllowed(value: string | undefined, allowed: Set<string>, label: string): void {
  if (value !== undefined && !allowed.has(value)) {
    throw new Error(`${label} must be one of: ${Array.from(allowed).join(', ')}`);
  }
}

function assertHexColor(value: string | undefined, label: string): void {
  if (value === undefined || value === '') return;
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) {
    throw new Error(`${label} must be a valid hex color`);
  }
}

function assertUrlLike(value: string | undefined, label: string): void {
  if (value === undefined || value.trim() === '') return;

  if (value.startsWith('/')) return;

  try {
    const parsed = new URL(value);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error();
    }
  } catch {
    throw new Error(`${label} must be a valid http(s) URL or site-relative path`);
  }
}

function validateCustomization(input: CustomizeThemeInput): void {
  if (input.colors) {
    assertHexColor(input.colors.primary, 'colors.primary');
    assertHexColor(input.colors.secondary, 'colors.secondary');
    assertHexColor(input.colors.accent, 'colors.accent');
  }

  if (input.fonts) {
    if (input.fonts.heading !== undefined) requireNonEmptyString(input.fonts.heading, 'fonts.heading');
    if (input.fonts.body !== undefined) requireNonEmptyString(input.fonts.body, 'fonts.body');
  }

  if (input.logos) {
    assertUrlLike(input.logos.primaryUrl, 'logos.primaryUrl');
    assertUrlLike(input.logos.secondaryUrl, 'logos.secondaryUrl');
  }

  if (input.customCss !== undefined && input.customCss.length > CUSTOM_CSS_LIMIT) {
    throw new Error(`customCss must be ${CUSTOM_CSS_LIMIT} characters or fewer`);
  }
}

function normalizeConfigJson(input: any): string {
  const current = typeof input === 'string' ? safeParseJson<Record<string, any>>(input, {}) : (input || {});
  return JSON.stringify({
    ...DEFAULT_THEME_ENGINE_CONFIG,
    ...current,
    sections: Array.isArray(current.sections) ? current.sections : [],
    pageTemplates: Array.isArray(current.pageTemplates) ? current.pageTemplates : [],
  });
}

function normalizeTemplate(input: ThemeEngineTemplateInput, type: 'section' | 'page') {
  const name = requireNonEmptyString(input.name, 'name');
  const key = normalizeTemplateKey(input.key);
  const structure = typeof input.structureJson === 'string'
    ? safeParseJson<Record<string, any>>(input.structureJson, {})
    : input.structureJson;

  if (!structure || typeof structure !== 'object' || Array.isArray(structure)) {
    throw new Error('structureJson must be an object');
  }

  return {
    name,
    key,
    structure,
    type,
    registeredAt: new Date().toISOString(),
  };
}

function makePageContent(
  title: string,
  subtitle: string,
  badgeText = 'Christ Embassy',
  moduleName: string | null = null,
  blockName: string | null = null,
  actionName: string | null = null,
  fieldsList: string[] = []
): string {
  const elements = [
    {
      id: 'flex_hero_' + Math.random().toString(36).substring(2, 7),
      type: 'flexbox',
      props: { display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '16px' },
      styles: {
        desktop: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          paddingTop: '80px',
          paddingBottom: '80px',
          paddingLeft: '40px',
          paddingRight: '40px',
          minHeight: '350px',
          borderRadius: '8px',
          backgroundColor: '#f8fafc',
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: '#e5e7eb'
        },
        mobile: {
          paddingTop: '40px',
          paddingBottom: '40px',
          paddingLeft: '20px',
          paddingRight: '20px'
        }
      },
      children: [
        {
          id: 'hero_badge_' + Math.random().toString(36).substring(2, 7),
          type: 'button',
          props: { text: badgeText, url: '#' },
          styles: {
            desktop: {
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              paddingLeft: '14px',
              paddingRight: '14px',
              paddingTop: '6px',
              paddingBottom: '6px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: '700',
              textAlign: 'center',
              borderStyle: 'solid',
              borderWidth: '1px',
              borderColor: '#bfdbfe',
              textTransform: 'uppercase'
            }
          },
          children: []
        },
        {
          id: 'hero_heading_' + Math.random().toString(36).substring(2, 7),
          type: 'heading',
          props: { text: title, level: 'h1' },
          styles: {
            desktop: {
              fontSize: '44px',
              fontWeight: '800',
              color: '#111827',
              textAlign: 'center',
              lineHeight: '1.2'
            }
          },
          children: []
        },
        {
          id: 'hero_desc_' + Math.random().toString(36).substring(2, 7),
          type: 'paragraph',
          props: { text: subtitle },
          styles: {
            desktop: {
              fontSize: '15px',
              color: '#4b5563',
              textAlign: 'center',
              lineHeight: '1.6'
            }
          },
          children: []
        }
      ]
    }
  ];

  if (moduleName) {
    elements.push({
      id: 'flex_module_' + Math.random().toString(36).substring(2, 7),
      type: 'flexbox',
      props: {},
      styles: {},
      children: [
        {
          id: 'module_title_' + Math.random().toString(36).substring(2, 7),
          type: 'heading',
          props: { text: blockName, level: 'h2' },
          styles: {},
          children: []
        },
        {
          id: 'module_block_' + Math.random().toString(36).substring(2, 7),
          type: 'dynamic_church_block',
          props: { module: moduleName, blockName, action: actionName, fields: fieldsList },
          styles: {},
          children: []
        }
      ]
    } as any);
  }

  return JSON.stringify(elements);
}

export class ThemeEngineService {
  /**
   * Ensures the global platform reference theme exists for browsing and copying.
   */
  static async ensureEcclesiaSystemTheme() {
    const existing = await prisma.theme.findFirst({
      where: { tenantId: null, name: ECCLESIA_THEME_NAME },
    });

    if (existing) return existing;

    return await prisma.theme.create({
      data: {
        tenantId: null,
        name: ECCLESIA_THEME_NAME,
        settings: JSON.stringify(createEcclesiaThemeSettings()),
        isCustom: false,
      },
    });
  }

  /**
   * Install and activate Ecclesia for a tenant, including default public website content.
   */
  static async provisionEcclesiaForTenant(tenantId: string, options: { websiteTitle?: string; domain?: string | null } = {}) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    await this.ensureEcclesiaSystemTheme();

    await prisma.moduleDefinition.upsert({
      where: { key: 'website-cms' },
      update: { name: 'Website CMS', category: 'Core', dependencies: '[]' },
      create: { key: 'website-cms', name: 'Website CMS', category: 'Core', dependencies: '[]' },
    });

    await prisma.moduleDefinition.upsert({
      where: { key: MODULE_KEY },
      update: { name: 'Theme Engine', category: 'Core', dependencies: '["website-cms"]' },
      create: { key: MODULE_KEY, name: 'Theme Engine', category: 'Core', dependencies: '["website-cms"]' },
    });

    await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } },
      update: { status: 'active', billingRule: 'free' },
      create: { tenantId, moduleKey: 'website-cms', status: 'active', billingRule: 'free' },
    });

    await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: MODULE_KEY } },
      update: { status: 'active', billingRule: 'free' },
      create: { tenantId, moduleKey: MODULE_KEY, status: 'active', billingRule: 'free' },
    });

    await prisma.themeEngineModuleSettings.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey: MODULE_KEY } },
      update: {
        enabled: true,
        billingPlan: 'platform',
        providerMode: 'platform_managed',
        configJson: normalizeConfigJson(DEFAULT_THEME_ENGINE_CONFIG),
      },
      create: {
        tenantId,
        moduleKey: MODULE_KEY,
        enabled: true,
        billingPlan: 'platform',
        providerMode: 'platform_managed',
        configJson: normalizeConfigJson(DEFAULT_THEME_ENGINE_CONFIG),
      },
    });

    let theme = await prisma.theme.findFirst({
      where: { tenantId, name: ECCLESIA_THEME_NAME },
    });

    if (!theme) {
      theme = await prisma.theme.create({
        data: {
          tenantId,
          name: ECCLESIA_THEME_NAME,
          settings: JSON.stringify(createEcclesiaThemeSettings({
            installation: {
              installedForTenantId: tenantId,
              installedAt: new Date().toISOString(),
              autoProvisioned: true,
            },
          })),
          isCustom: false,
        },
      });
    }

    let website = await prisma.website.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!website) {
      website = await prisma.website.create({
        data: {
          tenantId,
          themeId: theme.id,
          title: options.websiteTitle || `${tenant.name} Website`,
          description: createEcclesiaGlobalContent(tenant.name).churchIdentity.description,
          domain: options.domain || tenant.customDomain || null,
          isActive: true,
        },
      });
    } else if (website.themeId !== theme.id) {
      website = await prisma.website.update({
        where: { id: website.id },
        data: { themeId: theme.id },
      });
    }

    await this.seedEcclesiaWebsiteContent(tenantId, website.id);
    await this.logActivity(tenantId, null, 'provision_ecclesia', { themeId: theme.id, websiteId: website.id });

    return { theme, website };
  }

  /**
   * Activate / Create a new Theme Engine module instance.
   */
  static async createThemeEngineModule(tenantId: string, data: ThemeEngineModuleInput) {
    const title = requireNonEmptyString(data.title, 'title');
    assertAllowed(data.visibility, VALID_VISIBILITIES, 'visibility');

    return await prisma.themeEngineModule.create({
      data: {
        tenantId,
        title,
        description: data.description || null,
        visibility: data.visibility || 'public',
        createdBy: data.createdBy || null,
        status: 'active',
      },
    });
  }

  /**
   * List all module configuration instances for the tenant.
   */
  static async listThemeEngineModules(tenantId: string) {
    return await prisma.themeEngineModule.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single theme engine module configuration.
   */
  static async getThemeEngineModule(id: string, tenantId: string) {
    const record = await prisma.themeEngineModule.findFirst({
      where: { id, tenantId },
    });
    if (!record) {
      throw new Error('Theme engine module not found');
    }
    return record;
  }

  /**
   * Update theme engine module details.
   */
  static async updateThemeEngineModule(id: string, tenantId: string, data: { title?: string; description?: string; status?: string; settingsJson?: any; visibility?: string }) {
    const record = await this.getThemeEngineModule(id, tenantId);
    assertAllowed(data.status, VALID_STATUSES, 'status');
    assertAllowed(data.visibility, VALID_VISIBILITIES, 'visibility');
    
    return await prisma.themeEngineModule.update({
      where: { id: record.id },
      data: {
        ...(data.title !== undefined && { title: requireNonEmptyString(data.title, 'title') }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.settingsJson !== undefined && { settingsJson: jsonString(data.settingsJson, {}) }),
        ...(data.visibility !== undefined && { visibility: data.visibility }),
      },
    });
  }

  /**
   * Delete theme engine module.
   */
  static async deleteThemeEngineModule(id: string, tenantId: string) {
    const record = await this.getThemeEngineModule(id, tenantId);
    return await prisma.themeEngineModule.delete({
      where: { id: record.id },
    });
  }

  /**
   * Logs an action in the audit/activity trail.
   */
  static async logActivity(tenantId: string, userId: string | null | undefined, actionType: string, metadata: any = {}) {
    const activity = await prisma.themeEngineModuleActivity.create({
      data: {
        tenantId,
        userId: userId || 'System',
        actionType,
        metadataJson: jsonString(metadata, {}),
      },
    });

    await trackEvent(tenantId, {
      category: 'theme_engine',
      name: actionType,
      entityId: metadata?.themeId || metadata?.moduleId || metadata?.key || null,
      userId: userId || null,
      metadata,
    }).catch(() => undefined);

    return activity;
  }

  /**
   * Fetch all logged activities for audit.
   */
  static async listActivities(tenantId: string) {
    return await prisma.themeEngineModuleActivity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  /**
   * Fetch settings configurations.
   */
  static async getSettings(tenantId: string) {
    const record = await prisma.themeEngineModuleSettings.findUnique({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey: 'theme-engine',
        },
      },
    });

    if (!record) {
      // Return defaults if none configured yet
      return {
        tenantId,
        moduleKey: MODULE_KEY,
        enabled: true,
        billingPlan: 'free',
        providerMode: 'bring_your_own',
        configJson: JSON.stringify(DEFAULT_THEME_ENGINE_CONFIG),
      };
    }
    return record;
  }

  /**
   * Update billing plan/configurations (Super Admin).
   */
  static async updateSettings(tenantId: string, data: ThemeEngineSettingsInput) {
    if (data.enabled !== undefined && typeof data.enabled !== 'boolean') {
      throw new Error('enabled must be a boolean');
    }
    assertAllowed(data.billingPlan, VALID_BILLING_PLANS, 'billingPlan');
    assertAllowed(data.providerMode, VALID_PROVIDER_MODES, 'providerMode');

    const normalizedConfig = data.configJson !== undefined ? normalizeConfigJson(data.configJson) : undefined;

    return await prisma.themeEngineModuleSettings.upsert({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey: MODULE_KEY,
        },
      },
      update: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.billingPlan !== undefined && { billingPlan: data.billingPlan }),
        ...(data.providerMode !== undefined && { providerMode: data.providerMode }),
        ...(normalizedConfig !== undefined && { configJson: normalizedConfig }),
      },
      create: {
        tenantId,
        moduleKey: MODULE_KEY,
        enabled: data.enabled !== undefined ? data.enabled : true,
        billingPlan: data.billingPlan || 'free',
        providerMode: data.providerMode || 'bring_your_own',
        configJson: normalizedConfig || JSON.stringify(DEFAULT_THEME_ENGINE_CONFIG),
      },
    });
  }

  /**
   * Module overview for the central dashboard.
   */
  static async getOverview(tenantId: string) {
    const [moduleRecords, themes, websites, activities, settings] = await Promise.all([
      prisma.themeEngineModule.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
      this.listTenantThemes(tenantId),
      prisma.website.findMany({ where: { tenantId }, include: { theme: true }, orderBy: { createdAt: 'desc' } }),
      prisma.themeEngineModuleActivity.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 5 }),
      this.getSettings(tenantId),
    ]);

    const config = safeParseJson<Record<string, any>>(settings.configJson, DEFAULT_THEME_ENGINE_CONFIG);
    const activeWebsite = websites.find((website) => website.isActive) || websites[0] || null;

    return {
      moduleKey: MODULE_KEY,
      settings,
      counts: {
        moduleProfiles: moduleRecords.length,
        installedThemes: themes.filter((theme) => theme.tenantId === tenantId).length,
        globalThemes: themes.filter((theme) => theme.tenantId === null).length,
        websites: websites.length,
        sectionTemplates: this.defaultSectionTemplates().length + (config.sections || []).length,
        pageTemplates: this.defaultPageTemplates().length + (config.pageTemplates || []).length,
      },
      activeWebsite: activeWebsite ? {
        id: activeWebsite.id,
        title: activeWebsite.title,
        themeId: activeWebsite.themeId,
        themeName: activeWebsite.theme?.name,
      } : null,
      recentActivity: activities,
    };
  }

  /**
   * Install a theme from the marketplace storefront.
   */
  static async installThemeFromMarketplace(tenantId: string, assetId: string) {
    // 1. Fetch asset details
    const asset = await prisma.marketplaceAsset.findUnique({
      where: { id: assetId },
    });

    if (!asset || asset.status !== 'approved' || asset.type !== 'theme') {
      throw new Error('Approved marketplace theme not found');
    }

    if (asset.pricingType !== 'free') {
      const purchase = await prisma.assetPurchase.findFirst({
        where: { tenantId, assetId, status: 'completed' },
      });

      if (!purchase) {
        throw new Error('This premium theme must be purchased before installation');
      }
    }

    // 2. Check if already purchased/installed
    const existing = await prisma.theme.findFirst({
      where: { tenantId, name: asset.name },
    });

    if (existing) {
      throw new Error('Theme is already installed');
    }

    // 3. Create a copy inside the tenant's workspace
    const assetConfig = safeParseJson<Record<string, any>>(asset.assetConfig, {});

    return await prisma.theme.create({
      data: {
        tenantId,
        name: asset.name,
        settings: JSON.stringify({
          ...assetConfig,
          marketplace: {
            assetId: asset.id,
            version: asset.version,
            pricingType: asset.pricingType,
            installedAt: new Date().toISOString(),
          },
        }),
        isCustom: true,
      },
    });
  }

  /**
   * Swap out / switch active theme for website pages.
   */
  static async activateThemeForWebsite(tenantId: string, websiteId: string, themeId: string) {
    // 1. Verify website belongs to tenant
    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    });
    if (!website) {
      throw new Error('Website not found');
    }

    // 2. Verify theme belongs to tenant or is global (tenantId === null)
    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        OR: [{ tenantId: null }, { tenantId }],
      },
    });
    if (!theme) {
      throw new Error('Theme not found');
    }

    // 3. Update website active themeId
    const updatedWebsite = await prisma.website.update({
      where: { id: websiteId },
      data: { themeId },
    });

    await this.seedEcclesiaWebsiteContent(tenantId, websiteId);

    return updatedWebsite;
  }

  private static async seedEcclesiaWebsiteContent(tenantId: string, websiteId: string) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const churchName = tenant?.name || 'Grace Community Church';
    const globalContent = createEcclesiaGlobalContent(churchName);

    const pagesCount = await prisma.page.count({
      where: { websiteId, tenantId },
    });

    if (pagesCount === 0) {
      const defaultPages = createEcclesiaDefaultPages(tenantId, websiteId, churchName);

      for (const page of defaultPages) {
        const created = await prisma.page.create({ data: page });
        await prisma.pageRevision.create({
          data: {
            tenantId,
            pageId: created.id,
            content: created.content,
            version: 1,
            createdById: null,
          },
        });
      }
    }

    await prisma.reusableBlock.upsert({
      where: { tenantId_key: { tenantId, key: ECCLESIA_GLOBAL_CONTENT_KEY } },
      update: {
        name: 'Ecclesia Global Content',
        content: JSON.stringify(globalContent),
      },
      create: {
        tenantId,
        name: 'Ecclesia Global Content',
        key: ECCLESIA_GLOBAL_CONTENT_KEY,
        content: JSON.stringify(globalContent),
      },
    });

    const existingNavigation = await prisma.navigationMenu.findFirst({
      where: { tenantId, websiteId, name: 'Main Navigation' },
    });

    if (!existingNavigation) {
      await prisma.navigationMenu.create({
        data: {
          tenantId,
          websiteId,
          name: 'Main Navigation',
          items: JSON.stringify(createEcclesiaNavigationItems()),
          isActive: true,
        },
      });
    }

    const existingFooter = await prisma.cmsFooter.findFirst({
      where: { tenantId, websiteId },
    });

    if (!existingFooter) {
      const socialLinks = Object.entries(globalContent.social)
        .filter(([, url]) => Boolean(url))
        .map(([label, url]) => ({ label, url }));

      await prisma.cmsFooter.create({
        data: {
          tenantId,
          websiteId,
          copyrightText: `Copyright ${new Date().getFullYear()} ${churchName}. All rights reserved.`,
          socialLinks: JSON.stringify(socialLinks),
          secondaryLinks: JSON.stringify(createEcclesiaFooterLinks()),
        },
      });
    }
  }

  /**
   * List installed and custom themes in the tenant space (including global themes).
   */
  static async listTenantThemes(tenantId: string) {
    await this.ensureEcclesiaSystemTheme();

    return await prisma.theme.findMany({
      where: {
        OR: [{ tenantId: null }, { tenantId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Customize a theme settings profile (colors, typography, branding layouts).
   */
  static async customizeTheme(tenantId: string, themeId: string, customConfig: CustomizeThemeInput) {
    validateCustomization(customConfig);

    // 1. Find theme
    let theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        OR: [{ tenantId }, { tenantId: null }],
      },
    });

    if (!theme) {
      throw new Error('Customizable tenant theme not found');
    }

    if (theme.tenantId === null) {
      theme = await prisma.theme.create({
        data: {
          tenantId,
          name: `${theme.name} Custom`,
          settings: theme.settings || '{}',
          isCustom: true,
        },
      });

      await prisma.website.updateMany({
        where: { tenantId, themeId },
        data: { themeId: theme.id },
      });
    }

    // 2. Merge existing settings with updates
    let existingSettings: Record<string, any> = {};
    try {
      existingSettings = JSON.parse(theme.settings || '{}');
    } catch {
      existingSettings = {};
    }

    const updatedSettings = {
      ...existingSettings,
      ...customConfig,
      colors: {
        ...(existingSettings.colors || {}),
        ...(customConfig.colors || {}),
      },
      fonts: {
        ...(existingSettings.fonts || {}),
        ...(customConfig.fonts || {}),
      },
      logos: {
        ...(existingSettings.logos || {}),
        ...(customConfig.logos || {}),
      },
      layout: {
        ...(existingSettings.layout || {}),
        ...(customConfig.layout || {}),
      },
    };

    // 3. Save to database
    return await prisma.theme.update({
      where: { id: theme.id },
      data: {
        settings: JSON.stringify(updatedSettings),
      },
    });
  }

  /**
   * Preview a theme config in temporary simulation staging context.
   */
  static async previewTheme(tenantId: string, themeId: string) {
    // Fetch theme
    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        OR: [{ tenantId: null }, { tenantId }],
      },
    });

    if (!theme) {
      throw new Error('Theme not found');
    }

    const settings = safeParseJson<Record<string, any>>(theme.draftSettings || theme.settings, {});

    return {
      themeId: theme.id,
      name: theme.name,
      settings,
      version: settings.marketplace?.version || 'local',
      isPreview: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Staging preview temporary customization settings save.
   */
  static async customizePreview(tenantId: string, themeId: string, customConfig: CustomizeThemeInput) {
    // Return simulated styling variables merged, without modifying actual production theme
    const basePreview = await this.previewTheme(tenantId, themeId);
    
    const mergedSettings = {
      ...basePreview.settings,
      ...customConfig,
      colors: {
        ...(basePreview.settings.colors || {}),
        ...(customConfig.colors || {}),
      },
      fonts: {
        ...(basePreview.settings.fonts || {}),
        ...(customConfig.fonts || {}),
      },
      logos: {
        ...(basePreview.settings.logos || {}),
        ...(customConfig.logos || {}),
      },
      layout: {
        ...(basePreview.settings.layout || {}),
        ...(customConfig.layout || {}),
      },
    };

    return {
      themeId,
      settings: mergedSettings,
      isPreview: true,
      staging: true,
    };
  }

  /**
   * Register layout blocks / section templates (Developer).
   */
  static async registerSectionTemplate(tenantId: string, data: ThemeEngineTemplateInput) {
    const template = normalizeTemplate(data, 'section');
    // Store in settings config registry or inside theme-engine system configs
    const settings = await this.getSettings(tenantId);
    
    let config = safeParseJson<Record<string, any>>(settings.configJson, DEFAULT_THEME_ENGINE_CONFIG);

    if (!config.sections) {
      config.sections = [];
    }

    // Check duplicate key
    const exists = [...this.defaultSectionTemplates(), ...config.sections].some((s: any) => s.key === template.key);
    if (exists) {
      throw new Error(`Section template with key '${template.key}' already registered`);
    }

    config.sections.push(template);

    await this.updateSettings(tenantId, { configJson: config });

    return {
      name: template.name,
      key: template.key,
      structure: template.structure,
    };
  }

  /**
   * List section templates available.
   */
  static async listSectionTemplates(tenantId: string) {
    const settings = await this.getSettings(tenantId);
    const config = safeParseJson<Record<string, any>>(settings.configJson, DEFAULT_THEME_ENGINE_CONFIG);

    return [...this.defaultSectionTemplates(), ...(config.sections || [])];
  }

  static async registerPageTemplate(tenantId: string, data: ThemeEngineTemplateInput) {
    const template = normalizeTemplate(data, 'page');
    const settings = await this.getSettings(tenantId);
    const config = safeParseJson<Record<string, any>>(settings.configJson, DEFAULT_THEME_ENGINE_CONFIG);

    if (!config.pageTemplates) {
      config.pageTemplates = [];
    }

    const exists = [...this.defaultPageTemplates(), ...config.pageTemplates].some((s: any) => s.key === template.key);
    if (exists) {
      throw new Error(`Page template with key '${template.key}' already registered`);
    }

    config.pageTemplates.push(template);
    await this.updateSettings(tenantId, { configJson: config });

    return {
      name: template.name,
      key: template.key,
      structure: template.structure,
    };
  }

  static async listPageTemplates(tenantId: string) {
    const settings = await this.getSettings(tenantId);
    const config = safeParseJson<Record<string, any>>(settings.configJson, DEFAULT_THEME_ENGINE_CONFIG);

    return [...this.defaultPageTemplates(), ...(config.pageTemplates || [])];
  }

  static async customizeThemeDraft(tenantId: string, themeId: string, customConfig: CustomizeThemeInput) {
    validateCustomization(customConfig);

    let theme = await prisma.theme.findFirst({
      where: {
        id: themeId,
        OR: [{ tenantId }, { tenantId: null }],
      },
    });

    if (!theme) {
      throw new Error('Customizable tenant theme not found');
    }

    if (theme.tenantId === null) {
      theme = await prisma.theme.create({
        data: {
          tenantId,
          name: `${theme.name} Custom`,
          settings: theme.settings || '{}',
          draftSettings: theme.draftSettings || null,
          isCustom: true,
        },
      });

      await prisma.website.updateMany({
        where: { tenantId, themeId },
        data: { themeId: theme.id },
      });
    }

    const baseSettings = safeParseJson<Record<string, any>>(theme.draftSettings || theme.settings, {});
    const updatedSettings = {
      ...baseSettings,
      ...customConfig,
      colors: { ...(baseSettings.colors || {}), ...(customConfig.colors || {}) },
      fonts: { ...(baseSettings.fonts || {}), ...(customConfig.fonts || {}) },
      logos: { ...(baseSettings.logos || {}), ...(customConfig.logos || {}) },
      layout: { ...(baseSettings.layout || {}), ...(customConfig.layout || {}) },
    };

    return prisma.theme.update({
      where: { id: theme.id },
      data: { draftSettings: JSON.stringify(updatedSettings) },
    });
  }

  static async publishThemeCustomization(tenantId: string, themeId: string) {
    const theme = await prisma.theme.findFirst({
      where: { id: themeId, tenantId },
    });

    if (!theme) {
      throw new Error('Tenant theme not found');
    }

    return prisma.theme.update({
      where: { id: theme.id },
      data: {
        settings: theme.draftSettings || theme.settings,
        draftSettings: null,
      },
    });
  }

  private static defaultSectionTemplates() {
    return getEcclesiaSectionTemplates();
  }

  private static defaultPageTemplates() {
    return getEcclesiaPageTemplates();
  }
}
