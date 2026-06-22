import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createShow,
  updateShow,
  deleteShow,
  getShow,
  listShows,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  getEpisode,
  listEpisodes,
  generateRssFeed,
} from '../services/podcast';

const router = Router();

// Public RSS Feed (NO AUTH, NO x-tenant-id header required)
router.get('/feeds/:tenantId/:showSlug', async (req: Request, res: Response) => {
  try {
    const tenantId = req.params.tenantId as string;
    const showSlug = req.params.showSlug as string;
    if (!tenantId || !showSlug) {
      res.status(400).json({ error: 'tenantId and showSlug are required' });
      return;
    }
    const xml = await generateRssFeed(showSlug, tenantId);
    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (err: any) {
    console.error('Generate RSS feed error:', err);
    res.status(404).send(err.message || 'Feed not found');
  }
});

// All other podcast endpoints require authentication
router.use(authMiddleware);

/**
 * ─────────────────────────────────────────────────────────────
 * SHOW ENDPOINTS
 * ─────────────────────────────────────────────────────────────
 */

// POST /api/podcast/shows — Create a show (Admin)
router.post('/shows', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { title, slug, description, author, email, coverImageUrl, category, subcategory, language, link, copyright, explicit, status } = req.body;
    if (!title || !author || !category) {
      res.status(400).json({ error: 'title, author, and category are required' });
      return;
    }
    const show = await createShow(req.tenantId!, {
      title, slug, description, author, email, coverImageUrl, category, subcategory, language, link, copyright, explicit, status
    });
    res.status(201).json({ data: show });
  } catch (err: any) {
    console.error('Create show error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/podcast/shows — List all shows (with optional search and status filter)
router.get('/shows', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;

    // Secure checking: only admins can view non-published shows
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings');
    if (!isAdmin && status && status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published shows' });
      return;
    }

    const shows = await listShows(req.tenantId!, { status, search });
    res.json({ data: shows });
  } catch (err: any) {
    console.error('List shows error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/podcast/shows/:idOrSlug — Get show detail
router.get('/shows/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const idOrSlug = req.params.idOrSlug as string;
    const show = await getShow(idOrSlug, req.tenantId!);

    // Secure checking: only admins can view non-published shows
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings');
    if (!isAdmin && show.status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published shows' });
      return;
    }

    res.json({ data: show });
  } catch (err: any) {
    console.error('Get show error:', err);
    res.status(404).json({ error: err.message });
  }
});

// PUT /api/podcast/shows/:id — Update a show (Admin)
router.put('/shows/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const show = await updateShow(id, req.tenantId!, req.body);
    res.json({ data: show });
  } catch (err: any) {
    console.error('Update show error:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/podcast/shows/:id — Soft-delete a show (Admin)
router.delete('/shows/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const show = await deleteShow(id, req.tenantId!);
    res.json({ data: show });
  } catch (err: any) {
    console.error('Delete show error:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * ─────────────────────────────────────────────────────────────
 * EPISODE ENDPOINTS
 * ─────────────────────────────────────────────────────────────
 */

// POST /api/podcast/episodes — Create an episode (Admin)
router.post('/episodes', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { showId, title, slug, description, audioUrl, durationSeconds, fileSize, mimeType, publishDate, status, season, episodeNumber, episodeType, explicit } = req.body;
    if (!showId || !title || !audioUrl) {
      res.status(400).json({ error: 'showId, title, and audioUrl are required' });
      return;
    }
    const episode = await createEpisode(req.tenantId!, {
      showId, title, slug, description, audioUrl, durationSeconds, fileSize, mimeType, publishDate, status, season, episodeNumber, episodeType, explicit
    });
    res.status(201).json({ data: episode });
  } catch (err: any) {
    console.error('Create episode error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/podcast/shows/:showId/episodes — List episodes for a show
router.get('/shows/:showId/episodes', async (req: Request, res: Response) => {
  try {
    const showId = req.params.showId as string;
    const status = req.query.status as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    // Secure checking: only admins can view non-published episodes
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings');
    if (!isAdmin && status && status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published episodes' });
      return;
    }

    const result = await listEpisodes(showId, req.tenantId!, { status, page, limit });
    res.json({
      data: result.episodes,
      meta: { total: result.total, page: result.page, limit: result.limit },
    });
  } catch (err: any) {
    console.error('List episodes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/podcast/episodes/:idOrSlug — Get episode details
router.get('/episodes/:idOrSlug', async (req: Request, res: Response) => {
  try {
    const idOrSlug = req.params.idOrSlug as string;
    const episode = await getEpisode(idOrSlug, req.tenantId!);

    // Secure checking: only admins can view non-published episodes
    const userPermissions = req.user?.permissions || [];
    const isAdmin = userPermissions.includes('tenant.settings');
    if (!isAdmin && episode.status !== 'published') {
      res.status(403).json({ error: 'Only admins can view non-published episodes' });
      return;
    }

    res.json({ data: episode });
  } catch (err: any) {
    console.error('Get episode error:', err);
    res.status(404).json({ error: err.message });
  }
});

// PUT /api/podcast/episodes/:id — Update an episode (Admin)
router.put('/episodes/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const episode = await updateEpisode(id, req.tenantId!, req.body);
    res.json({ data: episode });
  } catch (err: any) {
    console.error('Update episode error:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/podcast/episodes/:id — Soft-delete an episode (Admin)
router.delete('/episodes/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const episode = await deleteEpisode(id, req.tenantId!);
    res.json({ data: episode });
  } catch (err: any) {
    console.error('Delete episode error:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
