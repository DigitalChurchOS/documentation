import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';
import { ThemeEngineService } from './themeEngine';
import { subdomainHost } from './tenantProvisioning';

const MARKETPLACE_ACTIVITY_KEY = 'marketplace';

function jsonString(value: any, fallback: any = {}): string {
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch {
      return JSON.stringify({ value });
    }
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

function normalizeInstalledStatus(status?: string | null) {
  if (!status) return 'active';
  if (status === 'pending') return 'pending_permissions';
  if (status === 'inactive') return 'disabled';
  return status;
}

function latestSubmission(asset: any) {
  const submissions = [...(asset?.submissions || [])].sort((a: any, b: any) =>
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );
  return submissions[0] || null;
}

function summarizeAsset(asset: any) {
  if (!asset) return asset;
  const feedbacks = asset.feedbacks || [];
  const purchases = asset.purchases || [];
  const submissions = asset.submissions || [];
  const averageRating = feedbacks.length
    ? Math.round((feedbacks.reduce((sum: number, item: any) => sum + Number(item.rating || 0), 0) / feedbacks.length) * 10) / 10
    : 5;
  const approvedVersions = submissions
    .filter((submission: any) => submission.status === 'approved' || submission.version === asset.version)
    .map((submission: any) => ({
      id: submission.id,
      version: submission.version,
      changelog: submission.changelog,
      status: submission.status,
      submittedAt: submission.submittedAt,
    }));
  const latest = latestSubmission(asset);

  return {
    ...asset,
    rating: averageRating,
    averageRating,
    totalFeedback: feedbacks.length,
    installs: purchases.filter((purchase: any) => purchase.status === 'completed').length,
    versions: approvedVersions.length
      ? approvedVersions
      : [{
          id: latest?.id || asset.id,
          version: asset.version || latest?.version || '1.0.0',
          changelog: latest?.changelog || null,
          status: asset.status,
          submittedAt: latest?.submittedAt || asset.updatedAt,
        }],
  };
}

async function ensurePluginDefinitionForAsset(tx: any, asset: any) {
  const config = safeParseJson<Record<string, any>>(asset.assetConfig, {});
  await tx.pluginDefinition.upsert({
    where: { id: asset.id },
    update: {
      name: asset.name,
      description: asset.description,
      version: asset.version,
      requiredPermissions: JSON.stringify(config.requiredPermissions || []),
      requiredOsVersion: config.requiredOsVersion || '1.0.0',
      price: asset.price,
      isActive: asset.status === 'approved',
    },
    create: {
      id: asset.id,
      name: asset.name,
      description: asset.description,
      version: asset.version,
      requiredPermissions: JSON.stringify(config.requiredPermissions || []),
      requiredOsVersion: config.requiredOsVersion || '1.0.0',
      price: asset.price,
      isActive: asset.status === 'approved',
    },
  });
}

async function provisionAssetInstallation(tx: any, tenantId: string, asset: any) {
  if (asset.type === 'plugin') {
    await ensurePluginDefinitionForAsset(tx, asset);
    const config = safeParseJson<Record<string, any>>(asset.assetConfig, {});
    const requiredPermissions = Array.isArray(config.requiredPermissions) ? config.requiredPermissions : [];
    return tx.tenantPlugin.upsert({
      where: {
        tenantId_pluginId: { tenantId, pluginId: asset.id },
      },
      update: {},
      create: {
        tenantId,
        pluginId: asset.id,
        status: requiredPermissions.length ? 'pending' : 'active',
        settings: JSON.stringify(config.defaultSettings || {}),
        grantedPermissions: requiredPermissions.length ? '[]' : JSON.stringify(requiredPermissions),
      },
    });
  }

  const existingTheme = await tx.theme.findFirst({
    where: {
      tenantId,
      name: asset.name,
    },
  });
  if (existingTheme) return existingTheme;

  const config = safeParseJson<Record<string, any>>(asset.assetConfig, {});
  return tx.theme.create({
    data: {
      tenantId,
      name: asset.name,
      settings: JSON.stringify({
        ...config,
        marketplace: {
          assetId: asset.id,
          version: asset.version,
          installedAt: new Date().toISOString(),
        },
      }),
      isCustom: true,
    },
  });
}

export async function logMarketplaceActivity(
  tenantId: string,
  userId: string | null | undefined,
  action: string,
  metadata: Record<string, any> = {}
) {
  return prisma.developerMarketplaceModuleActivity.create({
    data: {
      tenantId,
      userId: userId || 'System',
      actionType: action,
      metadataJson: jsonString({
        moduleKey: MARKETPLACE_ACTIVITY_KEY,
        ...metadata,
      }),
    },
  });
}

/**
 * Register a new developer profile.
 */
export async function registerDeveloper(
  userId: string,
  companyName?: string,
  website?: string,
  payoutEmail?: string
): Promise<any> {
  // Check if developer profile already exists for this user
  const existing = await prisma.developerProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new Error('Developer profile already exists for this user');
  }

  return await prisma.developerProfile.create({
    data: {
      userId,
      companyName,
      website,
      status: 'active',
      payoutEmail,
    },
  });
}

