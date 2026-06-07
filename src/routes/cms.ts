import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { dnsMiddleware } from '../middleware/dns';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
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
    const previewToken = req.query.previewToken as string | undefined;

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

    let isPreview = false;
    if (previewToken) {
      try {
        const decoded = jwt.verify(previewToken, process.env.JWT_SECRET || 'fallback-secret') as any;
        if (decoded && decoded.pageId) {
          isPreview = true;
        }
      } catch (err) {
        res.status(401).json({ error: 'Invalid or expired preview token' });
        return;
      }
    }

    // Retrieve page layout
    const page = await prisma.page.findFirst({
      where: {
        websiteId,
        slug,
        ...(isPreview ? {} : { status: 'published' }),
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

    // Fetch active navigation menu for this website
    const navMenu = await prisma.navigationMenu.findFirst({
      where: { websiteId, isActive: true },
    });

    // Fetch footer configuration for this website
    const cmsFooter = await prisma.cmsFooter.findFirst({
      where: { websiteId },
    });

    const pageContent = isPreview ? (page.draftContent || page.content) : page.content;
    const themeSettings = (isPreview && page.website.theme.draftSettings) ? page.website.theme.draftSettings : page.website.theme.settings;

    res.json({
      data: {
        pageId: page.id,
        title: page.title,
        slug: page.slug,
        isHome: page.isHome,
        contentBlocks: JSON.parse(pageContent),
        isPreview,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: page.seoKeywords,
        navigation: navMenu ? {
          id: navMenu.id,
          name: navMenu.name,
          items: JSON.parse(navMenu.items),
        } : null,
        footer: cmsFooter ? {
          id: cmsFooter.id,
          copyrightText: cmsFooter.copyrightText,
          socialLinks: JSON.parse(cmsFooter.socialLinks),
          secondaryLinks: JSON.parse(cmsFooter.secondaryLinks),
        } : null,
        theme: {
          name: page.website.theme.name,
          settings: JSON.parse(themeSettings),
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

const requireCmsPermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

// Create a new Website profile
router.post('/websites', requireCmsPermission('core-website-cms.create', 'core-website-cms.manage_settings'), async (req: Request, res: Response) => {
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
router.post('/themes', requireCmsPermission('core-website-cms.manage_settings'), async (req: Request, res: Response) => {
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

// Helper to save page revision and enforce 15 revisions limit
async function savePageRevision(tenantId: string, pageId: string, content: string, userId?: string) {
  const lastRevision = await prisma.pageRevision.findFirst({
    where: { pageId },
    orderBy: { version: 'desc' },
  });
  const nextVersion = lastRevision ? lastRevision.version + 1 : 1;

  await prisma.pageRevision.create({
    data: {
      tenantId,
      pageId,
      content,
      version: nextVersion,
      createdById: userId || null,
    },
  });

  const revisions = await prisma.pageRevision.findMany({
    where: { pageId },
    orderBy: { version: 'desc' },
  });
  if (revisions.length > 15) {
    const oldestToKeep = revisions[14];
    await prisma.pageRevision.deleteMany({
      where: {
        pageId,
        version: { lt: oldestToKeep.version },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// PAGES CRUD & REVISIONS
// ─────────────────────────────────────────────────────────────

// Create a new CMS page
router.post('/pages', requireCmsPermission('core-website-cms.create'), async (req: Request, res: Response) => {
  try {
    const { websiteId, slug, title, content, status, isHome, seoTitle, seoDescription, seoKeywords } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!websiteId || slug === undefined || !title) {
      res.status(400).json({ error: 'websiteId, slug, and title are required' });
      return;
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId as string, tenantId },
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const duplicate = await prisma.page.findUnique({
      where: { websiteId_slug: { websiteId, slug } },
    });
    if (duplicate) {
      res.status(409).json({ error: 'A page with this slug already exists on this website' });
      return;
    }

    const pageContent = content ? (typeof content === 'string' ? content : JSON.stringify(content)) : '[]';

    const page = await prisma.page.create({
      data: {
        tenantId,
        websiteId,
        slug,
        title,
        content: pageContent,
        status: status || 'draft',
        isHome: isHome || false,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
      },
    });

    // Save initial revision
    await savePageRevision(tenantId, page.id, pageContent, userId);

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_create',
        pageId: page.id,
        metadataJson: JSON.stringify({ title: page.title, slug: page.slug }),
      },
    });

    res.status(201).json({ data: page });
  } catch (err) {
    console.error('Create page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all pages (including drafts) for editing
router.get('/pages', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
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

// Get page details by ID (including draft and metadata)
router.get('/pages/:id', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }
    res.json({ data: page });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/pages/:id', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    const existing = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const { slug, title, content, status, isHome, seoTitle, seoDescription, seoKeywords } = req.body;

    const pageContent = content !== undefined ? (typeof content === 'string' ? content : JSON.stringify(content)) : undefined;

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(pageContent !== undefined && { content: pageContent }),
        ...(status !== undefined && { status }),
        ...(isHome !== undefined && { isHome }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(seoKeywords !== undefined && { seoKeywords }),
      },
    });

    // Create a new version revision if content changed
    if (pageContent !== undefined && pageContent !== existing.content) {
      await savePageRevision(tenantId, page.id, pageContent, userId);
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_update',
        pageId: page.id,
        metadataJson: JSON.stringify({ title: page.title, slug: page.slug, updatedFields: Object.keys(req.body) }),
      },
    });

    res.json({ data: page });
  } catch (err) {
    console.error('Update page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all revisions for a specific page
router.get('/pages/:id/revisions', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const revisions = await prisma.pageRevision.findMany({
      where: { pageId: id, tenantId },
      include: {
        createdBy: {
          select: { email: true },
        },
      },
      orderBy: { version: 'desc' },
    });

    res.json({ data: revisions });
  } catch (err) {
    console.error('List revisions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rollback page content to a specific revision
router.post('/pages/:id/rollback', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { revisionId } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!revisionId) {
      res.status(400).json({ error: 'revisionId is required' });
      return;
    }

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const revision = await prisma.pageRevision.findFirst({
      where: { id: revisionId, pageId: id, tenantId },
    });
    if (!revision) {
      res.status(404).json({ error: 'Revision not found' });
      return;
    }

    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        content: revision.content,
      },
    });

    // Rollback creates a new revision version
    await savePageRevision(tenantId, page.id, revision.content, userId);

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_rollback',
        pageId: page.id,
        metadataJson: JSON.stringify({ rollbackToVersion: revision.version, revisionId }),
      },
    });

    res.json({ data: updatedPage });
  } catch (err) {
    console.error('Rollback page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// NAVIGATION MENU MANAGEMENT
// ─────────────────────────────────────────────────────────────

// List navigation menus
router.get('/navigation', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const menus = await prisma.navigationMenu.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    res.json({ data: menus });
  } catch (err) {
    console.error('List navigation menus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update a menu structure
router.post('/navigation', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const { id, websiteId, name, items, isActive } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!websiteId || !name) {
      res.status(400).json({ error: 'websiteId and name are required' });
      return;
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const menuItems = items ? (typeof items === 'string' ? items : JSON.stringify(items)) : '[]';

    let menu;
    if (id) {
      // ownership check
      const existing = await prisma.navigationMenu.findFirst({
        where: { id, tenantId },
      });
      if (!existing) {
        res.status(404).json({ error: 'Navigation menu not found' });
        return;
      }
      menu = await prisma.navigationMenu.update({
        where: { id },
        data: {
          name,
          items: menuItems,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    } else {
      menu = await prisma.navigationMenu.create({
        data: {
          tenantId,
          websiteId,
          name,
          items: menuItems,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'navigation_update',
        metadataJson: JSON.stringify({ menuId: menu.id, name: menu.name }),
      },
    });

    res.json({ data: menu });
  } catch (err) {
    console.error('Save navigation menu error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// FOOTER BUILDER MANAGEMENT
// ─────────────────────────────────────────────────────────────

// Get footer configuration for website
router.get('/footer', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const websiteId = req.query.websiteId as string;
    const tenantId = req.tenantId!;

    if (!websiteId) {
      res.status(400).json({ error: 'websiteId is required' });
      return;
    }

    const footer = await prisma.cmsFooter.findFirst({
      where: { websiteId, tenantId },
    });

    res.json({ data: footer });
  } catch (err) {
    console.error('Get footer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update website footer
router.post('/footer', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const { websiteId, copyrightText, socialLinks, secondaryLinks } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!websiteId) {
      res.status(400).json({ error: 'websiteId is required' });
      return;
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const social = socialLinks ? (typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks)) : '[]';
    const secondary = secondaryLinks ? (typeof secondaryLinks === 'string' ? secondaryLinks : JSON.stringify(secondaryLinks)) : '[]';

    const existingFooter = await prisma.cmsFooter.findFirst({
      where: { websiteId, tenantId },
    });

    let footer;
    if (existingFooter) {
      footer = await prisma.cmsFooter.update({
        where: { id: existingFooter.id },
        data: {
          copyrightText: copyrightText || null,
          socialLinks: social,
          secondaryLinks: secondary,
        },
      });
    } else {
      footer = await prisma.cmsFooter.create({
        data: {
          tenantId,
          websiteId,
          copyrightText: copyrightText || null,
          socialLinks: social,
          secondaryLinks: secondary,
        },
      });
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'footer_update',
        metadataJson: JSON.stringify({ footerId: footer.id }),
      },
    });

    res.json({ data: footer });
  } catch (err) {
    console.error('Save footer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// REUSABLE BLOCKS MANAGEMENT
// ─────────────────────────────────────────────────────────────

// List reusable blocks
router.get('/reusable-blocks', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const blocks = await prisma.reusableBlock.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    res.json({ data: blocks });
  } catch (err) {
    console.error('List reusable blocks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create reusable block
router.post('/reusable-blocks', requireCmsPermission('core-website-cms.create'), async (req: Request, res: Response) => {
  try {
    const { name, key, content } = req.body;
    const tenantId = req.tenantId!;

    if (!name || !key || !content) {
      res.status(400).json({ error: 'name, key, and content are required' });
      return;
    }

    const duplicate = await prisma.reusableBlock.findFirst({
      where: { tenantId, key },
    });
    if (duplicate) {
      res.status(409).json({ error: 'A block with this key already exists for this tenant' });
      return;
    }

    const block = await prisma.reusableBlock.create({
      data: {
        tenantId,
        name,
        key,
        content: typeof content === 'string' ? content : JSON.stringify(content),
      },
    });

    res.status(201).json({ data: block });
  } catch (err) {
    console.error('Create reusable block error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update reusable block
router.patch('/reusable-blocks/:id', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const { name, key, content } = req.body;

    const existing = await prisma.reusableBlock.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Reusable block not found' });
      return;
    }

    if (key && key !== existing.key) {
      const duplicate = await prisma.reusableBlock.findFirst({
        where: { tenantId, key, id: { not: id } },
      });
      if (duplicate) {
        res.status(409).json({ error: 'A block with this key already exists for this tenant' });
        return;
      }
    }

    const block = await prisma.reusableBlock.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(key !== undefined && { key }),
        ...(content !== undefined && { content: typeof content === 'string' ? content : JSON.stringify(content) }),
      },
    });

    res.json({ data: block });
  } catch (err) {
    console.error('Update reusable block error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// AUDIT LOGS (CMS ACTIVITY LOGS)
// ─────────────────────────────────────────────────────────────

// Get CMS activity logs
router.get('/activity-logs', requireCmsPermission('core-website-cms.view_reports'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const logs = await prisma.cmsActivityLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100, // cap to 100 for safety
    });

    res.json({ data: logs });
  } catch (err) {
    console.error('Get CMS activity logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save page visual changes to draftContent
router.patch('/pages/:id/draft', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const { draftContent } = req.body;

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const contentStr = typeof draftContent === 'string' ? draftContent : JSON.stringify(draftContent);

    const updated = await prisma.page.update({
      where: { id },
      data: {
        draftContent: contentStr,
      },
    });

    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Promote page draftContent to live content, set status to published, and clear draftContent
router.post('/pages/:id/publish', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const nextContent = page.draftContent || page.content;

    const updated = await prisma.page.update({
      where: { id },
      data: {
        content: nextContent,
        draftContent: null,
        status: 'published',
      },
    });

    // Save page revision snapshot
    await savePageRevision(tenantId, page.id, nextContent, userId);

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_publish',
        pageId: page.id,
        metadataJson: JSON.stringify({ title: page.title, slug: page.slug }),
      },
    });

    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Generate 15-minute temporary preview JWT token
router.post('/pages/:id/preview', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const payload = {
      pageId: page.id,
      tenantId: page.tenantId,
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');

    res.json({
      data: {
        previewToken: token,
        previewUrl: `/api/cms/render?slug=${page.slug}&previewToken=${token}`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
