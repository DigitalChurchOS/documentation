import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { BillingService } from '../services/billing';
import { PUBLIC_DOMAIN_SUFFIX, TenantProvisioningService, subdomainHost } from '../services/tenantProvisioning';
import { logMarketplaceActivity, reviewSubmission } from '../services/marketplace';

const router = Router();

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
const JWT_SECRET = process.env.JWT_SECRET;

function superAdminTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as { role?: string; email?: string };
    if (payload.role !== 'super-admin') {
      res.status(403).json({ error: 'Forbidden: Super Admin access required' });
      return;
    }
    (req as any).superAdmin = { email: payload.email || 'superadmin@churchos.local', role: payload.role };
    next();
  } catch (err: any) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    next(err);
  }
}

type PlatformModule = {
  key: string;
  name: string;
  category: string;
  icon: string;
  description: string;
  status: 'active' | 'hidden';
  billingRule: 'included' | 'add-on' | 'platform';
  dependencies: string[];
};

const platformModules: PlatformModule[] = [
  ['website-cms', 'Churchfront', 'Core Platform', 'layout-template'],
  ['theme-engine', 'Theme Engine', 'Core Platform', 'palette'],
  ['user-role-management', 'User & Role Management', 'Core Platform', 'shield-check'],
  ['domain-tenant-management', 'Church Details', 'Core Platform', 'globe'],
  ['billing-subscription-management', 'Billing & Subscription Management', 'Core Platform', 'badge-dollar-sign'],
  ['analytics-reporting', 'Analytics & Reporting', 'Core Platform', 'bar-chart-3'],
  ['plugin-extensions-engine', 'Plugin Extensions Engine', 'Core Platform', 'puzzle'],
  ['marketplace', 'Marketplace', 'Core Platform', 'store'],
  ['developer-marketplace', 'Developer Marketplace', 'Core Platform', 'code-2'],
  ['localization-multilingual-engine', 'Localization & Multilingual Engine', 'Core Platform', 'languages'],
  ['centralized-settings-engine', 'Centralized Settings Engine', 'Core Platform', 'settings'],
  ['media', 'Media Library', 'Content & Media', 'library'],
  ['livestream', 'Livestream Studio', 'Content & Media', 'radio'],
  ['church-services', 'Church Services', 'Content & Media', 'church'],
  ['dynamic-blog-publishing-engine', 'Dynamic Blog Publishing Engine', 'Content & Media', 'newspaper'],
  ['digital-library-resource-center', 'Digital Library Resource Center', 'Content & Media', 'book-open'],
  ['podcast-audio-broadcasting', 'Podcast & Audio Broadcasting', 'Content & Media', 'podcast'],
  ['ai-media-content', 'AI Media Content', 'Content & Media', 'wand-sparkles'],
  ['digital-signage-tv-display', 'Digital Signage TV Display', 'Content & Media', 'monitor'],
  ['worship-experience', 'Worship Experience', 'Content & Media', 'music'],
  ['tithes-offerings', 'Tithes & Offerings', 'Giving & Commerce', 'hand-coins'],
  ['partnerships-contributions', 'Partnerships & Contributions', 'Giving & Commerce', 'handshake'],
  ['campaigns-causes', 'Campaigns & Causes', 'Giving & Commerce', 'target'],
  ['e-commerce-church-store', 'E-Commerce Church Store', 'Giving & Commerce', 'shopping-bag'],
  ['financial-management-accounting', 'Financial Management & Accounting', 'Giving & Commerce', 'landmark'],
  ['ministry-funnels-landing-pages', 'Ministry Funnels & Landing Pages', 'Community', 'mouse-pointer-click'],
  ['member-management', 'Member Management', 'Community', 'users'],
  ['community-engagement', 'Community Engagement', 'Community', 'message-circle'],
  ['ministry-crm', 'Ministry CRM', 'Community', 'contact'],
  ['communication-notification-follow-up', 'Communication & Follow-Up', 'Community', 'send'],
  ['live-chat-pastoral-care-support', 'Live Chat Pastoral Care', 'Community', 'message-square-heart'],
  ['member-outreach-invite-campaign', 'Member Outreach Invite Campaign', 'Community', 'user-plus'],
  ['check-in-attendance-management', 'Check-In & Attendance', 'Community', 'clipboard-check'],
  ['volunteer-workforce-management', 'Volunteer Workforce Management', 'Community', 'badge-check'],
  ['forms-workflow-automation', 'Forms & Workflow Automation', 'Community', 'workflow'],
  ['prayer-testimony', 'Prayer & Testimony', 'Community', 'heart'],
  ['salvation-new-believer-journey', 'Salvation & New Believer Journey', 'Discipleship', 'sparkles'],
  ['lms-discipleship-training', 'LMS Discipleship Training', 'Discipleship', 'graduation-cap'],
  ['bible-scripture-engagement', 'Bible & Scripture Engagement', 'Discipleship', 'book'],
  ['cell-fellowship', 'Cell Fellowship', 'Discipleship', 'network'],
  ['children-family-ministry', 'Children & Family Ministry', 'Discipleship', 'baby'],
  ['events-registration', 'Events & Registration', 'Events', 'calendar-days'],
  ['live-meetings', 'Live Meetings', 'Events', 'video'],
  ['booking-appointment-management', 'Booking & Appointment Management', 'Events', 'calendar-check'],
  ['mobile-app-access', 'Mobile App Access', 'Mobile', 'smartphone'],
  ['dedicated-white-label-church-app', 'Dedicated White Label Church App', 'Mobile', 'app-window'],
  ['multi-branch-multi-campus-management', 'Multi-Branch & Multi-Campus', 'Multi-Branch', 'git-branch'],
  ['advanced-translation-multilingual', 'Advanced Translation & Multilingual', 'Multi-Branch', 'languages'],
  ['ai-assistant-ministry-copilot', 'AI Assistant Ministry Copilot', 'AI Layer', 'bot'],
].map(([key, name, category, icon]) => ({
  key,
  name,
  category,
  icon,
  description: `${name} controls for platform-wide ChurchOS operations.`,
  status: 'active',
  billingRule: key.includes('ai') || key.includes('white-label') ? 'add-on' : 'included',
  dependencies: [],
}));