export async function getDeveloperProfile(userId: string): Promise<any | null> {
  return prisma.developerProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          tenant: { select: { id: true, name: true, subdomain: true } },
        },
      },
      assets: {
        include: {
          submissions: { orderBy: { submittedAt: 'desc' } },
          purchases: true,
          feedbacks: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      sandboxTenants: {
        include: { tenant: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/**
 * Define a new marketplace asset (draft).
 */
export async function createAsset(
  developerId: string,
  name: string,
  description: string | null,
  type: string, // plugin | theme
  pricingType: string, // free | paid
  price: number,
  assetConfig: any
): Promise<any> {
  const developer = await prisma.developerProfile.findUnique({
    where: { id: developerId },
  });

  if (!developer) {
    throw new Error('Developer profile not found');
  }

  if (type !== 'plugin' && type !== 'theme') {
    throw new Error('Invalid asset type. Must be plugin or theme');
  }

  if (pricingType !== 'free' && pricingType !== 'paid') {
    throw new Error('Invalid pricing type. Must be free or paid');
  }

  const finalPrice = pricingType === 'free' ? 0.0 : price;

  return await prisma.marketplaceAsset.create({
    data: {
      developerId,
      name,
      description,
      type,
      pricingType,
      price: finalPrice,
      version: '1.0.0',
      status: 'draft',
      assetConfig: JSON.stringify(assetConfig || {}),
      revenueSharePct: 0.70, // 70% to developer, 30% to platform
    },
  });
}

/**
 * Submit an asset version for review.
 */
export async function submitAssetVersion(
  assetId: string,
  version: string,
  changelog?: string
): Promise<any> {
  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset) {
    throw new Error('Marketplace asset not found');
  }

  // Create submission
  const submission = await prisma.assetSubmission.create({
    data: {
      assetId,
      version,
      changelog,
      status: 'pending',
    },
  });

  // Update asset status to under_review
  await prisma.marketplaceAsset.update({
    where: { id: assetId },
    data: {
      status: 'under_review',
    },
  });

  return submission;
}

/**
 * Review a version submission (Admin action).
 */
export async function reviewSubmission(
  submissionId: string,
  reviewerId: string,
  decision: string, // approved | rejected | changes_requested
  notes?: string
): Promise<any> {
  const submission = await prisma.assetSubmission.findUnique({
    where: { id: submissionId },
    include: { asset: true },
  });

  if (!submission) {
    throw new Error('Asset submission not found');
  }

  if (!['approved', 'rejected', 'changes_requested'].includes(decision)) {
    throw new Error('Invalid review decision');
  }

  // Create review record
  const review = await prisma.submissionReview.create({
    data: {
      submissionId,
      reviewerId,
      decision,
      notes,
    },
  });

  // Update submission status
  await prisma.assetSubmission.update({
    where: { id: submissionId },
    data: { status: decision },
  });

  // If approved, update asset status and version
  if (decision === 'approved') {
    const updatedAsset = await prisma.marketplaceAsset.update({
      where: { id: submission.assetId },
      data: {
        status: 'approved',
        version: submission.version,
      },
    });

    // If the asset is a plugin, upsert the global PluginDefinition
    if (updatedAsset.type === 'plugin') {
      const config = JSON.parse(updatedAsset.assetConfig);
      await prisma.pluginDefinition.upsert({
        where: { id: updatedAsset.id },
        update: {
          name: updatedAsset.name,
          description: updatedAsset.description,
          version: updatedAsset.version,
          requiredPermissions: JSON.stringify(config.requiredPermissions || []),
          requiredOsVersion: config.requiredOsVersion || '1.0.0',
          price: updatedAsset.price,
          isActive: true,
        },
        create: {
          id: updatedAsset.id,
          name: updatedAsset.name,
          description: updatedAsset.description,
          version: updatedAsset.version,
          requiredPermissions: JSON.stringify(config.requiredPermissions || []),
          requiredOsVersion: config.requiredOsVersion || '1.0.0',
          price: updatedAsset.price,
          isActive: true,
        },
      });
    } else if (updatedAsset.type === 'theme') {
      await prisma.theme.upsert({
        where: { id: updatedAsset.id },
        update: {
          name: updatedAsset.name,
          settings: updatedAsset.assetConfig,
          isCustom: false,
        },
        create: {
          id: updatedAsset.id,
          tenantId: null,
          name: updatedAsset.name,
          settings: updatedAsset.assetConfig,
          isCustom: false,
        },
      });
    }
  } else {
    // If rejected, set status back or mark as rejected
    await prisma.marketplaceAsset.update({
      where: { id: submission.assetId },
      data: { status: decision === 'rejected' ? 'rejected' : 'draft' },
    });
  }

  return review;
}

/**
 * List approved marketplace assets with optional filters.
 */
export async function listMarketplaceAssets(filters: {
  type?: string;
  pricingType?: string;
  query?: string;
}): Promise<any[]> {
  const whereClause: any = {
    status: 'approved',
  };

  if (filters.type) {
    whereClause.type = filters.type;
  }

  if (filters.pricingType) {
    whereClause.pricingType = filters.pricingType;
  }

  if (filters.query) {
    whereClause.OR = [
      { name: { contains: filters.query } },
      { description: { contains: filters.query } },
    ];
  }

  return await prisma.marketplaceAsset.findMany({
    where: whereClause,
    include: {
      developer: {
        select: {
          id: true,
          companyName: true,
          website: true,
        },
      },
      submissions: { orderBy: { submittedAt: 'desc' } },
      feedbacks: true,
      purchases: true,
    },
    orderBy: { updatedAt: 'desc' },
  }).then((assets) => assets.map(summarizeAsset));
}

/**
 * Retrieve marketplace asset details along with feedbacks.
 */
export async function getAssetDetails(assetId: string): Promise<any> {
  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
    include: {
      developer: {
        select: {
          id: true,
          companyName: true,
          website: true,
        },
      },
      submissions: { orderBy: { submittedAt: 'desc' } },
      purchases: true,
      feedbacks: {
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          userId: true,
        },
      },
    },
  });

  if (!asset || asset.status !== 'approved') {
    throw new Error('Approved marketplace asset not found');
  }

  // Calculate average rating
  const totalFeedback = asset.feedbacks.length;
  const averageRating = totalFeedback > 0
    ? asset.feedbacks.reduce((acc, f) => acc + f.rating, 0) / totalFeedback
    : 5;

  return {
    ...summarizeAsset(asset),
    averageRating,
    totalFeedback,
  };
}

