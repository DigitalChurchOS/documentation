import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { TenantProvisioningService } from '../services/tenantProvisioning';

const router = Router();

router.use(authMiddleware);

function sendRouteError(res: Response, err: any) {
  const status = err?.status || (String(err?.message || '').toLowerCase().includes('not found') ? 404 : 400);
  res.status(status).json({ error: err?.message || 'Request failed', details: err?.details || null });
}

function normalizeStepKey(stepKey: string) {
  return stepKey === 'website-basics' ? 'website' : stepKey;
}

router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.getOnboarding(req.tenantId!);
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.patch('/:stepKey', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.updateOnboardingStep(
      req.tenantId!,
      normalizeStepKey(req.params.stepKey as string),
      req.body || {},
      req.user?.userId || null,
    );
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/:stepKey/skip', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.skipOnboardingStep(
      req.tenantId!,
      normalizeStepKey(req.params.stepKey as string),
    );
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/skip/:stepKey', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.skipOnboardingStep(
      req.tenantId!,
      normalizeStepKey(req.params.stepKey as string),
    );
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/invite-team', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.inviteTeamMember(
      req.tenantId!,
      req.body?.email,
      req.body?.roleName || 'Admin',
      req.user?.userId || null,
    );
    res.status(201).json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/complete', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.completeOnboarding(req.tenantId!, req.user?.userId || null);
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

export default router;
