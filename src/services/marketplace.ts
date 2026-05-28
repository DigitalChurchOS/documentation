import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';

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
          companyName: true,
          website: true,
        },
      },
    },
  });
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
          companyName: true,
          website: true,
        },
      },
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
    ...asset,
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

    // Auto-install logic
    if (asset.type === 'plugin') {
      const config = JSON.parse(asset.assetConfig);
      await tx.tenantPlugin.create({
        data: {
          tenantId,
          pluginId: asset.id, // linked to pluginDefinition ID
          status: 'pending', // installs in pending until permissions are granted
          settings: '{}',
          grantedPermissions: '[]',
        },
      });
    } else if (asset.type === 'theme') {
      // Create theme copy in the tenant workspace
      await tx.theme.create({
        data: {
          tenantId,
          name: asset.name,
          settings: asset.assetConfig, // Custom styles template config
          isCustom: true,
        },
      });
    }

    return purchase;
  });
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

  return await prisma.$transaction(async (tx) => {
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