/**
 * Purchase and auto-install a marketplace asset.
 */
export async function purchaseMarketplaceAsset(
  tenantId: string,
  assetId: string
): Promise<any> {
  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset || asset.status !== 'approved') {
    throw new Error('Asset is not available for purchase');
  }

  // Calculate platform & developer share
  const amountPaid = asset.price;
  const developerShare = Math.round(amountPaid * asset.revenueSharePct * 100) / 100;
  const platformShare = Math.round(amountPaid * (1 - asset.revenueSharePct) * 100) / 100;

  // Check if already purchased
  const existingPurchase = await prisma.assetPurchase.findFirst({
    where: { tenantId, assetId, status: 'completed' },
  });

  if (existingPurchase) {
    throw new Error('Asset has already been purchased/installed');
  }

  // Record purchase inside a transaction
  return await prisma.$transaction(async (tx) => {
    const purchase = await tx.assetPurchase.create({
      data: {
        tenantId,
        assetId,
        amountPaid,
        developerShare,
        platformShare,
        status: 'completed',
      },
    });

    await provisionAssetInstallation(tx, tenantId, asset);

    return purchase;
  });
}

export async function installMarketplaceAsset(tenantId: string, assetId: string): Promise<any> {
  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
    include: {
      developer: { select: { id: true, companyName: true, website: true } },
      submissions: { orderBy: { submittedAt: 'desc' } },
      feedbacks: true,
      purchases: true,
    },
  });

  if (!asset || asset.status !== 'approved') {
    throw new Error('Asset is not available for installation');
  }

  const existingPurchase = await prisma.assetPurchase.findFirst({
    where: { tenantId, assetId, status: 'completed' },
    include: { asset: true },
  });

  if (!existingPurchase) {
    await prisma.$transaction(async (tx) => {
      await tx.assetPurchase.create({
        data: {
          tenantId,
          assetId,
          amountPaid: asset.price,
          developerShare: Math.round(asset.price * asset.revenueSharePct * 100) / 100,
          platformShare: Math.round(asset.price * (1 - asset.revenueSharePct) * 100) / 100,
          status: 'completed',
        },
      });
      await provisionAssetInstallation(tx, tenantId, asset);
    });
  } else {
    await prisma.$transaction(async (tx) => {
      await provisionAssetInstallation(tx, tenantId, asset);
    });
  }

  const installed = await listInstalledMarketplaceAssets(tenantId);
  return installed.find((item) => item.assetId === assetId) || null;
}

