import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission, requirePermission } from '../middleware/rbac';
import { checkSubscriptionLimit } from '../services/billing';
import { dispatchPluginWebhooks } from '../services/plugins';
import {
  searchMembers,
  getMemberProfile,
  getMemberPortalAccount,
  updateMemberSelfProfile,
  upsertMemberNotificationPreferences,
  listMemberSelfActivity,
  getMemberModuleSettings,
  updateMemberModuleSettings,
  getMemberReportsSummary,
  listMemberActivityEvents,
  createMemberNote,
  listMemberNotes,
  createMemberCheckIn,
  listMemberCheckIns,
  upsertMemberTag,
  assignTagToMember,
  removeTagFromMember,
  getMemberFinancialHistory,
  recordMemberEvent,
} from '../services/members';

const router = Router();

router.use(authMiddleware);

const requireMemberReports = requireAnyPermission('member.view_reports', 'tenant.settings');
const requireMemberSettings = requireAnyPermission('member.manage_settings', 'tenant.settings');
const requireMemberFinance = requireAnyPermission('member.view_reports', 'tenant.settings', 'finance.read');

function cleanEmail(email: unknown): string | null {
  if (typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  return normalized || null;
}

function dateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function buildSearchOptions(query: Request['query']) {
  return {
    search: query.search as string,
    status: query.status as string,
    tagName: query.tagName as string,
    gender: query.gender as string,
    branchId: query.branchId as string,
    familyId: query.familyId as string,
    ageMin: query.ageMin ? Number(query.ageMin) : undefined,
    ageMax: query.ageMax ? Number(query.ageMax) : undefined,
    hasEmail: query.hasEmail as any,
    joinedAfter: query.joinedAfter as string,
    joinedBefore: query.joinedBefore as string,
    sortBy: query.sortBy as string,
    sortDir: query.sortDir as string,
    page: query.page ? parseInt(query.page as string, 10) : 1,
    limit: query.limit ? parseInt(query.limit as string, 10) : 50,
  };
}

// Self-service member account routes used by public church themes.
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const account = await getMemberPortalAccount(req.tenantId!, req.user!.userId);
    await recordMemberEvent(req.tenantId!, 'profile_view', {
      memberId: account.member.id,
      userId: req.user!.userId,
      metadata: { source: 'member_portal' },
    });
    res.json({ data: account });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await updateMemberSelfProfile(req.tenantId!, req.user!.userId, req.body || {});
    res.json({ data: member });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/me/finance', async (req: Request, res: Response): Promise<void> => {
  try {
    const account = await getMemberPortalAccount(req.tenantId!, req.user!.userId);
    if (!account.settings.showGivingHistory) {
      res.status(403).json({ error: 'Giving history is disabled for member accounts' });
      return;
    }
    res.json({ data: account.giving });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.get('/me/activity', async (req: Request, res: Response): Promise<void> => {
  try {
    const activity = await listMemberSelfActivity(req.tenantId!, req.user!.userId);
    res.json({ data: activity });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/me/preferences', async (req: Request, res: Response): Promise<void> => {
  try {
    const preferences = await upsertMemberNotificationPreferences(req.tenantId!, req.user!.userId, req.body || {});
    res.json({ data: preferences });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Module settings, reporting, and segmentation for the tenant dashboard.
router.get('/settings', requireMemberSettings, async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getMemberModuleSettings(req.tenantId!);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/settings', requireMemberSettings, async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await updateMemberModuleSettings(req.tenantId!, req.body || {}, req.user?.userId);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reports/summary', requireMemberReports, async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await getMemberReportsSummary(req.tenantId!);
    res.json({ data: summary });
  } catch (err: any) {
    console.error('Member reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/activities', requireMemberReports, async (req: Request, res: Response): Promise<void> => {
  try {
    const activity = await listMemberActivityEvents(req.tenantId!, {
      memberId: req.query.memberId as string,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });
    res.json({ data: activity });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/segments', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const results = await searchMembers(req.tenantId!, buildSearchOptions(req.query));
    res.json({ data: results.data, count: results.count });
  } catch (err: any) {
    console.error('Segment members error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/tags', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const tags = await prisma.memberTag.findMany({
      where: { tenantId: req.tenantId! },
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ data: tags });
  } catch (err: any) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/tags', requireMemberSettings, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const tag = await upsertMemberTag(req.tenantId!, name);
    res.status(201).json({ data: tag });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const results = await searchMembers(req.tenantId!, buildSearchOptions(req.query));
    res.json({ data: results.data, count: results.count });
  } catch (err: any) {
    console.error('List members error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requirePermission('member.create'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      firstName,
      lastName,
      phone,
      email,
      photoUrl,
      gender,
      birthday,
      address,
      emergencyContact,
      membershipStatus,
      branchId,
      familyId,
      familyRole,
    } = req.body;

    if (!firstName || !lastName) {
      res.status(400).json({ error: 'firstName and lastName are required' });
      return;
    }

    const limitCheck = await checkSubscriptionLimit(req.tenantId!, 'active_members', 1);
    if (!limitCheck.allowed) {
      res.status(403).json({ error: limitCheck.reason });
      return;
    }

    const member = await prisma.member.create({
      data: {
        tenantId: req.tenantId!,
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        phone: phone || null,
        email: cleanEmail(email),
        photoUrl: photoUrl || null,
        gender: gender || null,
        birthday: dateOrNull(birthday),
        address: address || null,
        emergencyContact: emergencyContact ? JSON.stringify(emergencyContact) : null,
        membershipStatus: membershipStatus || 'visitor',
        branchId: branchId || null,
        familyId: familyId || null,
        familyRole: familyRole || null,
      },
    });

    await dispatchPluginWebhooks(req.tenantId!, 'member.created', member);
    await recordMemberEvent(req.tenantId!, 'created', {
      memberId: member.id,
      userId: req.user?.userId,
      metadata: { source: 'tenant_dashboard' },
    });

    res.status(201).json({ data: member });
  } catch (err: any) {
    console.error('Create member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await getMemberProfile(req.tenantId!, req.params.id as string);

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    res.json({ data: member });
  } catch (err: any) {
    console.error('Get member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.member.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    const {
      firstName,
      lastName,
      phone,
      email,
      photoUrl,
      gender,
      birthday,
      address,
      emergencyContact,
      membershipStatus,
      branchId,
      familyId,
      familyRole,
    } = req.body;

    const member = await prisma.member.update({
      where: { id: req.params.id as string },
      data: {
        ...(firstName !== undefined && { firstName: String(firstName).trim() }),
        ...(lastName !== undefined && { lastName: String(lastName).trim() }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email: cleanEmail(email) }),
        ...(photoUrl !== undefined && { photoUrl }),
        ...(gender !== undefined && { gender }),
        ...(birthday !== undefined && { birthday: dateOrNull(birthday) }),
        ...(address !== undefined && { address }),
        ...(emergencyContact !== undefined && {
          emergencyContact: emergencyContact ? JSON.stringify(emergencyContact) : null,
        }),
        ...(membershipStatus !== undefined && { membershipStatus }),
        ...(branchId !== undefined && { branchId: branchId || null }),
        ...(familyId !== undefined && { familyId: familyId || null }),
        ...(familyRole !== undefined && { familyRole: familyRole || null }),
      },
    });

    await dispatchPluginWebhooks(req.tenantId!, 'member.updated', member);
    await recordMemberEvent(req.tenantId!, 'updated', {
      memberId: member.id,
      userId: req.user?.userId,
      metadata: { updatedKeys: Object.keys(req.body || {}) },
    });

    res.json({ data: member });
  } catch (err: any) {
    console.error('Update member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requirePermission('member.delete'), async (req: Request, res: Response): Promise<void> => {
  try {
    const existing = await prisma.member.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });

    if (!existing) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    await prisma.$transaction([
      prisma.notificationPreference.deleteMany({ where: { memberId: existing.id } }),
      prisma.memberNote.deleteMany({ where: { memberId: existing.id } }),
      prisma.memberCheckIn.deleteMany({ where: { memberId: existing.id } }),
      prisma.memberTagAssignment.deleteMany({ where: { memberId: existing.id } }),
      prisma.member.delete({ where: { id: existing.id } }),
    ]);

    await dispatchPluginWebhooks(req.tenantId!, 'member.deleted', existing);
    await recordMemberEvent(req.tenantId!, 'deleted', {
      memberId: existing.id,
      userId: req.user?.userId,
    });

    res.status(204).send();
  } catch (err: any) {
    console.error('Delete member error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/notes', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const note = await createMemberNote(req.tenantId!, req.params.id as string, req.user!.userId, req.body);
    res.status(201).json({ data: note });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/notes', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const notes = await listMemberNotes(req.tenantId!, req.params.id as string);
    res.json({ data: notes });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/checkins', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const checkIn = await createMemberCheckIn(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: checkIn });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/checkins', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const checkIns = await listMemberCheckIns(req.tenantId!, req.params.id as string);
    res.json({ data: checkIns });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/tags/:tagId', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const assignment = await assignTagToMember(req.tenantId!, req.params.id as string, req.params.tagId as string);
    res.status(201).json({ data: assignment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id/tags/:tagId', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await removeTagFromMember(req.tenantId!, req.params.id as string, req.params.tagId as string);
    res.json({ success: true, message: 'Tag removed successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/finance', requireMemberFinance, async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });

    if (!member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }

    if (!member.email) {
      res.status(400).json({ error: 'Member profile does not contain an email address' });
      return;
    }

    const history = await getMemberFinancialHistory(req.tenantId!, member.email);
    res.json({ data: history });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