function sendRouteError(res: Response, err: any) {
  const status = err?.status || (String(err?.message || '').toLowerCase().includes('not found') ? 404 : 400);
  res.status(status).json({ error: err?.message || 'Request failed', details: err?.details || null });
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function tenantDomains(tenant: any) {
  const domains = [
    {
      id: `${tenant.id}:subdomain`,
      domain: subdomainHost(tenant.subdomain),
      tenant: { id: tenant.id, name: tenant.name },
      type: 'subdomain',
      isPrimary: !tenant.customDomain,
      status: 'active',
      sslStatus: 'active',
      verificationStatus: 'verified',
      providerMetadata: `Wildcard DNS on ${PUBLIC_DOMAIN_SUFFIX}`,
    },
  ];

  if (tenant.customDomain) {
    domains.push({
      id: `${tenant.id}:custom`,
      domain: tenant.customDomain,
      tenant: { id: tenant.id, name: tenant.name },
      type: 'custom',
      isPrimary: true,
      status: 'active',
      sslStatus: 'active',
      verificationStatus: 'verified',
      providerMetadata: `CNAME ${PUBLIC_DOMAIN_SUFFIX}`,
    });
  }

  return domains;
}

function marketplaceAssetPayload(asset: any) {
  const feedbacks = asset.feedbacks || [];
  const purchases = asset.purchases || [];
  const submissions = asset.submissions || [];
  const rating = feedbacks.length
    ? Math.round((feedbacks.reduce((sum: number, item: any) => sum + Number(item.rating || 0), 0) / feedbacks.length) * 10) / 10
    : 5;
  const versions = submissions.length
    ? submissions.map((submission: any) => ({
        id: submission.id,
        version: submission.version,
        changelog: submission.changelog,
        status: submission.status,
        submittedAt: submission.submittedAt,
      }))
    : [{ id: asset.id, version: asset.version || '1.0.0', status: asset.status, submittedAt: asset.updatedAt }];

  return {
    ...asset,
    rating,
    averageRating: rating,
    totalFeedback: feedbacks.length,
    installs: purchases.filter((purchase: any) => purchase.status === 'completed').length,
    versions,
  };
}

function marketplaceLogPayload(log: any) {
  const metadata = parseJson<Record<string, any>>(log.metadataJson, {});
  return {
    ...log,
    metadata,
    assetId: metadata.assetId || metadata.moduleId || 'marketplace',
    version: metadata.version || metadata.submissionVersion || '1.0.0',
    action: log.actionType,
    details: metadata.details || metadata.notes || metadata.assetName || metadata.title || '',
  };
}

function submissionSecurityStatus(submission: any) {
  if (submission.status === 'approved') return 'passed';
  if (submission.status === 'rejected') return 'failed';
  if (submission.status === 'changes_requested') return 'flagged';
  return 'pending';
}

async function tenantWithAdminIncludes(id: string) {
  return prisma.tenant.findUnique({
    where: { id },
    include: {
      subscription: { include: { plan: true } },
      tenantModules: { include: { module: true }, orderBy: { moduleKey: 'asc' } },
      users: {
        include: {
          member: true,
          userRoles: { include: { role: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      websites: true,
    },
  });
}

async function ensureModuleDefinition(moduleKey: string) {
  const catalog = platformModules.find((item) => item.key === moduleKey);
  await prisma.moduleDefinition.upsert({
    where: { key: moduleKey },
    update: {
      ...(catalog && { name: catalog.name, category: catalog.category, dependencies: JSON.stringify(catalog.dependencies) }),
    },
    create: {
      key: moduleKey,
      name: catalog?.name || moduleKey.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
      category: catalog?.category || 'Platform',
      dependencies: JSON.stringify(catalog?.dependencies || []),
    },
  });
}

router.post('/login', (req: Request, res: Response) => {
  const { email } = req.body;
  if (email === 'superadmin@churchos.local' || email === 'superadmin@churched.online') {
    const token = jwt.sign({ role: 'super-admin', email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { email, role: 'super-admin' } });
  } else {
    res.status(401).json({ error: 'Invalid super admin credentials' });
  }
});

// Enforce standard authentication and Super Admin checks on all subsequent routes
router.use(superAdminTokenMiddleware);

router.get('/overview', async (_req: Request, res: Response) => {
  try {
    const [totalChurches, activeChurches, trialChurches, customDomains, subscriptions, activities] = await Promise.all([
      prisma.tenant.count(),
      prisma.tenant.count({ where: { status: 'active' } }),
      prisma.tenantSubscription.count({ where: { status: 'trialing' } }),
      prisma.tenant.count({ where: { customDomain: { not: null } } }),
      prisma.tenantSubscription.findMany({ include: { plan: true } }),
      prisma.domainTenantManagementModuleActivity.findMany({
        include: { tenant: { select: { id: true, name: true, subdomain: true } } },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const mrr = subscriptions
      .filter((sub) => sub.status === 'active' || sub.status === 'trialing')
      .reduce((sum, sub) => sum + Number(sub.plan?.basePrice || 0), 0);

    res.json({
      data: {
        totalChurches,
        activeChurches,
        trialChurches,
        mrr,
        totalCustomDomains: customDomains,
        recentActivities: activities.map((activity) => ({
          actorEmail: activity.userId || 'system',
          action: activity.actionType,
          targetType: 'tenant',
          targetName: activity.tenant?.name || activity.tenantId,
          createdAt: activity.createdAt,
        })),
      },
    });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/modules', (_req: Request, res: Response) => {
  res.json({ data: platformModules });
});

router.patch('/modules/:key', (req: Request, res: Response) => {
  const module = platformModules.find((item) => item.key === req.params.key);
  if (!module) {
    res.status(404).json({ error: 'Module not found' });
    return;
  }

  if (req.body.status === 'active' || req.body.status === 'hidden') {
    module.status = req.body.status;
  }

  res.json({ data: module });
});

router.get('/plans', async (_req: Request, res: Response) => {
  try {
    const plans = await BillingService.listPlans();
    res.json({ data: plans });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/plans', async (req: Request, res: Response) => {
  try {
    const plan = await prisma.subscriptionPlan.create({
      data: BillingService.normalizePlanInput(req.body || {}, true) as any,
    });
    res.status(201).json({ data: plan });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/plans/:id', async (req: Request, res: Response) => {
  try {
    const plan = await prisma.subscriptionPlan.update({
      where: { id: req.params.id as string },
      data: BillingService.normalizePlanInput(req.body || {}, false) as any,
    });
    res.json({ data: plan });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/tenants', async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const tenants = await prisma.tenant.findMany({
      where: {
        ...(status && status !== 'all' ? { status } : {}),
        ...(search ? { OR: [{ name: { contains: search } }, { subdomain: { contains: search } }] } : {}),
      },
      include: {
        subscription: { include: { plan: true } },
        tenantModules: { include: { module: true } },
        users: { include: { member: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const data = await Promise.all(tenants.map((tenant) => TenantProvisioningService.tenantListItem(tenant)));
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/tenants', async (req: Request, res: Response) => {
  try {
    const { name, subdomain, customDomain } = req.body;

    if (!name || !subdomain) {
      res.status(400).json({ error: 'name and subdomain are required' });
      return;
    }

    // Verify subdomain unique
    const existingSubdomain = await prisma.tenant.findUnique({
      where: { subdomain },
    });
    if (existingSubdomain) {
      res.status(409).json({ error: 'Subdomain already exists' });
      return;
    }

    // Verify custom domain unique if provided
    if (customDomain) {
      const existingDomain = await prisma.tenant.findUnique({
        where: { customDomain },
      });
      if (existingDomain) {
        res.status(409).json({ error: 'Custom domain already registered' });
        return;
      }
    }

    const tenant = await prisma.$transaction(async (tx) => {
      // Create tenant
      const newTenant = await tx.tenant.create({
        data: {
          name,
          subdomain,
          customDomain: customDomain || null,
          status: 'active',
        },
      });

      // Assign default demo plan if it exists
      const defaultPlan = await tx.subscriptionPlan.findFirst();
      if (defaultPlan) {
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await tx.tenantSubscription.create({
          data: {
            tenantId: newTenant.id,
            planId: defaultPlan.id,
            status: 'active',
            currentPeriodStart: now,
            currentPeriodEnd: nextMonth,
          },
        });
      }

      // Seed default modules for newly created tenants.
      const defaultModules = ['website-cms', 'theme-engine', 'member-crm', 'salvation-new-believer-journey'];
      for (const modKey of defaultModules) {
        const catalog = platformModules.find((item) => item.key === modKey);
        const def = await tx.moduleDefinition.upsert({
          where: { key: modKey },
          update: catalog ? { name: catalog.name, category: catalog.category, dependencies: JSON.stringify(catalog.dependencies) } : {},
          create: {
            key: modKey,
            name: catalog?.name || modKey.split('-').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' '),
            category: catalog?.category || 'Platform',
            dependencies: JSON.stringify(catalog?.dependencies || []),
          },
        });
        if (def) {
          await tx.tenantModule.create({
            data: {
              tenantId: newTenant.id,
              moduleKey: modKey,
              status: 'active',
              billingRule: 'free',
              usageLimits: '{}',
            },
          });
        }
      }

      return newTenant;
    });

    res.status(201).json({ data: tenant });
  } catch (err: any) {
    console.error('Super Admin create tenant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const tenant = await tenantWithAdminIncludes(req.params.id as string);
    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    const data = await TenantProvisioningService.tenantListItem(tenant);
    res.json({
      data: {
        ...data,
        tenantDomains: tenantDomains(tenant),
        domains: tenantDomains(tenant),
        websites: tenant.websites,
      },
    });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, subdomain, customDomain, status } = req.body;

    const existing = await prisma.tenant.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Validate unique subdomain if changing
    if (subdomain && subdomain !== existing.subdomain) {
      const dupeSub = await prisma.tenant.findUnique({ where: { subdomain } });
      if (dupeSub) {
        res.status(409).json({ error: 'Subdomain already exists' });
        return;
      }
    }

    // Validate unique custom domain if changing
    if (customDomain && customDomain !== existing.customDomain) {
      const dupeDom = await prisma.tenant.findUnique({ where: { customDomain } });
      if (dupeDom) {
        res.status(409).json({ error: 'Custom domain already registered' });
        return;
      }
    }

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(subdomain !== undefined && { subdomain }),
        ...(customDomain !== undefined && { customDomain: customDomain || null }),
        ...(status !== undefined && { status }),
      },
    });

    res.json({ data: updated });
  } catch (err: any) {
    console.error('Super Admin update tenant error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/tenants/:id', async (req: Request, res: Response) => {
  try {
    const updated = await prisma.tenant.update({
      where: { id: req.params.id as string },
      data: { status: 'archived' },
    });
    res.json({ data: updated, message: 'Tenant archived' });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/tenants/:id/modules', async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.id as string;
    const moduleKey = String(req.body?.moduleKey || '').trim();
    const status = String(req.body?.status || 'active').trim();
    if (!moduleKey) {
      res.status(400).json({ error: 'moduleKey is required' });
      return;
    }

    if (status === 'inactive') {
      await prisma.tenantModule.deleteMany({ where: { tenantId, moduleKey } });
      res.json({ data: { tenantId, moduleKey, status: 'inactive' } });
      return;
    }

    await ensureModuleDefinition(moduleKey);
    const entitlement = await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
      create: {
        tenantId,
        moduleKey,
        status,
        billingRule: req.body?.billingRule || 'free',
        usageLimits: JSON.stringify(req.body?.usageLimits || {}),
      },
      update: {
        status,
        ...(req.body?.billingRule !== undefined && { billingRule: req.body.billingRule }),
        ...(req.body?.usageLimits !== undefined && { usageLimits: JSON.stringify(req.body.usageLimits || {}) }),
      },
    });
    res.json({ data: entitlement });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/tenants/:id/subscription', async (req: Request, res: Response) => {
  try {
    const data = await BillingService.subscribeTenant(req.params.id as string, null, {
      planId: req.body?.planId,
      couponCode: req.body?.couponCode,
      provider: req.body?.provider,
      providerMode: req.body?.providerMode,
      trialDays: req.body?.trialDays ? Number(req.body.trialDays) : 0,
    });
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/tenants/:id/extend-trial', async (req: Request, res: Response) => {
  try {
    const days = Number(req.body?.days || 0);
    if (!Number.isFinite(days) || days <= 0) {
      res.status(400).json({ error: 'days must be a positive number' });
      return;
    }
    const current = await prisma.tenantSubscription.findUnique({ where: { tenantId: req.params.id as string } });
    if (!current) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }
    const base = current.trialEndsAt && current.trialEndsAt > new Date() ? current.trialEndsAt : new Date();
    const trialEndsAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
    const data = await prisma.tenantSubscription.update({
      where: { tenantId: req.params.id as string },
      data: { trialEndsAt, status: 'trialing' },
      include: { plan: true },
    });
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/domains', async (_req: Request, res: Response) => {
  try {
    const tenants = await prisma.tenant.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ data: tenants.flatMap(tenantDomains) });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/domains/:id/verify', async (req: Request, res: Response) => {
  res.json({
    data: {
      id: req.params.id,
      status: 'active',
      sslStatus: 'active',
      verificationStatus: 'verified',
      verifiedAt: new Date().toISOString(),
    },
  });
});

router.get('/subscriptions', async (_req: Request, res: Response) => {
  try {
    const data = await prisma.tenantSubscription.findMany({
      include: { tenant: true, plan: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/usage', async (_req: Request, res: Response) => {
  try {
    const meters = await prisma.usageMeter.findMany({
      include: { tenant: true },
      orderBy: { updatedAt: 'desc' },
    });
    const rows = new Map<string, any>();
    for (const meter of meters) {
      const current = rows.get(meter.tenantId) || {
        tenant: meter.tenant,
        smsSent: 0,
        storageUsedBytes: 0,
        bandwidthUsedBytes: 0,
        aiTokensUsed: 0,
      };
      if (meter.metricKey === 'sms_sent') current.smsSent += Number(meter.quantity || 0);
      if (meter.metricKey === 'storage_gb') current.storageUsedBytes += Number(meter.quantity || 0) * 1024 * 1024 * 1024;
      if (meter.metricKey === 'video_bandwidth_gb') current.bandwidthUsedBytes += Number(meter.quantity || 0) * 1024 * 1024 * 1024;
      if (meter.metricKey === 'ai_tokens') current.aiTokensUsed += Number(meter.quantity || 0);
      rows.set(meter.tenantId, current);
    }
    res.json({ data: Array.from(rows.values()) });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/marketplace', async (_req: Request, res: Response) => {
  try {
    const submissions = await prisma.assetSubmission.findMany({
      include: {
        asset: {
          include: {
            developer: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    tenant: { select: { id: true, name: true, subdomain: true } },
                  },
                },
              },
            },
            feedbacks: true,
            purchases: true,
            submissions: { orderBy: { submittedAt: 'desc' } },
          },
        },
        reviews: true,
      },
      orderBy: { submittedAt: 'desc' },
    });
    res.json({
      data: submissions.map((submission) => ({
        ...submission,
        asset: marketplaceAssetPayload(submission.asset),
      })),
    });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/marketplace/developers', async (_req: Request, res: Response) => {
  try {
    const developers = await prisma.developerProfile.findMany({
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
            purchases: true,
            submissions: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        sandboxTenants: { include: { tenant: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      data: developers.map((developer) => {
        const purchases = developer.assets.flatMap((asset) => asset.purchases || []);
        return {
          ...developer,
          tenant: developer.user?.tenant
            ? {
                ...developer.user.tenant,
                subdomainHost: subdomainHost(developer.user.tenant.subdomain),
              }
            : null,
          assetsCount: developer.assets.length,
          submissionsCount: developer.assets.reduce((sum, asset) => sum + asset.submissions.length, 0),
          sandboxesCount: developer.sandboxTenants.length,
          totalSales: purchases.reduce((sum, purchase) => sum + Number(purchase.amountPaid || 0), 0),
          developerShare: purchases.reduce((sum, purchase) => sum + Number(purchase.developerShare || 0), 0),
        };
      }),
    });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/marketplace/assets', async (_req: Request, res: Response) => {
  try {
    const assets = await prisma.marketplaceAsset.findMany({
      include: {
        developer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                tenant: { select: { id: true, name: true, subdomain: true } },
              },
            },
          },
        },
        submissions: { orderBy: { submittedAt: 'desc' } },
        feedbacks: true,
        purchases: true,
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ data: assets.map(marketplaceAssetPayload) });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/marketplace/audit-logs', async (_req: Request, res: Response) => {
  try {
    const logs = await prisma.developerMarketplaceModuleActivity.findMany({
      include: { tenant: { select: { id: true, name: true, subdomain: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({
      data: logs
        .map(marketplaceLogPayload)
        .filter((log) => log.metadata.moduleKey === 'marketplace' || String(log.action).includes('asset') || String(log.action).includes('developer')),
    });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/marketplace/security-reviews', async (_req: Request, res: Response) => {
  try {
    const [submissions, manualLogs] = await Promise.all([
      prisma.assetSubmission.findMany({
        include: {
          asset: { include: { developer: true } },
          reviews: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: { submittedAt: 'desc' },
      }),
      prisma.developerMarketplaceModuleActivity.findMany({
        where: { actionType: 'security_review' },
        include: { tenant: { select: { id: true, name: true, subdomain: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const manual = manualLogs.map((log) => {
      const metadata = parseJson<Record<string, any>>(log.metadataJson, {});
      return {
        id: log.id,
        assetId: metadata.assetId,
        version: { id: metadata.versionId || metadata.submissionId, version: metadata.version || '1.0.0' },
        status: metadata.status || 'pending',
        reviewerId: log.userId,
        scannedAt: log.createdAt,
        notes: metadata.notes || '',
        tenant: log.tenant,
      };
    });

    const synthesized = submissions.map((submission) => ({
      id: `${submission.id}:scan`,
      assetId: submission.assetId,
      asset: submission.asset,
      version: { id: submission.id, version: submission.version },
      status: submissionSecurityStatus(submission),
      reviewerId: submission.reviews[0]?.reviewerId || null,
      scannedAt: submission.reviews[0]?.createdAt || submission.submittedAt,
      notes: submission.reviews[0]?.notes || (submission.status === 'pending' ? 'Awaiting manual review.' : 'Review completed.'),
    }));

    res.json({ data: [...manual, ...synthesized] });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/submissions/:id/review', async (req: Request, res: Response) => {
  try {
    const submission = await prisma.assetSubmission.findUnique({
      where: { id: req.params.id as string },
      include: { asset: { include: { developer: { include: { user: true } } } } },
    });
    if (!submission) {
      res.status(404).json({ error: 'Submission not found' });
      return;
    }

    const review = await reviewSubmission(req.params.id as string, 'super-admin', req.body?.decision, req.body?.notes);
    const tenantId = submission.asset.developer.user.tenantId;
    await logMarketplaceActivity(tenantId, 'super-admin', 'review_submission', {
      assetId: submission.assetId,
      submissionId: submission.id,
      version: submission.version,
      decision: req.body?.decision,
      notes: req.body?.notes,
    });
    res.status(201).json({ data: review });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/marketplace/assets/:assetId/versions/:versionId/security-review', async (req: Request, res: Response) => {
  try {
    const submission = await prisma.assetSubmission.findUnique({
      where: { id: req.params.versionId as string },
      include: { asset: { include: { developer: { include: { user: true } } } } },
    });
    if (!submission || submission.assetId !== req.params.assetId) {
      res.status(404).json({ error: 'Asset version not found' });
      return;
    }

    const tenantId = submission.asset.developer.user.tenantId;
    const activity = await logMarketplaceActivity(tenantId, 'super-admin', 'security_review', {
      assetId: req.params.assetId,
      submissionId: submission.id,
      versionId: submission.id,
      version: submission.version,
      status: req.body?.status || 'passed',
      notes: req.body?.notes || '',
    });

    res.status(201).json({
      data: {
        id: activity.id,
        assetId: req.params.assetId,
        version: { id: submission.id, version: submission.version },
        status: req.body?.status || 'passed',
        reviewerId: 'super-admin',
        scannedAt: activity.createdAt,
        notes: req.body?.notes || '',
      },
    });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/marketplace/assets/:assetId/suspend', async (req: Request, res: Response) => {
  try {
    const nextStatus = req.body?.status === 'suspended' ? 'suspended' : 'approved';
    const asset = await prisma.marketplaceAsset.update({
      where: { id: req.params.assetId as string },
      data: { status: nextStatus },
      include: { developer: { include: { user: true } } },
    });

    if (asset.type === 'plugin') {
      await prisma.pluginDefinition.updateMany({
        where: { id: asset.id },
        data: { isActive: nextStatus === 'approved' },
      });
    }

    await logMarketplaceActivity(asset.developer.user.tenantId, 'super-admin', nextStatus === 'suspended' ? 'suspend_asset' : 'unsuspend_asset', {
      assetId: asset.id,
      assetName: asset.name,
      status: nextStatus,
    });

    res.json({ data: asset });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/settings', async (_req: Request, res: Response) => {
  res.json({ data: { platformName: 'ChurchOS', defaultTrialDays: 14, signupEnabled: true } });
});

router.patch('/settings', async (req: Request, res: Response) => {
  res.json({ data: { ...req.body, updatedAt: new Date().toISOString() } });
});

// ── entitlements management ──────────────────────────────────
router.post('/entitlements', async (req: Request, res: Response) => {
  try {
    const { tenantId, moduleKey, status, billingRule, usageLimits } = req.body;

    if (!tenantId || !moduleKey) {
      res.status(400).json({ error: 'tenantId and moduleKey are required' });
      return;
    }

    // Verify tenant and module definition exist
    const [tenantExists, modDefExists] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.moduleDefinition.findUnique({ where: { key: moduleKey } }),
    ]);

    if (!tenantExists) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }
    if (!modDefExists) {
      res.status(404).json({ error: 'Module definition not found' });
      return;
    }

    const entitlement = await prisma.tenantModule.upsert({
      where: {
        tenantId_moduleKey: { tenantId, moduleKey },
      },
      update: {
        ...(status !== undefined && { status }),
        ...(billingRule !== undefined && { billingRule }),
        ...(usageLimits !== undefined && { usageLimits: JSON.stringify(usageLimits) }),
      },
      create: {
        tenantId,
        moduleKey,
        status: status || 'active',
        billingRule: billingRule || 'free',
        usageLimits: usageLimits ? JSON.stringify(usageLimits) : '{}',
      },
    });

    res.json({ data: entitlement });
  } catch (err: any) {
    console.error('Super Admin entitlement error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/super-admin/logs ──────────────────────────────────
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const level = req.query.level as string | undefined;
    const scope = req.query.scope as string | undefined;
    const limit = parseInt(req.query.limit as string || '50', 10);
    const offset = parseInt(req.query.offset as string || '0', 10);

    const logs = await prisma.observabilityLog.findMany({
      where: {
        ...(level && { logLevel: level }),
        ...(scope && { scope: { contains: scope } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await prisma.observabilityLog.count({
      where: {
        ...(level && { logLevel: level }),
        ...(scope && { scope: { contains: scope } }),
      },
    });

    res.json({
      data: logs,
      meta: {
        total,
        limit,
        offset,
      },
    });
  } catch (err: any) {
    console.error('Super Admin get logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.use((_req, res) => {
  res.json({ data: [] });
});

export default router;