export async function listInstalledMarketplaceAssets(tenantId: string): Promise<any[]> {
  const purchases = await prisma.assetPurchase.findMany({
    where: { tenantId, status: 'completed' },
    include: {
      asset: {
        include: {
          developer: { select: { id: true, companyName: true, website: true } },
          submissions: { orderBy: { submittedAt: 'desc' } },
          feedbacks: true,
          purchases: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const pluginIds = purchases.filter((purchase) => purchase.asset.type === 'plugin').map((purchase) => purchase.assetId);
  const [plugins, tenantThemes] = await Promise.all([
    pluginIds.length
      ? prisma.tenantPlugin.findMany({ where: { tenantId, pluginId: { in: pluginIds } }, include: { plugin: true } })
      : Promise.resolve([]),
    prisma.theme.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } }),
  ]);
  const pluginMap = new Map(plugins.map((plugin) => [plugin.pluginId, plugin]));

  return purchases.map((purchase) => {
    const asset = summarizeAsset(purchase.asset);
    const version = { id: asset.versions?.[0]?.id || asset.id, version: asset.version };
    if (asset.type === 'plugin') {
      const plugin = pluginMap.get(asset.id);
      return {
        id: plugin?.id || purchase.id,
        purchaseId: purchase.id,
        tenantId,
        assetId: asset.id,
        status: normalizeInstalledStatus(plugin?.status || 'pending'),
        version,
        asset,
        plugin,
        installedAt: purchase.createdAt,
      };
    }

    const theme = tenantThemes.find((item) => {
      const settings = safeParseJson<Record<string, any>>(item.settings, {});
      return settings.marketplace?.assetId === asset.id || item.name === asset.name;
    });

    return {
      id: theme?.id || purchase.id,
      purchaseId: purchase.id,
      tenantId,
      assetId: asset.id,
      status: 'active',
      version,
      asset,
      theme,
      installedAt: purchase.createdAt,
    };
  });
}

export async function updateInstalledMarketplaceAssetStatus(
  tenantId: string,
  assetId: string,
  nextStatus: 'active' | 'disabled'
): Promise<any> {
  const asset = await prisma.marketplaceAsset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Marketplace asset not found');

  if (asset.type === 'plugin') {
    const plugin = await prisma.tenantPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId: assetId } },
    });
    if (!plugin) throw new Error('Asset is not installed');
    await prisma.tenantPlugin.update({
      where: { id: plugin.id },
      data: { status: nextStatus === 'active' ? 'active' : 'inactive' },
    });
  }

  const installed = await listInstalledMarketplaceAssets(tenantId);
  return installed.find((item) => item.assetId === assetId) || null;
}

