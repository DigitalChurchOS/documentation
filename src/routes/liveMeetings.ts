import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createMeeting,
  getMeeting,
  listMeetings,
  startMeeting,
  endMeeting,
  joinMeetingLobby,
  updateParticipantStatus,
  updateParticipantRole,
  toggleMeetingLock,
  postMeetingChat,
  linkWorshipSession,
  trackParticipantJoin,
  trackParticipantLeave,
  scheduleMeetingReminder,
  triggerMeetingReminder,
} from '../services/liveMeetings';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────

// POST /api/meetings/:id/join (Public join lobby/waiting room)
router.post('/:id/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const { firstName, lastName, email, memberId } = req.body;

    const result = await joinMeetingLobby(req.tenantId!, meetingId, {
      firstName,
      lastName,
      email,
      memberId,
    });

    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/meetings/:id/join-log (Public join attendance log)
router.post('/:id/join-log', async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const { email } = req.body;

    const result = await trackParticipantJoin(req.tenantId!, meetingId, email);
    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/meetings/:id/leave-log (Public leave attendance log)
router.post('/:id/leave-log', async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const { email } = req.body;

    const result = await trackParticipantLeave(req.tenantId!, meetingId, email);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// AUTHENTICATED ENDPOINTS
// ─────────────────────────────────────────────────────────────
router.use(authMiddleware);

// GET /api/meetings (member.read)
router.get('/', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostMemberId, status } = req.query;
    const meetings = await listMeetings(req.tenantId!, {
      hostMemberId: hostMemberId as string || undefined,
      status: status as string || undefined,
    });
    res.json({ data: meetings });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/meetings (member.update)
router.post('/', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meeting = await createMeeting(req.tenantId!, req.body);
    res.status(201).json({ data: meeting });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/meetings/:id (member.read)
router.get('/:id', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meeting = await getMeeting(req.tenantId!, req.params.id as string);
    res.json({ data: meeting });
  } catch (err: any) {
    res.status(err.message.includes('not found') ? 404 : 400).json({ error: err.message });
  }
});

// POST /api/meetings/:id/start (member.update)
router.post('/:id/start', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const meeting = await startMeeting(req.tenantId!, meetingId);
    res.json({ data: meeting });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/meetings/:id/end (member.update)
router.post('/:id/end', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const { recordingUrl } = req.body;
    const meeting = await endMeeting(req.tenantId!, meetingId, { recordingUrl });
    res.json({ data: meeting });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/meetings/:id/participants/:pId/status (member.update)
router.patch('/:id/participants/:pId/status', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const participantId = req.params.pId as string;
    const { status } = req.body;

    if (status !== 'approved' && status !== 'rejected') {
      res.status(400).json({ error: 'Status must be approved or rejected' });
      return;
    }

    const result = await updateParticipantStatus(req.tenantId!, meetingId, participantId, status);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/meetings/:id/participants/:pId/role (member.update)
router.patch('/:id/participants/:pId/role', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const participantId = req.params.pId as string;
    const { role } = req.body;

    if (role !== 'host' && role !== 'co_host' && role !== 'participant') {
      res.status(400).json({ error: 'Role must be host, co_host, or participant' });
      return;
    }

    const result = await updateParticipantRole(req.tenantId!, meetingId, participantId, role);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/meetings/:id/lock (member.update)
router.post('/:id/lock', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const { isLocked } = req.body;

    const result = await toggleMeetingLock(req.tenantId!, meetingId, !!isLocked);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/meetings/:id/chat (member.read)
router.post('/:id/chat', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const { senderName, senderEmail, message } = req.body;

    const result = await postMeetingChat(req.tenantId!, meetingId, {
      senderName,
      senderEmail,
      message,
    });

    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/meetings/:id/worship (member.update)
router.post('/:id/worship', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const { worshipSessionId } = req.body;

    const result = await linkWorshipSession(req.tenantId!, meetingId, worshipSessionId);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/meetings/:id/reminders (tenant.settings)
router.post('/:id/reminders', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const meetingId = req.params.id as string;
    const { sendBeforeMinutes } = req.body;

    const reminder = await scheduleMeetingReminder(req.tenantId!, meetingId, Number(sendBeforeMinutes));
    res.status(201).json({ data: reminder });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/meetings/reminders/:id/trigger (tenant.settings)
router.post('/reminders/:id/trigger', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const reminderId = req.params.id as string;

    const result = await triggerMeetingReminder(req.tenantId!, reminderId);
    res.json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
