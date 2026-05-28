import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  registerDeveloper,
  createAsset,
  submitAssetVersion,
  reviewSubmission,
  listMarketplaceAssets,
  getAssetDetails,
  purchaseMarketplaceAsset,
  submitAssetFeedback,
  createSandboxTenant,
  getDeveloperPayouts,
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
    res.status(201).json({ data: profile });
  } catch (err: any) {
    console.error('Register developer error:', err);
    res.status(400).json({ error: err.message });
  }
});

// Create Sandbox Tenant
router.post('/developer/sandbox', requireDeveloper, async (req: Request, res: Response) => {
  try {
    const result = await createSandboxTenant(req.developer.id);
    res.status(201).json({ data: result });
  } catch (err: any) {
    console.error('Sandbox creation error:', err);
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
      res.status(201).json({ data: review });
    } catch (err: any) {
      console.error('Review submission error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

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
      res.status(201).json({ data: purchase });
    } catch (err: any) {
      console.error('Purchase asset error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

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
      res.status(201).json({ data: feedback });
    } catch (err: any) {
      console.error('Feedback error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;
