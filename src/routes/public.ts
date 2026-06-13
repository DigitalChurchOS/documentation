import { Router, Request, Response } from 'express';
import { TenantProvisioningService } from '../services/tenantProvisioning';

const router = Router();

function readSubdomain(req: Request) {
  return req.body?.subdomain || req.query.subdomain || req.body?.host || req.query.host || '';
}

function sendRouteError(res: Response, err: any) {
  const status = err?.status || 400;
  res.status(status).json({ error: err?.message || 'Request failed', details: err?.details || null });
}

router.get('/check-subdomain', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.checkSubdomainAvailability(readSubdomain(req));
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/check-subdomain', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.checkSubdomainAvailability(readSubdomain(req));
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/resolve-subdomain', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.resolveSubdomain(readSubdomain(req));
    if (!data) {
      res.status(404).json({ error: 'Church workspace not found' });
      return;
    }
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/resolve-subdomain', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.resolveSubdomain(readSubdomain(req));
    if (!data) {
      res.status(404).json({ error: 'Church workspace not found' });
      return;
    }
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

export default router;
