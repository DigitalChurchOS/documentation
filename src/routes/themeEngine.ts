import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ThemeEngineService } from '../services/themeEngine';

const router = Router();

// Apply authentication to all theme-engine routes
router.use(authMiddleware);

/**
 * GET /api/theme-engine
 * List all theme engine module configuration profiles for the tenant.
 */
router.get('/', requirePermission('theme-engine.read'), async (req: Request, res: Response) => {
  try {
    const list = await ThemeEngineService.listThemeEngineModules(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/theme-engine
 * Activate and save module registration details.
 */
router.post('/', requirePermission('theme-engine.create'), async (req: Request, res: Response) => {
  try {
    const { title, description, visibility } = req.body;
    const userId = req.user?.userId;
    
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const moduleRecord = await ThemeEngineService.createThemeEngineModule(req.tenantId!, {
      title,
      description,
      visibility,
      createdBy: userId,
    });

    await ThemeEngineService.logActivity(req.tenantId!, userId!, 'activate_module', {
      moduleId: moduleRecord.id,
      title,
    });

    res.status(201).json({ data: moduleRecord });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/theme-engine/settings
 * Fetch settings configurations of the theme engine.
 */
router.get('/settings', requirePermission('theme-engine.read'), async (req: Request, res: Response) => {
  try {
    const settings = await ThemeEngineService.getSettings(req.tenantId!);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/theme-engine/settings
 * Update billing plan/configurations (Super Admin).
 */
router.patch('/settings', requirePermission('theme-engine.manage_settings'), async (req: Request, res: Response) => {
  try {
    const settings = await ThemeEngineService.updateSettings(req.tenantId!, req.body);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/theme-engine/reports
 * Fetch activity audit logs for reports.
 */
router.get('/reports', requirePermission('theme-engine.view_reports'), async (req: Request, res: Response) => {
  try {
    const logs = await ThemeEngineService.listActivities(req.tenantId!);
    res.json({ data: logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/theme-engine/sections
 * List available layout blocks and section templates.
 */
router.get('/sections', requirePermission('theme-engine.read'), async (req: Request, res: Response) => {
  try {
    const sections = await ThemeEngineService.listSectionTemplates(req.tenantId!);
    res.json({ data: sections });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/theme-engine/sections
 * Developer registers a custom section template.
 */
router.post('/sections', requirePermission('theme-engine.create'), async (req: Request, res: Response) => {
  try {
    const { name, key, structureJson } = req.body;
    if (!name || !key || !structureJson) {
      res.status(400).json({ error: 'name, key, and structureJson are required' });
      return;
    }

    const section = await ThemeEngineService.registerSectionTemplate(req.tenantId!, {
      name,
      key,
      structureJson,
    });

    await ThemeEngineService.logActivity(req.tenantId!, req.user!.userId, 'register_section', { name, key });

    res.status(201).json({ data: section });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/theme-engine/themes
 * Fetch list of custom and system themes available.
 */
router.get('/themes', requirePermission('theme-engine.read'), async (req: Request, res: Response) => {
  try {
    const list = await ThemeEngineService.listTenantThemes(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/theme-engine/themes/install
 * Install theme template copy from marketplace.
 */
router.post('/themes/install', requirePermission('theme-engine.create'), async (req: Request, res: Response) => {
  try {
    const { assetId } = req.body;
    if (!assetId) {
      res.status(400).json({ error: 'assetId is required' });
      return;
    }

    const theme = await ThemeEngineService.installThemeFromMarketplace(req.tenantId!, assetId);
    
    await ThemeEngineService.logActivity(req.tenantId!, req.user!.userId, 'install_theme', {
      themeId: theme.id,
      name: theme.name,
    });

    res.status(201).json({ data: theme });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/theme-engine/themes/:themeId
 * Fetch module record details.
 */
router.get('/:id', requirePermission('theme-engine.read'), async (req: Request, res: Response) => {
  try {
    const details = await ThemeEngineService.getThemeEngineModule(req.params.id as string, req.tenantId!);
    res.json({ data: details });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * PATCH /api/theme-engine/:id
 * Edit config settings details.
 */
router.patch('/:id', requirePermission('theme-engine.update'), async (req: Request, res: Response) => {
  try {
    const record = await ThemeEngineService.updateThemeEngineModule(req.params.id as string, req.tenantId!, req.body);
    
    await ThemeEngineService.logActivity(req.tenantId!, req.user!.userId, 'update_module', {
      moduleId: record.id,
      fields: Object.keys(req.body),
    });

    res.json({ data: record });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * DELETE /api/theme-engine/:id
 * Delete theme engine module registration.
 */
router.delete('/:id', requirePermission('theme-engine.delete'), async (req: Request, res: Response) => {
  try {
    await ThemeEngineService.deleteThemeEngineModule(req.params.id as string, req.tenantId!);
    
    await ThemeEngineService.logActivity(req.tenantId!, req.user!.userId, 'delete_module', {
      moduleId: req.params.id,
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * POST /api/theme-engine/themes/:themeId/activate
 * Set active website domain style theme mapping.
 */
router.post('/themes/:themeId/activate', requirePermission('theme-engine.update'), async (req: Request, res: Response) => {
  try {
    const { websiteId } = req.body;
    if (!websiteId) {
      res.status(400).json({ error: 'websiteId is required' });
      return;
    }

    const updatedWebsite = await ThemeEngineService.activateThemeForWebsite(req.tenantId!, websiteId, req.params.themeId as string);
    
    await ThemeEngineService.logActivity(req.tenantId!, req.user!.userId, 'activate_theme', {
      websiteId,
      themeId: req.params.themeId,
    });

    res.json({ data: updatedWebsite });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * PATCH /api/theme-engine/themes/:themeId/customize
 * Modify palette variables, fonts typography, branding, logo urls or custom CSS blocks.
 */
router.patch('/themes/:themeId/customize', requirePermission('theme-engine.update'), async (req: Request, res: Response) => {
  try {
    const updatedTheme = await ThemeEngineService.customizeTheme(req.tenantId!, req.params.themeId as string, req.body);
    
    await ThemeEngineService.logActivity(req.tenantId!, req.user!.userId, 'customize_theme', {
      themeId: req.params.themeId,
      customizations: req.body,
    });

    res.json({ data: updatedTheme });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * GET /api/theme-engine/themes/:themeId/preview
 * Staging mock layout stylesheet styles generator.
 */
router.get('/themes/:themeId/preview', requirePermission('theme-engine.read'), async (req: Request, res: Response) => {
  try {
    const previewData = await ThemeEngineService.previewTheme(req.tenantId!, req.params.themeId as string);
    res.json({ data: previewData });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

/**
 * POST /api/theme-engine/themes/:themeId/preview/customize
 * Temp staging visual styling merge preview (doesn't modify actual theme DB record).
 */
router.post('/themes/:themeId/preview/customize', requirePermission('theme-engine.update'), async (req: Request, res: Response) => {
  try {
    const previewResult = await ThemeEngineService.customizePreview(req.tenantId!, req.params.themeId as string, req.body);
    res.json({ data: previewResult });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
