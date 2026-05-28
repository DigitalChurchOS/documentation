import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  registerSalvationResponse,
  recordBaptism,
  updateMilestone,
  getNewBelieverProfile,
  completeReminder,
  listPendingReminders,
  getSalvationResources,
  getSalvationCompletionReport,
} from '../services/salvation';
import prisma from '../lib/prisma';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────

// POST /api/salvation/respond (Public alt registration form)
router.post('/respond', async (req: Request, res: Response): Promise<void> => {
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
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.use(authMiddleware);

// GET /api/salvation/resources (Recommendations checklist)
router.get('/resources', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const resources = getSalvationResources();
    res.json({ data: resources });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/salvation/profiles/:memberId
router.get('/profiles/:memberId', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const profile = await getNewBelieverProfile(req.tenantId!, req.params.memberId as string);
    res.json({ data: profile });
  } catch (err: any) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// PATCH /api/salvation/profiles/:id/baptism
router.patch('/profiles/:id/baptism', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
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

// PATCH /api/salvation/profiles/:id/milestones
router.patch('/profiles/:id/milestones', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
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
router.get('/reminders', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { assignedAgentId } = req.query;
    const reminders = await listPendingReminders(req.tenantId!, assignedAgentId as string || undefined);
    res.json({ data: reminders });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/salvation/reminders/:id/complete
router.post('/reminders/:id/complete', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { notes } = req.body;
    const updated = await completeReminder(req.tenantId!, req.params.id as string, notes);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/salvation/reports/completion
router.get('/reports/completion', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const report = await getSalvationCompletionReport(req.tenantId!);
    res.json({ data: report });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
