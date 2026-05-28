import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createService,
  getService,
  updateService,
  listServices,
  generateRecurringServices,
  addScriptures,
  getScriptures,
  addAttachment,
  getAttachments,
} from '../services/churchServices';

const router = Router();

router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// SERVICE CRUD
// ─────────────────────────────────────────────────────────────

// POST /api/church-services — Create a service record
router.post('/', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { title, serviceType, serviceDate } = req.body;
    if (!title || !serviceType || !serviceDate) {
      res.status(400).json({ error: 'title, serviceType, and serviceDate are required' });
      return;
    }
    const service = await createService(req.tenantId!, req.body);
    res.status(201).json({ data: service });
  } catch (err: any) {
    console.error('Create service error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/church-services — List with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = {
      serviceType: req.query.serviceType as string | undefined,
      speakerId: req.query.speakerId as string | undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
    };

    const result = await listServices(req.tenantId!, filters);
    res.json({
      data: result.services,
      meta: { total: result.total, page: result.page, pageSize: result.pageSize },
    });
  } catch (err: any) {
    console.error('List services error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/church-services/:id — Get service detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const service = await getService(req.params.id as string, req.tenantId!);
    if (!service) {
      res.status(404).json({ error: 'Service not found' });
      return;
    }
    res.json({ data: service });
  } catch (err: any) {
    console.error('Get service error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/church-services/:id — Update service
router.put('/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const service = await updateService(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: service });
  } catch (err: any) {
    console.error('Update service error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/church-services/recurring — Generate recurring services
router.post('/recurring', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { serviceType, titleTemplate, dayOfWeek, startDate, count, speakerId } = req.body;
    if (!serviceType || !titleTemplate || dayOfWeek === undefined || !startDate || !count) {
      res.status(400).json({
        error: 'serviceType, titleTemplate, dayOfWeek, startDate, and count are required',
      });
      return;
    }
    const services = await generateRecurringServices(req.tenantId!, {
      serviceType, titleTemplate, dayOfWeek, startDate, count, speakerId,
    });
    res.status(201).json({ data: services });
  } catch (err: any) {
    console.error('Generate recurring error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// SCRIPTURES
// ─────────────────────────────────────────────────────────────

// POST /api/church-services/:id/scriptures
router.post('/:id/scriptures', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { references } = req.body;
    if (!references || !Array.isArray(references)) {
      res.status(400).json({ error: 'references array is required' });
      return;
    }
    const scriptures = await addScriptures(req.params.id as string, references);
    res.status(201).json({ data: scriptures });
  } catch (err: any) {
    console.error('Add scriptures error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/church-services/:id/scriptures
router.get('/:id/scriptures', async (req: Request, res: Response) => {
  try {
    const scriptures = await getScriptures(req.params.id as string);
    res.json({ data: scriptures });
  } catch (err: any) {
    console.error('Get scriptures error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// ATTACHMENTS
// ─────────────────────────────────────────────────────────────

// POST /api/church-services/:id/attachments
router.post('/:id/attachments', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { title, fileUrl, fileType } = req.body;
    if (!title || !fileUrl) {
      res.status(400).json({ error: 'title and fileUrl are required' });
      return;
    }
    const attachment = await addAttachment(req.params.id as string, { title, fileUrl, fileType });
    res.status(201).json({ data: attachment });
  } catch (err: any) {
    console.error('Add attachment error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/church-services/:id/attachments
router.get('/:id/attachments', async (req: Request, res: Response) => {
  try {
    const attachments = await getAttachments(req.params.id as string);
    res.json({ data: attachments });
  } catch (err: any) {
    console.error('Get attachments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