export async function uninstallMarketplaceAsset(tenantId: string, assetId: string): Promise<void> {
  const asset = await prisma.marketplaceAsset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Marketplace asset not found');

  if (asset.type === 'plugin') {
    const plugin = await prisma.tenantPlugin.findUnique({
      where: { tenantId_pluginId: { tenantId, pluginId: assetId } },
    });
    if (plugin) {
      await prisma.pluginWebhook.deleteMany({ where: { tenantId, tenantPluginId: plugin.id } });
      await prisma.tenantPlugin.delete({ where: { id: plugin.id } });
    }
  } else {
    const themes = await prisma.theme.findMany({ where: { tenantId, name: asset.name } });
    for (const theme of themes) {
      const settings = safeParseJson<Record<string, any>>(theme.settings, {});
      if (settings.marketplace?.assetId === assetId || theme.name === asset.name) {
        await prisma.theme.delete({ where: { id: theme.id } });
        break;
      }
    }
  }

  await prisma.assetPurchase.deleteMany({ where: { tenantId, assetId } });
}

export async function grantMarketplacePluginPermissions(
  tenantId: string,
  assetId: string,
  permissions: string[]
): Promise<any> {
  const installed = await prisma.tenantPlugin.findUnique({
    where: { tenantId_pluginId: { tenantId, pluginId: assetId } },
    include: { plugin: true },
  });

  if (!installed) throw new Error('Plugin is not installed');
  const required = safeParseJson<string[]>(installed.plugin.requiredPermissions, []);
  const invalid = permissions.filter((permission) => !required.includes(permission));
  if (invalid.length > 0) {
    throw new Error(`Cannot grant unrequested permissions: ${invalid.join(', ')}`);
  }

  await prisma.tenantPlugin.update({
    where: { id: installed.id },
    data: {
      grantedPermissions: JSON.stringify(permissions),
      status: 'active',
    },
  });

  const list = await listInstalledMarketplaceAssets(tenantId);
  return list.find((item) => item.assetId === assetId) || null;
}

export async function listDeveloperSubmissions(developerId: string): Promise<any[]> {
  return prisma.assetSubmission.findMany({
    where: { asset: { developerId } },
    include: {
      asset: {
        include: {
          developer: { include: { user: { select: { id: true, email: true, tenant: { select: { id: true, name: true, subdomain: true } } } } } },
          feedbacks: true,
          purchases: true,
          submissions: { orderBy: { submittedAt: 'desc' } },
        },
      },
      reviews: true,
    },
    orderBy: { submittedAt: 'desc' },
  }).then((submissions) => submissions.map((submission) => ({
    ...submission,
    asset: summarizeAsset(submission.asset),
  })));
}

export async function listDeveloperSandboxes(developerId: string): Promise<any[]> {
  const sandboxes = await prisma.sandboxTenant.findMany({
    where: { developerId },
    include: { tenant: true },
    orderBy: { createdAt: 'desc' },
  });
  return sandboxes.map((sandbox) => ({
    ...sandbox,
    tenant: sandbox.tenant
      ? {
          ...sandbox.tenant,
          subdomainHost: subdomainHost(sandbox.tenant.subdomain),
        }
      : sandbox.tenant,
  }));
}

