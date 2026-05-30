import prisma from '../lib/prisma';

export interface CustomizeThemeInput {
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

export class ThemeEngineService {
  /**
   * Activate / Create a new Theme Engine module instance.
   */
  static async createThemeEngineModule(tenantId: string, data: { title: string; description?: string; visibility?: string; createdBy?: string }) {
    return await prisma.themeEngineModule.create({
      data: {
        tenantId,
        title: data.title,
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
    
    return await prisma.themeEngineModule.update({
      where: { id: record.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.settingsJson !== undefined && { settingsJson: typeof data.settingsJson === 'string' ? data.settingsJson : JSON.stringify(data.settingsJson) }),
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
  static async logActivity(tenantId: string, userId: string, actionType: string, metadata: any) {
    return await prisma.themeEngineModuleActivity.create({
      data: {
        tenantId,
        userId,
        actionType,
        metadataJson: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
      },
    });
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
        moduleKey: 'theme-engine',
        enabled: true,
        billingPlan: 'free',
        providerMode: 'bring_your_own',
        configJson: '{}',
      };
    }
    return record;
  }

  /**
   * Update billing plan/configurations (Super Admin).
   */
  static async updateSettings(tenantId: string, data: { enabled?: boolean; billingPlan?: string; providerMode?: string; configJson?: any }) {
    return await prisma.themeEngineModuleSettings.upsert({
      where: {
        tenantId_moduleKey: {
          tenantId,
          moduleKey: 'theme-engine',
        },
      },
      update: {
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.billingPlan !== undefined && { billingPlan: data.billingPlan }),
        ...(data.providerMode !== undefined && { providerMode: data.providerMode }),
        ...(data.configJson !== undefined && { configJson: typeof data.configJson === 'string' ? data.configJson : JSON.stringify(data.configJson) }),
      },
      create: {
        tenantId,
        moduleKey: 'theme-engine',
        enabled: data.enabled !== undefined ? data.enabled : true,
        billingPlan: data.billingPlan || 'free',
        providerMode: data.providerMode || 'bring_your_own',
        configJson: data.configJson ? (typeof data.configJson === 'string' ? data.configJson : JSON.stringify(data.configJson)) : '{}',
      },
    });
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

    // 2. Check if already purchased/installed
    const existing = await prisma.theme.findFirst({
      where: { tenantId, name: asset.name },
    });

    if (existing) {
      throw new Error('Theme is already installed');
    }

    // 3. Create a copy inside the tenant's workspace
    return await prisma.theme.create({
      data: {
        tenantId,
        name: asset.name,
        settings: asset.assetConfig, // Custom styles configuration JSON
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
    return await prisma.website.update({
      where: { id: websiteId },
      data: { themeId },
    });
  }

  /**
   * List installed and custom themes in the tenant space (including global themes).
   */
  static async listTenantThemes(tenantId: string) {
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
    // 1. Find theme
    const theme = await prisma.theme.findFirst({
      where: { id: themeId, tenantId },
    });

    if (!theme) {
      throw new Error('Customizable tenant theme not found');
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
      where: { id: themeId },
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

    return {
      themeId: theme.id,
      name: theme.name,
      settings: JSON.parse(theme.settings || '{}'),
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
  static async registerSectionTemplate(tenantId: string, data: { name: string; key: string; structureJson: any }) {
    // Store in settings config registry or inside theme-engine system configs
    const settings = await this.getSettings(tenantId);
    
    let config: Record<string, any> = {};
    try {
      config = JSON.parse(settings.configJson || '{}');
    } catch {
      config = {};
    }

    if (!config.sections) {
      config.sections = [];
    }

    // Check duplicate key
    const exists = config.sections.some((s: any) => s.key === data.key);
    if (exists) {
      throw new Error(`Section template with key '${data.key}' already registered`);
    }

    config.sections.push({
      name: data.name,
      key: data.key,
      structure: data.structureJson,
      registeredAt: new Date().toISOString(),
    });

    await this.updateSettings(tenantId, { configJson: config });

    return {
      name: data.name,
      key: data.key,
      structure: data.structureJson,
    };
  }

  /**
   * List section templates available.
   */
  static async listSectionTemplates(tenantId: string) {
    const settings = await this.getSettings(tenantId);
    let config: Record<string, any> = {};
    try {
      config = JSON.parse(settings.configJson || '{}');
    } catch {
      config = {};
    }

    const defaultSections = [
      { name: 'Hero Banner', key: 'hero-banner', structure: { title: 'string', subtitle: 'string', bgImage: 'string' } },
      { name: 'Feature Grid', key: 'feature-grid', structure: { items: 'array' } },
      { name: 'Sermon Player Widget', key: 'sermon-player', structure: { recentCount: 'number' } },
    ];

    const developerSections = config.sections || [];

    return [...defaultSections, ...developerSections];
  }
}
