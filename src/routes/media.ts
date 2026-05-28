import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  createCategory,
  listCategories,
  createTag,
  listTags,
  createSpeaker,
  listSpeakers,
  updateSpeaker,
  createSeries,
  listSeries,
  createAsset,
  getAsset,
  listAssets,
  updateAsset,
  deleteAsset,
  tagAsset,
  createPlaylist,
  listPlaylists,
  addToPlaylist,
  removeFromPlaylist,
  getPlaylistItems,
  generateEmbed,
} from '../services/media';

const router = Router();

// All media routes require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────

// GET /api/media/categories
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await listCategories(req.tenantId!);
    res.json({ data: categories });
  } catch (err: any) {
    console.error('List categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/media/categories
router.post('/categories', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, parentId } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const category = await createCategory(req.tenantId!, name, parentId);
    res.status(201).json({ data: category });
  } catch (err: any) {
    console.error('Create category error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// TAGS
// ─────────────────────────────────────────────────────────────

// GET /api/media/tags
router.get('/tags', async (req: Request, res: Response) => {
  try {
    const tags = await listTags(req.tenantId!);
    res.json({ data: tags });
  } catch (err: any) {
    console.error('List tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/media/tags
router.post('/tags', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const tag = await createTag(req.tenantId!, name);
    res.status(201).json({ data: tag });
  } catch (err: any) {
    console.error('Create tag error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// SPEAKERS
// ─────────────────────────────────────────────────────────────

// GET /api/media/speakers
router.get('/speakers', async (req: Request, res: Response) => {
  try {
    const speakers = await listSpeakers(req.tenantId!);
    res.json({ data: speakers });
  } catch (err: any) {
    console.error('List speakers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/media/speakers
router.post('/speakers', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, title, bio, photoUrl } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const speaker = await createSpeaker(req.tenantId!, { name, title, bio, photoUrl });
    res.status(201).json({ data: speaker });
  } catch (err: any) {
    console.error('Create speaker error:', err);
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/media/speakers/:id
router.put('/speakers/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, title, bio, photoUrl } = req.body;
    const speaker = await updateSpeaker(req.params.id as string, req.tenantId!, { name, title, bio, photoUrl });
    res.json({ data: speaker });
  } catch (err: any) {
    console.error('Update speaker error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// SERIES
// ─────────────────────────────────────────────────────────────

// GET /api/media/series
router.get('/series', async (req: Request, res: Response) => {
  try {
    const series = await listSeries(req.tenantId!);
    res.json({ data: series });
  } catch (err: any) {
    console.error('List series error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/media/series
router.post('/series', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { title, description, coverImageUrl } = req.body;
    if (!title) {
      res.status(400).json({ error: 'title is required' });
      return;
    }
    const series = await createSeries(req.tenantId!, { title, description, coverImageUrl });
    res.status(201).json({ data: series });
  } catch (err: any) {
    console.error('Create series error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// ASSETS (Core CRUD)
// ─────────────────────────────────────────────────────────────

// POST /api/media/assets
router.post('/assets', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const {
      title, description, type, providerType, providerKey, sourceUrl,
      thumbnailUrl, durationSeconds, fileSizeBytes, mimeType,
      categoryId, seriesId, seriesOrder, speakerId, visibility, status,
    } = req.body;

    if (!title || !type || !providerType) {
      res.status(400).json({ error: 'title, type, and providerType are required' });
      return;
    }

    const asset = await createAsset(req.tenantId!, {
      title, description, type, providerType, providerKey, sourceUrl,
      thumbnailUrl, durationSeconds, fileSizeBytes, mimeType,
      categoryId, seriesId, seriesOrder, speakerId, visibility, status,
    });
    res.status(201).json({ data: asset });
  } catch (err: any) {
    console.error('Create asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/media/assets
router.get('/assets', async (req: Request, res: Response) => {
  try {
    const filters = {
      categoryId: req.query.categoryId as string | undefined,
      seriesId: req.query.seriesId as string | undefined,
      speakerId: req.query.speakerId as string | undefined,
      type: req.query.type as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      tagIds: req.query.tagIds
        ? (req.query.tagIds as string).split(',').map((id) => id.trim())
        : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : undefined,
    };

    const result = await listAssets(req.tenantId!, filters);
    res.json({ data: result.assets, meta: { total: result.total, page: result.page, pageSize: result.pageSize } });
  } catch (err: any) {
    console.error('List assets error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/media/assets/:id
router.get('/assets/:id', async (req: Request, res: Response) => {
  try {
    const asset = await getAsset(req.params.id as string, req.tenantId!);
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    res.json({ data: asset });
  } catch (err: any) {
    console.error('Get asset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/media/assets/:id
router.put('/assets/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const asset = await updateAsset(req.params.id as string, req.tenantId!, req.body);
    res.json({ data: asset });
  } catch (err: any) {
    console.error('Update asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/media/assets/:id
router.delete('/assets/:id', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const asset = await deleteAsset(req.params.id as string, req.tenantId!);
    res.json({ data: asset, message: 'Asset archived successfully' });
  } catch (err: any) {
    console.error('Delete asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/media/assets/:id/tags
router.post('/assets/:id/tags', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { tagIds } = req.body;
    if (!tagIds || !Array.isArray(tagIds)) {
      res.status(400).json({ error: 'tagIds array is required' });
      return;
    }
    const tags = await tagAsset(req.params.id as string, tagIds);
    res.json({ data: tags });
  } catch (err: any) {
    console.error('Tag asset error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/media/assets/:id/embed
router.get('/assets/:id/embed', async (req: Request, res: Response) => {
  try {
    const asset = await getAsset(req.params.id as string, req.tenantId!);
    if (!asset) {
      res.status(404).json({ error: 'Asset not found' });
      return;
    }
    const embedHtml = generateEmbed(asset);
    res.json({ data: { embedHtml } });
  } catch (err: any) {
    console.error('Generate embed error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PLAYLISTS
// ─────────────────────────────────────────────────────────────

// GET /api/media/playlists
router.get('/playlists', async (req: Request, res: Response) => {
  try {
    const playlists = await listPlaylists(req.tenantId!);
    res.json({ data: playlists });
  } catch (err: any) {
    console.error('List playlists error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/media/playlists
router.post('/playlists', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { name, description, coverImageUrl, isPublic } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }
    const playlist = await createPlaylist(req.tenantId!, { name, description, coverImageUrl, isPublic });
    res.status(201).json({ data: playlist });
  } catch (err: any) {
    console.error('Create playlist error:', err);
    res.status(400).json({ error: err.message });
  }
});

// POST /api/media/playlists/:id/items
router.post('/playlists/:id/items', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { assetId, order } = req.body;
    if (!assetId) {
      res.status(400).json({ error: 'assetId is required' });
      return;
    }
    const item = await addToPlaylist(req.params.id as string, assetId, order || 0);
    res.status(201).json({ data: item });
  } catch (err: any) {
    console.error('Add to playlist error:', err);
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/media/playlists/:id/items/:assetId
router.delete('/playlists/:id/items/:assetId', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    await removeFromPlaylist(req.params.id as string, req.params.assetId as string);
    res.json({ message: 'Item removed from playlist' });
  } catch (err: any) {
    console.error('Remove from playlist error:', err);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/media/playlists/:id/items
router.get('/playlists/:id/items', async (req: Request, res: Response) => {
  try {
    const items = await getPlaylistItems(req.params.id as string);
    res.json({ data: items });
  } catch (err: any) {
    console.error('Get playlist items error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