export async function listDeveloperLogs(tenantId: string): Promise<any[]> {
  const logs = await prisma.developerMarketplaceModuleActivity.findMany({
    where: { tenantId },
    include: { tenant: { select: { id: true, name: true, subdomain: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return logs.map((log) => {
    const metadata = safeParseJson<Record<string, any>>(log.metadataJson, {});
    return {
      ...log,
      assetId: metadata.assetId || metadata.moduleId || 'marketplace',
      version: metadata.version || metadata.submissionVersion || '1.0.0',
      action: log.actionType,
      details: metadata.details || metadata.notes || metadata.title || metadata.assetName || '',
      metadata,
    };
  });
}

export async function getDeveloperOverview(tenantId: string, userId: string): Promise<any> {
  const profile = await getDeveloperProfile(userId);
  if (!profile) {
    return {
      profile: null,
      submissions: [],
      sandboxes: [],
      logs: await listDeveloperLogs(tenantId),
      payouts: { totalSales: 0, totalDeveloperShare: 0, totalPlatformShare: 0, purchases: [] },
      counts: { submissions: 0, sandboxes: 0, assets: 0 },
    };
  }

  const [submissions, sandboxes, logs, payouts] = await Promise.all([
    listDeveloperSubmissions(profile.id),
    listDeveloperSandboxes(profile.id),
    listDeveloperLogs(tenantId),
    getDeveloperPayouts(profile.id),
  ]);

  return {
    profile,
    submissions,
    sandboxes,
    logs,
    payouts,
    counts: {
      submissions: submissions.length,
      sandboxes: sandboxes.length,
      assets: profile.assets.length,
    },
  };
}

/**
 * Submit a feedback rating.
 */
export async function submitAssetFeedback(
  tenantId: string,
  assetId: string,
  userId: string,
  rating: number,
  comment?: string
): Promise<any> {
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const asset = await prisma.marketplaceAsset.findUnique({
    where: { id: assetId },
  });

  if (!asset || asset.status !== 'approved') {
    throw new Error('Asset not found or not approved');
  }

  // Check if they purchased the asset (if it is paid) or if they just installed it
  if (asset.pricingType === 'paid') {
    const purchased = await prisma.assetPurchase.findFirst({
      where: { tenantId, assetId, status: 'completed' },
    });
    if (!purchased) {
      throw new Error('Must purchase the asset before leaving feedback');
    }
  }

  return await prisma.assetFeedback.create({
    data: {
      tenantId,
      assetId,
      userId,
      rating,
      comment,
    },
  });
}

/**
 * Provision a sandbox testing tenant.
 */
export async function createSandboxTenant(developerId: string): Promise<any> {
  const developer = await prisma.developerProfile.findUnique({
    where: { id: developerId },
  });

  if (!developer) {
    throw new Error('Developer profile not found');
  }

  const sandboxId = randomUUID().slice(0, 8);
  const subdomain = `sandbox-dev-${sandboxId}`;

  // Expiration: 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create a brand new tenant
    const tenant = await tx.tenant.create({
      data: {
        name: `Sandbox Dev Workspace - ${developer.companyName || 'Dev'}`,
        subdomain,
        status: 'trialing',
      },
    });

    // 2. Link it in sandbox_tenants
    const sandbox = await tx.sandboxTenant.create({
      data: {
        developerId,
        tenantId: tenant.id,
        expiresAt,
      },
    });

    return { tenant, sandbox };
  });

  await ThemeEngineService.provisionEcclesiaForTenant(result.tenant.id, {
    websiteTitle: `${result.tenant.name} Website`,
  });

  return {
    ...result,
    tenant: {
      ...result.tenant,
      subdomainHost: subdomainHost(result.tenant.subdomain),
    },
  };
}

/**
 * Retrieve payouts split report for a developer.
 */
export async function getDeveloperPayouts(developerId: string): Promise<any> {
  const assets = await prisma.marketplaceAsset.findMany({
    where: { developerId },
    select: { id: true },
  });

  const assetIds = assets.map((a) => a.id);

  const purchases = await prisma.assetPurchase.findMany({
    where: {
      assetId: { in: assetIds },
      status: 'completed',
    },
    include: {
      asset: {
        select: {
          name: true,
          type: true,
        },
      },
    },
  });

  const totalSales = Math.round(purchases.reduce((acc, p) => acc + p.amountPaid, 0) * 100) / 100;
  const totalDeveloperShare = Math.round(purchases.reduce((acc, p) => acc + p.developerShare, 0) * 100) / 100;
  const totalPlatformShare = Math.round(purchases.reduce((acc, p) => acc + p.platformShare, 0) * 100) / 100;

  return {
    totalSales,
    totalDeveloperShare,
    totalPlatformShare,
    purchases,
  };
}
