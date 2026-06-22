import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createStation,
  updateStation,
  deleteStation,
  getStation,
  listStations,
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
  listArchives,
  convertToPodcast,
} from '../services/radio';

const router = Router();

/**
 * ─────────────────────────────────────────────────────────────
 * PUBLIC LISTENER ENDPOINTS (NO ADMIN AUTH REQUIRED)
 * ─────────────────────────────────────────────────────────────
 */

// GET /api/radio/stations — List all stations for a tenant
router.get('/stations', async (req: Request, res: Response) => {
  try {
    const stations = await listStations(req.tenantId!);
    res.json({ data: stations });
  } catch (err: any) {
    console.error('List stations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/radio/stations/:idOrSlug — Get details of a single station
router.get('/stations/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const station = await getStation(req.params.idOrSlug as string, req.tenantId!);
    res.json({ data: station });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/radio/stations/:id/now-playing — Sync player metadata & calculate rotation playhead
router.get('/stations/:id/now-playing', async (req: Request, res: Response) => {
  try {
    const nowPlaying = await getNowPlaying(req.params.id as string, req.tenantId!);
    res.json({ data: nowPlaying });
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

// GET /api/radio/stations/:id/chat — Retrieve recent chat messages
router.get('/stations/:id/chat', async (req: Request, res: Response) => {
  try {
    const messages = await getChatMessages(req.params.id as string, req.tenantId!);
    res.json({ data: messages });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/radio/stations/:id/chat — Post a chat message
router.post('/stations/:id/chat', async (req: Request, res: Response) => {
  try {
    const { displayName, message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message content is required' });
      return;
    }

    const userId = req.user?.userId || null;
    const name = displayName || 'Guest Listener';

    const chatMsg = await createChatMessage(req.tenantId!, req.params.id as string, userId, name, message);
    res.status(201).json({ data: chatMsg });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/radio/stations/:id/reactions — Get aggregated reaction tallies
router.get('/stations/:id/reactions', async (req: Request, res: Response) => {
  try {
    const counts = await getReactions(req.params.id as string, req.tenantId!);
    res.json({ data: counts });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/radio/stations/:id/react — Increment reaction click
router.post('/stations/:id/react', async (req: Request, res: Response) => {
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

// GET /api/radio/stations/:id/schedules — Get station program calendar
router.get('/stations/:id/schedules', async (req: Request, res: Response) => {
  try {
    const schedules = await listSchedules(req.params.id as string, req.tenantId!);
    res.json({ data: schedules });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/radio/stations/:id/archives — List replay library
router.get('/stations/:id/archives', async (req: Request, res: Response) => {
  try {
    const archives = await listArchives(req.params.id as string, req.tenantId!);
    res.json({ data: archives });
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

// POST /api/radio/stations — Create station
router.post('/stations', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const station = await createStation(req.tenantId!, req.body);
    res.status(201).json({ data: station });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/radio/stations/:id — Update station branding or stream details
router.put('/stations/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const station = await updateStation(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: station });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/radio/stations/:id — Delete station
router.delete('/stations/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const station = await deleteStation(req.params.id as string, req.tenantId!);
    res.json({ data: station });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/radio/stations/:id/go-live — Start broadcasting immediately
router.post('/stations/:id/go-live', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const station = await goLive(req.params.id as string, req.tenantId!);
    res.json({ data: station });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/radio/stations/:id/stop-live — Stop broadcasting, archives active stream
router.post('/stations/:id/stop-live', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const station = await stopLive(req.params.id as string, req.tenantId!);
    res.json({ data: station });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/radio/stations/:id/programs — List all programs
router.get('/stations/:id/programs', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const programs = await listPrograms(req.params.id as string, req.tenantId!);
    res.json({ data: programs });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/radio/stations/:id/programs — Create a program
router.post('/stations/:id/programs', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const program = await createProgram(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: program });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/radio/programs/:id — Update program info
router.put('/programs/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const program = await updateProgram(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: program });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/radio/programs/:id — Delete program
router.delete('/programs/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const program = await deleteProgram(req.params.id as string, req.tenantId!);
    res.json({ data: program });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/radio/programs/:programId/schedules — Add schedule entry
router.post('/programs/:programId/schedules', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const schedule = await createSchedule(req.tenantId!, req.params.programId as string, req.body);
    res.status(201).json({ data: schedule });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/radio/schedules/:id — Update schedule entry
router.put('/schedules/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const schedule = await updateSchedule(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: schedule });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/radio/schedules/:id — Delete schedule entry
router.delete('/schedules/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const schedule = await deleteSchedule(req.params.id as string, req.tenantId!);
    res.json({ data: schedule });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/radio/stations/:id/playlists — List all playlists
router.get('/stations/:id/playlists', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlists = await listPlaylists(req.params.id as string, req.tenantId!);
    res.json({ data: playlists });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/radio/stations/:id/playlists — Create playlist
router.post('/stations/:id/playlists', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlist = await createPlaylist(req.tenantId!, req.params.id as string, req.body);
    res.status(201).json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/radio/playlists/:id — Update playlist details
router.put('/playlists/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlist = await updatePlaylist(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/radio/playlists/:id — Delete playlist
router.delete('/playlists/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const playlist = await deletePlaylist(req.params.id as string, req.tenantId!);
    res.json({ data: playlist });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/radio/playlists/:playlistId/items — Add playlist item (song/announcement)
router.post('/playlists/:playlistId/items', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const item = await addPlaylistItem(req.params.playlistId as string, req.body);
    res.status(201).json({ data: item });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/radio/playlist-items/:id — Remove playlist item
router.delete('/playlist-items/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const item = await removePlaylistItem(req.params.id as string);
    res.json({ data: item });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/radio/playlists/:playlistId/sort — Sort playlist items
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

// POST /api/radio/archives/:id/convert-to-podcast — Convert archive file into podcast show episode
router.post('/archives/:id/convert-to-podcast', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { showId } = req.body;
    if (!showId) {
      res.status(400).json({ error: 'showId is required' });
      return;
    }

    const episode = await convertToPodcast(req.params.id as string, req.tenantId!, showId);
    res.status(201).json({ data: episode });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;