import { Router, Request, Response } from 'express';
import { TenantProvisioningService } from '../services/tenantProvisioning';
import prisma from '../lib/prisma';

const router = Router();

function readSubdomain(req: Request) {
  return req.body?.subdomain || req.query.subdomain || req.body?.host || req.query.host || '';
}

function readDomain(req: Request) {
  return req.body?.domain || req.query.domain || req.body?.host || req.query.host || req.body?.customDomain || req.query.customDomain || '';
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

router.get('/resolve-domain', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.resolveCustomDomain(readDomain(req));
    if (!data) {
      res.status(404).json({ error: 'Church workspace not found' });
      return;
    }
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.post('/resolve-domain', async (req: Request, res: Response) => {
  try {
    const data = await TenantProvisioningService.resolveCustomDomain(readDomain(req));
    if (!data) {
      res.status(404).json({ error: 'Church workspace not found' });
      return;
    }
    res.json({ data });
  } catch (err: any) {
    sendRouteError(res, err);
  }
});

router.get('/resolve-website-tenant', async (req: Request, res: Response) => {
  try {
    const websiteId = (req.query.websiteId || '') as string;
    if (!websiteId) {
      res.status(400).json({ error: 'websiteId is required' });
      return;
    }
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      select: { tenantId: true }
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }
    res.json({ data: { tenantId: website.tenantId } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
