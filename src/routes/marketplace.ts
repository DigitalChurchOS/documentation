import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  registerDeveloper,
  getDeveloperProfile,
  createAsset,
  submitAssetVersion,
  reviewSubmission,
  listMarketplaceAssets,
  getAssetDetails,
  purchaseMarketplaceAsset,
  installMarketplaceAsset,
  listInstalledMarketplaceAssets,
  updateInstalledMarketplaceAssetStatus,
  uninstallMarketplaceAsset,
  grantMarketplacePluginPermissions,
  listDeveloperSubmissions,
  listDeveloperSandboxes,
  listDeveloperLogs,
  getDeveloperOverview,
  submitAssetFeedback,
  createSandboxTenant,
  getDeveloperPayouts,
  logMarketplaceActivity,
} from '../services/marketplace';

const router = Router();

// All marketplace routes require authentication
router.use(authMiddleware);

// Helper helper middleware to retrieve developer profile for the user
async function requireDeveloper(req: Request, res: Response, next: any) {
  try {
    const developer = await prisma.developerProfile.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!developer) {
      res.status(403).json({ error: 'Developer profile required' });
      return;
    }

    if (developer.status !== 'active') {
      res.status(403).json({ error: 'Developer profile is suspended' });
      return;
    }

    req.developer = developer;
    next();
  } catch (err) {
    next(err);
  }
}

