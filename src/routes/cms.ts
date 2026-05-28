import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { dnsMiddleware } from '../middleware/dns';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINT: GET /api/cms/render
// ─────────────────────────────────────────────────────────────
// Resolves website pages by domain / subdomain DNS context.
// No auth required. Enforces 'published' status filter.
// ─────────────────────────────────────────────────────────────
router.get('/render', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const websiteId = (req as any).websiteId as string | undefined;
    const slug = (req.query.slug as string) || ''; // default to home page ""

    if (!tenantId || !websiteId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    // Enforce that the 'website-cms' module is active for the tenant
    const entitlement = await prisma.tenantModule.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } },
    });

    if (!entitlement || entitlement.status !== 'active') {
      res.status(403).json({ error: 'Website CMS module is inactive' });
      return;
    }

    // Retrieve published page layout
    const page = await prisma.page.findFirst({
      where: {
        websiteId,
        slug,
        status: 'published',
      },
      include: {
        website: {
          include: { theme: true },
        },
      },
    });

    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    res.json({
      data: {
        pageId: page.id,
        title: page.title,
        slug: page.slug,
        isHome: page.isHome,
        contentBlocks: JSON.parse(page.content),
        theme: {
          name: page.website.theme.name,
          settings: JSON.parse(page.website.theme.settings),
        },
      },
    });
  } catch (err) {
    console.error('Render CMS page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS (Requires authentication & entitlement locks)
// ─────────────────────────────────────────────────────────────
router.use(authMiddleware);
router.use(requireModule('website-cms'));
router.use(requirePermission('tenant.settings'));

// Create a new Website profile
router.post('/websites', async (req: Request, res: Response) => {
  try {
    const { title, description, domain, themeId } = req.body;
    const tenantId = req.tenantId!;

    if (!title || !themeId) {
      res.status(400).json({ error: 'title and themeId are required' });
      return;
    }

    // Verify theme exists and belongs to this tenant or is global (tenantId === null)
    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId as string,
        OR: [{ tenantId: null }, { tenantId }],
      },
    });

    if (!theme) {
      res.status(404).json({ error: 'Theme not found' });
      return;
    }

    const website = await prisma.website.create({
      data: {
        tenantId,
        themeId,
        title,
        description: description || null,
        domain: domain || null,
        isActive: true,
      },
    });

    res.status(201).json({ data: website });
  } catch (err) {
    console.error('Create website error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a custom Theme configuration
router.post('/themes', async (req: Request, res: Response) => {
  try {
    const { name, settings } = req.body;
    const tenantId = req.tenantId!;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const theme = await prisma.theme.create({
      data: {
        tenantId,
        name,
        settings: settings ? JSON.stringify(settings) : '{}',
        isCustom: true,
      },
    });

    res.status(201).json({ data: theme });
  } catch (err) {
    console.error('Create theme error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new CMS page
router.post('/pages', async (req: Request, res: Response) => {
  try {
    const { websiteId, slug, title, content, status, isHome } = req.body;
    const tenantId = req.tenantId!;

    if (!websiteId || slug === undefined || !title) {
      res.status(400).json({ error: 'websiteId, slug, and title are required' });
      return;
    }

    // Check if website belongs to tenant
    const website = await prisma.website.findFirst({
      where: { id: websiteId as string, tenantId },
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    // Check for duplicate slug
    const duplicate = await prisma.page.findUnique({
      where: { websiteId_slug: { websiteId, slug } },
    });
    if (duplicate) {
      res.status(409).json({ error: 'A page with this slug already exists on this website' });
      return;
    }

    const page = await prisma.page.create({
      data: {
        tenantId,
        websiteId,
        slug,
        title,
        content: content ? JSON.stringify(content) : '[]',
        status: status || 'draft',
        isHome: isHome || false,
      },
    });

    res.status(201).json({ data: page });
  } catch (err) {
    console.error('Create page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all pages (including drafts) for editing
router.get('/pages', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const pages = await prisma.page.findMany({
      where: { tenantId },
      orderBy: { slug: 'asc' },
    });

    res.json({ data: pages });
  } catch (err) {
    console.error('List pages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update page layout block content, slug, and status
router.patch('/pages/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;

    // Verify page belongs to this tenant
    const existing = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const { slug, title, content, status, isHome } = req.body;

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content: JSON.stringify(content) }),
        ...(status !== undefined && { status }),
        ...(isHome !== undefined && { isHome }),
      },
    });

    res.json({ data: page });
  } catch (err) {
    console.error('Update page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
