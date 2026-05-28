import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  upsertGroupSettings,
  getGroupSettings,
  createGroupType,
  listGroupTypes,
  createGroup,
  listGroups,
  getGroup,
  updateGroup,
  assignGroupRoles,
  addMemberToGroup,
  removeMemberFromGroup,
  scheduleMeeting,
  logMeetingAttendance,
  listMeetings,
  postNotice,
  delegateNoticeBoardWrite,
  createInviteLink,
  convertInvite,
  calculateScorecard,
  promoteGroup
} from '../services/cells';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC INVITE CONVERSION (BYPASSES AUTH MIDDLEWARE)
// ─────────────────────────────────────────────────────────────

router.post('/invites/convert', async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, visitorDetails } = req.body;
    if (!token || !visitorDetails || !visitorDetails.email) {
      res.status(400).json({ error: 'token and visitorDetails (containing email) are required' });
      return;
    }

    const tenantId = req.headers['x-tenant-id'] as string;
    const result = await convertInvite(tenantId, token, visitorDetails);
    res.status(200).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Apply auth to all remaining Cell routes
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// 1. SETTINGS & GROUP TYPES SETUP API
// ─────────────────────────────────────────────────────────────

router.post('/settings', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await upsertGroupSettings(req.tenantId!, req.body);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/settings', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const settings = await getGroupSettings(req.tenantId!);
    res.json({ data: settings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/types', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, tierLevel } = req.body;
    if (!name || tierLevel === undefined) {
      res.status(400).json({ error: 'name and tierLevel are required' });
      return;
    }

    const groupType = await createGroupType(req.tenantId!, req.body);
    res.status(201).json({ data: groupType });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/types', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await listGroupTypes(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. CELL / GROUP MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.post('/', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const group = await createGroup(req.tenantId!, req.body);
    res.status(201).json({ data: group });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const parentId = req.query.parentId as string | undefined;
    const groupTypeId = req.query.groupTypeId as string | undefined;
    const list = await listGroups(req.tenantId!, { parentId, groupTypeId });
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const group = await getGroup(req.tenantId!, req.params.id as string);
    res.json({ data: group });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

router.patch('/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await updateGroup(req.tenantId!, req.params.id as string, req.body);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/roles', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await assignGroupRoles(req.tenantId!, req.params.id as string, req.body);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. GROUP MEMBERS ROSTER API
// ─────────────────────────────────────────────────────────────

router.post('/:id/members', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId, role } = req.body;
    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' });
      return;
    }

    const membership = await addMemberToGroup(req.tenantId!, req.params.id as string, memberId, role);
    res.status(201).json({ data: membership });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id/members/:memberId', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await removeMemberFromGroup(req.tenantId!, req.params.id as string, req.params.memberId as string);
    res.json({ message: 'Member removed from cell roster successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. MEETINGS & ATTENDANCE API
// ─────────────────────────────────────────────────────────────

router.post('/:id/meetings', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meeting = await scheduleMeeting(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: meeting });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/:id/meetings', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await listMeetings(req.tenantId!, req.params.id as string);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/meetings/:meetingId/attendance', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { attendances } = req.body;
    if (!attendances || !Array.isArray(attendances)) {
      res.status(400).json({ error: 'attendances list is required' });
      return;
    }

    const updatedMeeting = await logMeetingAttendance(
      req.tenantId!,
      req.params.meetingId as string,
      attendances,
      req.user!.userId
    );
    res.json({ data: updatedMeeting });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. NOTICE BOARD COMMUNICATION API
// ─────────────────────────────────────────────────────────────

router.get('/:id/notice-board', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const group = await getGroup(req.tenantId!, req.params.id as string);
    res.json({ data: group.noticeBoard?.posts || [] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/notice-board', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await postNotice(req.tenantId!, req.params.id as string, req.user!.userId, req.body);
    res.status(201).json({ data: post });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/notice-board/delegate', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      res.status(400).json({ error: 'memberId is required' });
      return;
    }

    const delegated = await delegateNoticeBoardWrite(req.tenantId!, req.params.id as string, memberId);
    res.json({ data: delegated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. INVITE LINKS API
// ─────────────────────────────────────────────────────────────

router.post('/:id/invites', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { createdByMemberId, customMessage } = req.body;
    if (!createdByMemberId) {
      res.status(400).json({ error: 'createdByMemberId is required' });
      return;
    }

    const inviteLink = await createInviteLink(req.tenantId!, req.params.id as string, createdByMemberId, customMessage);
    res.status(201).json({ data: inviteLink });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. ACCREDITATION SCORECARD & PROMOTIONS API
// ─────────────────────────────────────────────────────────────

router.get('/:id/scorecard', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const scorecard = await calculateScorecard(req.tenantId!, req.params.id as string);
    res.json({ data: scorecard });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/:id/promote', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const promotion = await promoteGroup(req.tenantId!, req.params.id as string, req.user!.userId);
    res.json({ data: promotion });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
