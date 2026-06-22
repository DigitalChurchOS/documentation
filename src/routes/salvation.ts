import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import { requireAnyModule } from '../middleware/entitlements';
import {
  SALVATION_MODULE_KEY,
  SALVATION_MODULE_KEYS,
  registerSalvationResponse,
  recordBaptism,
  updateMilestone,
  assignCareAgent,
  getNewBelieverProfile,
  listNewBelieverProfiles,
  getNewBelieverProfileById,
  updateNewBelieverProfile,
  deleteNewBelieverProfile,
  completeReminder,
  listPendingReminders,
  getSalvationResources,
  getSalvationCompletionReport,
} from '../services/salvation';

const router = Router();
router.use(requireAnyModule(...SALVATION_MODULE_KEYS));

async function handleSalvationResponse(req: Request, res: Response): Promise<void> {
  try {
    const { firstName, lastName, email, phone, source, serviceId, funnelId, preferredLanguage, gender, age, location } = req.body;
    if (!firstName || !lastName || !email || !source) {
      res.status(400).json({ error: 'firstName, lastName, email, and source are required' });
      return;
    }

    const profile = await registerSalvationResponse(req.tenantId!, {
      firstName,
      lastName,
      email,
      phone,
      source,
      serviceId,
      funnelId,
      preferredLanguage,
      gender,
      age,
      location,
    });
    res.status(201).json({ data: profile });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────

// POST /api/salvation-new-believer-journey/respond or /api/salvation/respond
router.post('/respond', handleSalvationResponse);
router.post('/', handleSalvationResponse);

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.use(authMiddleware);

// GET /api/salvation/resources (Recommendations checklist)
router.get('/resources', requireAnyPermission(`${SALVATION_MODULE_KEY}.read`, 'member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const resources = getSalvationResources();
    res.json({ data: resources });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/salvation/profiles
router.get('/profiles', requireAnyPermission(`${SALVATION_MODULE_KEY}.read`, 'member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const profiles = await listNewBelieverProfiles(req.tenantId!);
    res.json({ data: profiles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/salvation/profiles/:memberId
router.get('/profiles/:memberId', requireAnyPermission(`${SALVATION_MODULE_KEY}.read`, 'member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await getNewBelieverProfile(req.tenantId!, req.params.memberId as string);
    res.json({ data: profile });
  } catch (err: any) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// PATCH /api/salvation/profiles/:id/baptism
router.patch('/profiles/:id/baptism', requireAnyPermission(`${SALVATION_MODULE_KEY}.update`, 'member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { baptismDate } = req.body;
    if (!baptismDate) {
      res.status(400).json({ error: 'baptismDate is required' });
      return;
    }

    const updated = await recordBaptism(req.tenantId!, req.params.id as string, new Date(baptismDate));
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/salvation/profiles/:id/assign-agent
router.patch('/profiles/:id/assign-agent', requireAnyPermission(`${SALVATION_MODULE_KEY}.update`, 'member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await assignCareAgent(req.tenantId!, req.params.id as string, req.body.assignedAgentId);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/salvation/profiles/:id/milestones
router.patch('/profiles/:id/milestones', requireAnyPermission(`${SALVATION_MODULE_KEY}.update`, 'member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { milestone, value } = req.body;
    if (!milestone || value === undefined) {
      res.status(400).json({ error: 'milestone and value are required' });
      return;
    }

    if (milestone !== 'joinedGroup' && milestone !== 'finishedClass') {
      res.status(400).json({ error: 'Invalid milestone key' });
      return;
    }

    const updated = await updateMilestone(req.tenantId!, req.params.id as string, milestone, !!value);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/salvation/reminders
router.get('/reminders', requireAnyPermission(`${SALVATION_MODULE_KEY}.read`, 'member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignedAgentId } = req.query;
    const reminders = await listPendingReminders(req.tenantId!, assignedAgentId as string || undefined);
    res.json({ data: reminders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/salvation/reminders/:id/complete
router.post('/reminders/:id/complete', requireAnyPermission(`${SALVATION_MODULE_KEY}.update`, 'member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { notes } = req.body;
    const updated = await completeReminder(req.tenantId!, req.params.id as string, notes);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/salvation/reports/completion
router.get('/reports/completion', requireAnyPermission(`${SALVATION_MODULE_KEY}.view_reports`, 'tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await getSalvationCompletionReport(req.tenantId!);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/salvation-new-believer-journey
router.get('/', requireAnyPermission(`${SALVATION_MODULE_KEY}.read`, 'member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const profiles = await listNewBelieverProfiles(req.tenantId!);
    res.json({ data: profiles });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/salvation-new-believer-journey/:id
router.get('/:id', requireAnyPermission(`${SALVATION_MODULE_KEY}.read`, 'member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await getNewBelieverProfileById(req.tenantId!, req.params.id as string);
    res.json({ data: profile });
  } catch (err: any) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// PATCH /api/salvation-new-believer-journey/:id
router.patch('/:id', requireAnyPermission(`${SALVATION_MODULE_KEY}.update`, 'member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await updateNewBelieverProfile(req.tenantId!, req.params.id as string, req.body || {});
    res.json({ data: profile });
  } catch (err: any) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// DELETE /api/salvation-new-believer-journey/:id
router.delete('/:id', requireAnyPermission(`${SALVATION_MODULE_KEY}.delete`, 'tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await deleteNewBelieverProfile(req.tenantId!, req.params.id as string);
    res.json({ data: deleted });
  } catch (err: any) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

export default router;
