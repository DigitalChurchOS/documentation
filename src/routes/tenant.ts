import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';

const router = Router();

// Secure all endpoints: requires authenticated tenant administrator
router.use(authMiddleware);
router.use(requirePermission('tenant.settings'));

/**
 * GET /api/tenant/branding
 * Retrieves church branding settings and tenant general info.
 */
router.get('/branding', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, name: true, subdomain: true, customDomain: true, status: true }
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    const brandingRecord = await prisma.moduleSettings.findUnique({
      where: {
        tenantId_moduleKey: { tenantId, moduleKey: 'domain-tenant-management' }
      }
    });

    const defaultBranding = {
      logo: '',
      favicon: '',
      timezone: 'UTC',
      accent: '#4f46e5',
      language: 'en'
    };

    let branding = defaultBranding;
    if (brandingRecord && brandingRecord.settings) {
      try {
        branding = { ...defaultBranding, ...JSON.parse(brandingRecord.settings) };
      } catch (e) {
        console.error('Failed to parse branding settings', e);
      }
    }

    res.json({ data: { tenant, branding } });
  } catch (err: any) {
    console.error('Fetch branding error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/tenant/branding
 * Updates church tenant name and customized branding presets.
 */
router.patch('/branding', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { name, logo, favicon, timezone, accent, language } = req.body;

    // 1. Update Tenant Name if provided
    if (name) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: { name }
      });
    }

    // 2. Fetch current custom branding block
    const brandingRecord = await prisma.moduleSettings.findUnique({
      where: {
        tenantId_moduleKey: { tenantId, moduleKey: 'domain-tenant-management' }
      }
    });

    let currentSettings = {};
    if (brandingRecord && brandingRecord.settings) {
      try {
        currentSettings = JSON.parse(brandingRecord.settings);
      } catch (e) {
        // ignore
      }
    }

    const updatedSettings = {
      ...currentSettings,
      ...(logo !== undefined && { logo }),
      ...(favicon !== undefined && { favicon }),
      ...(timezone !== undefined && { timezone }),
      ...(accent !== undefined && { accent }),
      ...(language !== undefined && { language })
    };

    // 3. Upsert settings override in ModuleSettings table
    await prisma.moduleSettings.upsert({
      where: {
        tenantId_moduleKey: { tenantId, moduleKey: 'domain-tenant-management' }
      },
      create: {
        tenantId,
        moduleKey: 'domain-tenant-management',
        settings: JSON.stringify(updatedSettings)
      },
      update: {
        settings: JSON.stringify(updatedSettings)
      }
    });

    res.json({ data: { name, branding: updatedSettings } });
  } catch (err: any) {
    console.error('Update branding error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tenant/domain
 * Retrieves subdomain, customDomain, instructions, and SSL status mappings.
 */
router.get('/domain', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { subdomain: true, customDomain: true }
    });

    if (!tenant) {
      res.status(404).json({ error: 'Tenant not found' });
      return;
    }

    // Fetch primary website if exists
    const primaryWebsite = await prisma.website.findFirst({
      where: { tenantId, isActive: true }
    });

    // Mock SSL & Verification records
    const dnsStatus = tenant.customDomain ? {
      verified: true,
      sslStatus: 'active',
      aRecordMatch: true,
      cnameRecordMatch: true
    } : {
      verified: false,
      sslStatus: 'none',
      aRecordMatch: false,
      cnameRecordMatch: false
    };

    res.json({
      data: {
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain || primaryWebsite?.domain || null,
        dnsStatus,
        instructions: {
          ip: '76.76.21.21',
          cname: 'cname.churchos.com'
        }
      }
    });
  } catch (err: any) {
    console.error('Fetch domain status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/tenant/domain
 * Updates custom domain on both Tenant and Website records.
 */
router.patch('/domain', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { customDomain } = req.body;

    const domainName = customDomain ? customDomain.trim().toLowerCase() : null;

    // 1. Check for duplicates in other tenants if a custom domain is specified
    if (domainName) {
      const duplicate = await prisma.tenant.findFirst({
        where: {
          id: { not: tenantId },
          customDomain: domainName
        }
      });
      if (duplicate) {
        res.status(409).json({ error: 'This custom domain is already registered to another tenant.' });
        return;
      }
    }

    // 2. Update Tenant record
    const updatedTenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { customDomain: domainName }
    });

    // 3. Update primary Website record (if exists) to map the domain search in dnsMiddleware
    const primaryWebsite = await prisma.website.findFirst({
      where: { tenantId, isActive: true }
    });

    if (primaryWebsite) {
      await prisma.website.update({
        where: { id: primaryWebsite.id },
        data: { domain: domainName }
      });
    }

    res.json({
      data: {
        subdomain: updatedTenant.subdomain,
        customDomain: updatedTenant.customDomain
      }
    });
  } catch (err: any) {
    console.error('Update custom domain error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/tenant/domain/verify
 * Simulated DNS and SSL verification endpoint.
 */
router.post('/domain/verify', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant || !tenant.customDomain) {
      res.status(400).json({ error: 'Configure a custom domain first before running verification check.' });
      return;
    }

    // Simulate standard lookup. In a live system, we would resolve DNS with `dns.promises.resolve4`.
    const success = true; 

    res.json({
      data: {
        verified: success,
        sslStatus: success ? 'active' : 'failed',
        aRecordMatch: success,
        cnameRecordMatch: success,
        lastChecked: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error('Verify domain DNS error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tenant/modules
 * Lists all module definitions along with their subscription/activation status.
 */
router.get('/modules', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    // Fetch all seeded modules
    const definitions = await prisma.moduleDefinition.findMany({
      orderBy: { key: 'asc' }
    });

    // Fetch activated status for this tenant
    const activeModules = await prisma.tenantModule.findMany({
      where: { tenantId }
    });

    const activeMap = new Map(activeModules.map(m => [m.moduleKey, m]));

    const result = definitions.map(def => {
      const active = activeMap.get(def.key);
      return {
        key: def.key,
        name: def.name,
        category: def.category,
        dependencies: JSON.parse(def.dependencies),
        status: active ? active.status : 'inactive',
        billingRule: active ? active.billingRule : 'free'
      };
    });

    res.json({ data: result });
  } catch (err: any) {
    console.error('Fetch tenant modules registry error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/tenant/modules/:moduleKey
 * Toggles status between active and suspended / inactive.
 */
router.patch('/modules/:moduleKey', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const moduleKey = req.params.moduleKey as string;
    const { status } = req.body; // 'active' | 'suspended' | 'inactive'

    if (!['active', 'suspended', 'inactive'].includes(status)) {
      res.status(400).json({ error: 'Invalid target module status' });
      return;
    }

    if (status === 'inactive') {
      // Delete record if exists
      try {
        await prisma.tenantModule.delete({
          where: { tenantId_moduleKey: { tenantId, moduleKey } }
        });
      } catch (e) {
        // ignore if already deleted
      }
      res.json({ data: { moduleKey, status: 'inactive' } });
      return;
    }

    // Otherwise, upsert the status
    const record = await prisma.tenantModule.upsert({
      where: { tenantId_moduleKey: { tenantId, moduleKey } },
      create: {
        tenantId,
        moduleKey,
        status,
        billingRule: 'free'
      },
      update: {
        status
      }
    });

    res.json({ data: record });
  } catch (err: any) {
    console.error('Update tenant module status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/tenant/checklist
 * Calculates the onboarding launch progress checklist.
 */
router.get('/checklist', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    // 1. Domain Setup
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { customDomain: true }
    });
    const domainSetup = !!tenant?.customDomain;

    // 2. Branding Customized
    const brandingRecord = await prisma.moduleSettings.findUnique({
      where: {
        tenantId_moduleKey: { tenantId, moduleKey: 'domain-tenant-management' }
      }
    });
    let brandingSetup = false;
    if (brandingRecord && brandingRecord.settings) {
      try {
        const parsed = JSON.parse(brandingRecord.settings);
        brandingSetup = !!(parsed.logo || parsed.favicon || parsed.timezone !== 'UTC' || parsed.accent !== '#4f46e5');
      } catch (e) {
        // ignore
      }
    }

    // 3. Module Activated
    const moduleCount = await prisma.tenantModule.count({
      where: {
        tenantId,
        status: 'active'
      }
    });
    const moduleRegistry = moduleCount > 1; // True if they have active modules other than just the baseline website-cms

    // 4. Team Invited
    const inviteCount = await prisma.user.count({
      where: {
        tenantId,
        status: 'invited'
      }
    });
    const userCount = await prisma.user.count({
      where: { tenantId }
    });
    const inviteTeam = inviteCount > 0 || userCount > 1;

    res.json({
      data: {
        domainSetup,
        brandingSetup,
        moduleRegistry,
        inviteTeam
      }
    });
  } catch (err: any) {
    console.error('Calculate tenant checklist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
