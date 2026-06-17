import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import prisma from '../lib/prisma';
import {
  createChannel,
  updateChannel,
  deleteChannel,
  getChannel,
  listChannels,
  createProgram,
  updateProgram,
  deleteProgram,
  listPrograms,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  listSchedules,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  listPlaylists,
  addPlaylistItem,
  removePlaylistItem,
  updatePlaylistItemSort,
  getNowPlaying,
  goLive,
  stopLive,
  createChatMessage,
  getChatMessages,
  addReaction,
  getReactions,
  createPoll,
  submitPollResponse,
  getPolls,
  createLowerThird,
  updateLowerThird,
  deleteLowerThird,
  getLowerThirds,
  listArchives,
  convertToMediaAsset,
} from '../services/tv';

const router = Router();

/**
 * ─────────────────────────────────────────────────────────────
 * PUBLIC VIEWERS/LISTENERS ENDPOINTS (NO ADMIN AUTH REQUIRED)
 * ─────────────────────────────────────────────────────────────
 */

// GET /api/tv/channels — List all channels for a tenant
router.get('/channels', async (req: Request, res: Response) => {
  try {
    const channels = await listChannels(req.tenantId!);
    res.json({ data: channels });
  } catch (err: any) {
    console.error('List TV channels error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/tv/channels/:idOrSlug — Get details of a single channel
router.get('/channels/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const channel = await getChannel(req.params.idOrSlug as string, req.tenantId!);
    res.json({ data: channel });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/tv/channels/:id/now-playing — Sync player metadata, active program & EPG
router.get('/channels/:id/now-playing', async (req: Request, res: Response) => {
  try {
    const nowPlaying = await getNowPlaying(req.params.id as string, req.tenantId!);
    res.json({ data: nowPlaying });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/tv/channels/:id/chat — Retrieve recent chat messages
router.get('/channels/:id/chat', async (req: Request, res: Response) => {
  try {
    const messages = await getChatMessages(req.params.id as string, req.tenantId!);
    res.json({ data: messages });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/channels/:id/chat — Post a chat message
router.post('/channels/:id/chat', async (req: Request, res: Response) => {
  try {
    const { displayName, message, countryCode, userRole } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const userId = req.user?.userId || null;
    const name = displayName || 'Guest Viewer';
    const role = userRole || (userId ? 'member' : 'guest');

    const chatMsg = await createChatMessage(
      req.tenantId!,
      req.params.id as string,
      userId,
      name,
      message,
      countryCode,
      role
    );
    res.status(201).json({ data: chatMsg });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tv/channels/:id/reactions — Get aggregated reaction tallies
router.get('/channels/:id/reactions', async (req: Request, res: Response) => {
  try {
    const counts = await getReactions(req.params.id as string, req.tenantId!);
    res.json({ data: counts });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/channels/:id/react — Increment reaction click
router.post('/channels/:id/react', async (req: Request, res: Response) => {
  try {
    const { reactionType } = req.body;
    if (!reactionType) {
      res.status(400).json({ error: 'reactionType is required' });
      return;
    }

    const rx = await addReaction(req.tenantId!, req.params.id as string, reactionType);
    res.status(201).json({ data: rx });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tv/channels/:id/schedules — Get channel program calendar
router.get('/channels/:id/schedules', async (req: Request, res: Response) => {
  try {
    const schedules = await listSchedules(req.params.id as string, req.tenantId!);
    res.json({ data: schedules });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tv/channels/:id/archives — List replay library
router.get('/channels/:id/archives', async (req: Request, res: Response) => {
  try {
    const archives = await listArchives(req.params.id as string, req.tenantId!);
    res.json({ data: archives });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tv/channels/:id/polls — List active and historical polls
router.get('/channels/:id/polls', async (req: Request, res: Response) => {
  try {
    const polls = await getPolls(req.params.id as string, req.tenantId!);
    res.json({ data: polls });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/polls/:pollId/vote — Submit poll vote option
router.post('/polls/:pollId/vote', async (req: Request, res: Response) => {
  try {
    const { option } = req.body;
    if (!option) {
      res.status(400).json({ error: 'Option is required' });
      return;
    }
    const userId = req.user?.userId || null;
    const resp = await submitPollResponse(req.params.pollId as string, userId, option);
    res.status(201).json({ data: resp });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tv/channels/:id/lower-thirds — Retrieve active overlay lower thirds
router.get('/channels/:id/lower-thirds', async (req: Request, res: Response) => {
  try {
    const overlays = await getLowerThirds(req.params.id as string, req.tenantId!);
    res.json({ data: overlays });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * AUTHENTICATED ADMIN CONSOLE ENDPOINTS
 * ─────────────────────────────────────────────────────────────
 */

router.use(authMiddleware);

// POST /api/tv/channels — Create channel
router.post('/channels', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const channel = await createChannel(req.tenantId!, req.body);
    res.status(201).json({ data: channel });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/tv/channels/:id — Update channel branding or stream details
router.put('/channels/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const channel = await updateChannel(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: channel });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tv/channels/:id — Delete channel
router.delete('/channels/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const channel = await deleteChannel(req.params.id as string, req.tenantId!);
    res.json({ data: channel });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/channels/:id/go-live — Start broadcasting immediately
router.post('/channels/:id/go-live', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const channel = await goLive(req.params.id as string, req.tenantId!);
    res.json({ data: channel });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/channels/:id/stop-live — Stop broadcasting, archives active stream
router.post('/channels/:id/stop-live', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const channel = await stopLive(req.params.id as string, req.tenantId!);
    res.json({ data: channel });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tv/channels/:id/programs — List all programs
router.get('/channels/:id/programs', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const programs = await listPrograms(req.params.id as string, req.tenantId!);
    res.json({ data: programs });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/channels/:id/programs — Create a program
router.post('/channels/:id/programs', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const program = await createProgram(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: program });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/tv/programs/:id — Update program info
router.put('/programs/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const program = await updateProgram(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: program });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tv/programs/:id — Delete program
router.delete('/programs/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const program = await deleteProgram(req.params.id as string, req.tenantId!);
    res.json({ data: program });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/programs/:programId/schedules — Add schedule entry
router.post('/programs/:programId/schedules', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const schedule = await createSchedule(req.tenantId!, req.params.programId as string, req.body);
    res.status(201).json({ data: schedule });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/tv/schedules/:id — Update schedule entry
router.put('/schedules/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const schedule = await updateSchedule(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: schedule });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tv/schedules/:id — Delete schedule entry
router.delete('/schedules/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const schedule = await deleteSchedule(req.params.id as string, req.tenantId!);
    res.json({ data: schedule });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/tv/channels/:id/playlists — List all playlists
router.get('/channels/:id/playlists', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlists = await listPlaylists(req.params.id as string, req.tenantId!);
    res.json({ data: playlists });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/channels/:id/playlists — Create playlist
router.post('/channels/:id/playlists', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlist = await createPlaylist(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/tv/playlists/:id — Update playlist details
router.put('/playlists/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlist = await updatePlaylist(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tv/playlists/:id — Delete playlist
router.delete('/playlists/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlist = await deletePlaylist(req.params.id as string, req.tenantId!);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/playlists/:playlistId/items — Add playlist item (video)
router.post('/playlists/:playlistId/items', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const item = await addPlaylistItem(req.params.playlistId as string, req.body);
    res.status(201).json({ data: item });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tv/playlist-items/:id — Remove playlist item
router.delete('/playlist-items/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const item = await removePlaylistItem(req.params.id as string);
    res.json({ data: item });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/tv/playlists/:playlistId/sort — Sort playlist items
router.put('/playlists/:playlistId/sort', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { itemIdsOrdered } = req.body;
    if (!itemIdsOrdered || !Array.isArray(itemIdsOrdered)) {
      res.status(400).json({ error: 'itemIdsOrdered array is required' });
      return;
    }

    await updatePlaylistItemSort(req.params.playlistId as string, itemIdsOrdered);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/archives/:id/convert-to-media — Convert archive file into media library asset
router.post('/archives/:id/convert-to-media', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const asset = await convertToMediaAsset(req.params.id as string, req.tenantId!);
    res.json({ data: asset });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/archives/:id/ai-job — Trigger AI media processing job (transcription/translation/highlights)
router.post('/archives/:id/ai-job', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { jobType, targetLang, transcript } = req.body;
    if (!jobType) {
      res.status(400).json({ error: 'jobType is required' });
      return;
    }

    const archive = await prisma.tvBroadcastArchive.findFirst({
      where: { id: req.params.id as string, tenantId: req.tenantId! },
    });

    if (!archive) {
      res.status(404).json({ error: 'Broadcast archive not found' });
      return;
    }

    let mediaAssetId = archive.mediaAssetId;
    if (!mediaAssetId) {
      // Auto-convert to media asset first
      const asset = await convertToMediaAsset(archive.id, req.tenantId!);
      mediaAssetId = asset.id;
    }

    // Call AI services
    const { createAiJob, runAiJob } = require('../services/ai');
    const job = await createAiJob(req.tenantId!, {
      mediaAssetId,
      jobType,
      targetLang,
      transcript,
    });

    const result = await runAiJob(job.id, req.tenantId!);
    res.status(201).json({ data: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/channels/:id/polls — Create a new poll
router.post('/channels/:id/polls', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { question, options } = req.body;
    if (!question || !options || !Array.isArray(options)) {
      res.status(400).json({ error: 'Question and options array are required' });
      return;
    }
    const poll = await createPoll(req.tenantId!, req.params.id as string, question, options);
    res.status(201).json({ data: poll });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/tv/channels/:id/lower-thirds — Create a new overlay lower third
router.post('/channels/:id/lower-thirds', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const overlay = await createLowerThird(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: overlay });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/tv/lower-thirds/:id — Update overlay lower third
router.put('/lower-thirds/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const overlay = await updateLowerThird(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: overlay });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tv/lower-thirds/:id — Delete overlay lower third
router.delete('/lower-thirds/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const overlay = await deleteLowerThird(req.params.id as string, req.tenantId!);
    res.json({ data: overlay });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