// Extend Request interface to support developer payload within this file context
declare global {
  namespace Express {
    interface Request {
      developer?: any;
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Developer Accounts APIs
// ─────────────────────────────────────────────────────────────

// Register Developer
router.post('/developer/register', async (req: Request, res: Response) => {
  try {
    const { companyName, website, payoutEmail } = req.body;
    const userId = req.user!.userId;

    const profile = await registerDeveloper(userId, companyName, website, payoutEmail);
    await logMarketplaceActivity(req.tenantId!, userId, 'register_developer', {
      developerId: profile.id,
      title: profile.companyName,
    });
    res.status(201).json({ data: profile });
  } catch (err: any) {
    console.error('Register developer error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Current Developer Profile
router.get('/developer/profile', async (req: Request, res: Response) => {
  try {
    const profile = await getDeveloperProfile(req.user!.userId);
    res.json({ data: profile });
  } catch (err: any) {
    console.error('Get developer profile error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Consolidated Developer Hub Overview
router.get('/developer/overview', async (req: Request, res: Response) => {
  try {
    const overview = await getDeveloperOverview(req.tenantId!, req.user!.userId);
    res.json({ data: overview });
  } catch (err: any) {
    console.error('Get developer overview error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Create Sandbox Tenant
router.post('/developer/sandbox', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const result = await createSandboxTenant(req.developer.id);
    await logMarketplaceActivity(req.tenantId!, req.user!.userId, 'create_sandbox', {
      developerId: req.developer.id,
      tenantId: result.tenant?.id,
      subdomain: result.tenant?.subdomain,
      assetName: result.tenant?.name,
    });
    res.status(201).json({ data: result });
  } catch (err: any) {
    console.error('Sandbox creation error:', err);
    res.status(400).json({ error: err.message });
  }
});

// List Sandbox Tenants
router.get('/developer/sandboxes', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const sandboxes = await listDeveloperSandboxes(req.developer.id);
    res.json({ data: sandboxes });
  } catch (err: any) {
    console.error('List sandboxes error:', err);
    res.status(400).json({ error: err.message });
  }
});

// View Developer Payouts & Earnings Report
router.get('/developer/payouts', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const report = await getDeveloperPayouts(req.developer.id);
    res.json({ data: report });
  } catch (err: any) {
    console.error('Get payouts error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Developer Activity Logs
router.get('/developer/logs', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const logs = await listDeveloperLogs(req.tenantId!);
    res.json({ data: logs });
  } catch (err: any) {
    console.error('Get developer logs error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Submissions & Assets Management (Developer Actions)
// ─────────────────────────────────────────────────────────────

// Create Asset Definition (Draft)
router.post('/assets', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const { name, description, type, pricingType, price, assetConfig } = req.body;
    const asset = await createAsset(
      req.developer.id,
      name,
      description,
      type,
      pricingType,
      price,
      assetConfig
    );
    await logMarketplaceActivity(req.tenantId!, req.user!.userId, 'create_asset', {
      developerId: req.developer.id,
      assetId: asset.id,
      assetName: asset.name,
      version: asset.version,
      type: asset.type,
    });
    res.status(201).json({ data: asset });
  } catch (err: any) {
    console.error('Create asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Submit Asset Version for Review
router.post('/assets/:assetId/submit', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const { version, changelog } = req.body;

    if (!version) {
      res.status(400).json({ error: 'version is required' });
      return;
    }

    const submission = await submitAssetVersion(assetId, version, changelog);
    await logMarketplaceActivity(req.tenantId!, req.user!.userId, 'submit_asset', {
      developerId: req.developer.id,
      assetId,
      submissionId: submission.id,
      version,
      details: changelog,
    });
    res.status(201).json({ data: submission });
  } catch (err: any) {
    console.error('Submit version error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Admin Review API
// ─────────────────────────────────────────────────────────────

// Review Submission
router.post(
  '/submissions/:submissionId/review',
  requirePermission('tenant.settings'), // Admin permission equivalent
  async (req: Request, res: Response) => {
    try {
      const submissionId = req.params.submissionId as string;
      const { decision, notes } = req.body;
      const reviewerId = req.user!.userId;

      if (!decision) {
        res.status(400).json({ error: 'decision is required' });
        return;
      }

      const review = await reviewSubmission(submissionId, reviewerId, decision, notes);
      await logMarketplaceActivity(req.tenantId!, reviewerId, 'review_submission', {
        submissionId,
        decision,
        notes,
      });
      res.status(201).json({ data: review });
    } catch (err: any) {
      console.error('Review submission error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

// Developer's own submission queue
router.get('/submissions', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const submissions = await listDeveloperSubmissions(req.developer.id);
    res.json({ data: submissions });
  } catch (err: any) {
    console.error('List submissions error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Tenant-installed marketplace assets
router.get('/installed', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const installed = await listInstalledMarketplaceAssets(req.tenantId!);
    res.json({ data: installed });
  } catch (err: any) {
    console.error('List installed marketplace assets error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Storefront & Client APIs (Tenant / User Actions)
// ─────────────────────────────────────────────────────────────

// Browse/List Marketplace Assets
router.get('/assets', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const { type, pricingType, query } = req.query;
    const assets = await listMarketplaceAssets({
      type: type as string,
      pricingType: pricingType as string,
      query: query as string,
    });
    res.json({ data: assets });
  } catch (err: any) {
    console.error('List assets error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get Asset Details
router.get('/assets/:assetId', requirePermission('member.read'), async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const details = await getAssetDetails(assetId);
    res.json({ data: details });
  } catch (err: any) {
    console.error('Get asset details error:', err);
    res.status(404).json({ error: err.message });
  }
});

// Purchase/Install Asset
router.post(
  '/assets/:assetId/purchase',
  requirePermission('tenant.settings'), // Admin action
  async (req: Request, res: Response) => {
    try {
      const assetId = req.params.assetId as string;
      const tenantId = req.tenantId!;

      const purchase = await purchaseMarketplaceAsset(tenantId, assetId);
      await logMarketplaceActivity(tenantId, req.user!.userId, 'purchase_asset', {
        assetId,
        purchaseId: purchase.id,
        amountPaid: purchase.amountPaid,
      });
      res.status(201).json({ data: purchase });
    } catch (err: any) {
      console.error('Purchase asset error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

// Install free or already-purchased marketplace asset
router.post('/assets/:assetId/install', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const assetId = req.params.assetId as string;
    const installed = await installMarketplaceAsset(req.tenantId!, assetId);
    await logMarketplaceActivity(req.tenantId!, req.user!.userId, 'install_asset', {
      assetId,
      version: installed?.version?.version,
    });
    res.status(201).json({ data: installed });
  } catch (err: any) {
    console.error('Install asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/assets/:assetId/permissions', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const permissions = Array.isArray(req.body?.permissions) ? req.body.permissions : [];
    const installed = await grantMarketplacePluginPermissions(req.tenantId!, req.params.assetId as string, permissions);
    await logMarketplaceActivity(req.tenantId!, req.user!.userId, 'grant_permissions', {
      assetId: req.params.assetId,
      permissions,
    });
    res.json({ data: installed });
  } catch (err: any) {
    console.error('Grant marketplace permissions error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/assets/:assetId/disable', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const installed = await updateInstalledMarketplaceAssetStatus(req.tenantId!, req.params.assetId as string, 'disabled');
    await logMarketplaceActivity(req.tenantId!, req.user!.userId, 'disable_asset', { assetId: req.params.assetId });
    res.json({ data: installed });
  } catch (err: any) {
    console.error('Disable marketplace asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/assets/:assetId/enable', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const installed = await updateInstalledMarketplaceAssetStatus(req.tenantId!, req.params.assetId as string, 'active');
    await logMarketplaceActivity(req.tenantId!, req.user!.userId, 'enable_asset', { assetId: req.params.assetId });
    res.json({ data: installed });
  } catch (err: any) {
    console.error('Enable marketplace asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/assets/:assetId/uninstall', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    await uninstallMarketplaceAsset(req.tenantId!, req.params.assetId as string);
    await logMarketplaceActivity(req.tenantId!, req.user!.userId, 'uninstall_asset', { assetId: req.params.assetId });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Uninstall marketplace asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/assets/:assetId/update', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const installed = await installMarketplaceAsset(req.tenantId!, req.params.assetId as string);
    await logMarketplaceActivity(req.tenantId!, req.user!.userId, 'update_asset', {
      assetId: req.params.assetId,
      versionId: req.body?.versionId,
    });
    res.json({ data: installed });
  } catch (err: any) {
    console.error('Update marketplace asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.post('/assets/:assetId/rollback', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const installed = await installMarketplaceAsset(req.tenantId!, req.params.assetId as string);
    await logMarketplaceActivity(req.tenantId!, req.user!.userId, 'rollback_asset', {
      assetId: req.params.assetId,
      versionId: req.body?.versionId,
    });
    res.json({ data: installed });
  } catch (err: any) {
    console.error('Rollback marketplace asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Leave Feedback/Rating
router.post(
  '/assets/:assetId/feedback',
  requirePermission('member.read'),
  async (req: Request, res: Response) => {
    try {
      const assetId = req.params.assetId as string;
      const tenantId = req.tenantId!;
      const userId = req.user!.userId;
      const { rating, comment } = req.body;

      if (rating === undefined) {
        res.status(400).json({ error: 'rating is required' });
        return;
      }

      const feedback = await submitAssetFeedback(tenantId, assetId, userId, Number(rating), comment);
      await logMarketplaceActivity(tenantId, userId, 'submit_feedback', {
        assetId,
        rating: Number(rating),
        details: comment,
      });
      res.status(201).json({ data: feedback });
    } catch (err: any) {
      console.error('Feedback error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
