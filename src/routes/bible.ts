import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import prisma from '../lib/prisma';
import {
  registerTranslation,
  listTranslations,
  seedBibleVerses,
  getChapter,
  searchBible,
  resolveScriptureReference,
  createReadingPlan,
  listReadingPlans,
  enrollInReadingPlan,
  completeDayInReadingPlan,
  addBookmark,
  removeBookmark,
  listBookmarks,
  saveVerseNote,
  listVerseNotes,
  createDailyDevotional,
  getDailyDevotional,
  getLinkedSermons,
  addHighlight,
  removeHighlight,
  listHighlights,
  registerAudioTrack,
  getAudioTrack,
  getTranslationDownload,
  getGraphicTemplates,
  generateScriptureGraphic,
} from '../services/bible';

const router = Router();

// ─────────────────────────────────────────────────────────────
// PUBLIC GRAPHIC PREVIEW (BYPASSES AUTH MIDDLEWARE)
// ─────────────────────────────────────────────────────────────

router.get('/graphics/render/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    // In a real app, this would dynamically render a SVG or PNG card.
    // We return a beautiful inline SVG graphic representing the shared verse.
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`
      <svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
        <defs>
          <linearGradient id="sunsetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#f59e0b" />
            <stop offset="100%" stop-color="#db2777" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#sunsetGrad)"/>
        <rect x="20" y="20" width="560" height="360" fill="#000000" fill-opacity="0.3" rx="10" />
        <text x="300" y="160" font-family="Lora, Georgia, serif" font-size="22" fill="#ffffff" font-weight="bold" text-anchor="middle">
          "For God so loved the world..."
        </text>
        <text x="300" y="240" font-family="sans-serif" font-size="16" fill="#f3f4f6" text-anchor="middle">
          — John 3:16 (ESV)
        </text>
        <text x="300" y="340" font-family="sans-serif" font-size="12" fill="#e5e7eb" opacity="0.8" text-anchor="middle">
          Shared via Digital Church OS
        </text>
      </svg>
    `);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Apply auth to all remaining Bible routes
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// 1. TRANSLATION & SEEDING API (ADMIN ONLY)
// ─────────────────────────────────────────────────────────────

router.post('/translations', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, language, isLicensed } = req.body;
    if (!name || !code) {
      res.status(400).json({ error: 'name and code are required' });
      return;
    }

    const translation = await registerTranslation(req.tenantId!, { name, code, language, isLicensed });
    res.status(201).json({ data: translation });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/translations', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await listTranslations(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/seed', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { verses } = req.body;
    if (!verses || !Array.isArray(verses)) {
      res.status(400).json({ error: 'verses array is required' });
      return;
    }

    await seedBibleVerses(req.tenantId!, verses);
    res.status(200).json({ message: 'Seeding completed' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 2. BIBLE READING & SEARCHING API
// ─────────────────────────────────────────────────────────────

router.get('/read/:translation/:book/:chapter', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const chapterVerses = await getChapter(
      req.tenantId!,
      req.params.translation as string,
      req.params.book as string,
      parseInt(req.params.chapter as string, 10)
    );
    res.json({ data: chapterVerses });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/search', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { translation, q } = req.query;
    if (!translation || !q) {
      res.status(400).json({ error: 'translation and q are required query parameters' });
      return;
    }

    const results = await searchBible(req.tenantId!, translation as string, q as string);
    res.json({ data: results });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 3. SCRIPTURE RESOLVER
// ─────────────────────────────────────────────────────────────

router.get('/resolve', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { translation, ref } = req.query;
    if (!translation || !ref) {
      res.status(400).json({ error: 'translation and ref are required query parameters' });
      return;
    }

    const verses = await resolveScriptureReference(req.tenantId!, translation as string, ref as string);
    res.json({ data: verses });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 4. BIBLE READING PLANS API
// ─────────────────────────────────────────────────────────────

router.post('/plans', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, coverImageUrl, durationDays, days } = req.body;
    if (!title || !durationDays || !days || !Array.isArray(days)) {
      res.status(400).json({ error: 'title, durationDays, and days array are required' });
      return;
    }

    const plan = await createReadingPlan(req.tenantId!, { title, description, coverImageUrl, durationDays, days });
    res.status(201).json({ data: plan });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/plans', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const list = await listReadingPlans(req.tenantId!);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/plans/:planId/enroll', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const enrollment = await enrollInReadingPlan(req.tenantId!, req.params.planId as string, member.id);
    res.status(201).json({ data: enrollment });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/enrollments/:id/complete-day', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { dayNumber } = req.body;
    if (dayNumber === undefined) {
      res.status(400).json({ error: 'dayNumber is required' });
      return;
    }

    const updated = await completeDayInReadingPlan(req.tenantId!, req.params.id as string, dayNumber);
    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 5. BOOKMARKS API
// ─────────────────────────────────────────────────────────────

router.post('/bookmarks', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { translationCode, bookSlug, chapter, verse } = req.body;
    if (!translationCode || !bookSlug || !chapter || !verse) {
      res.status(400).json({ error: 'translationCode, bookSlug, chapter, and verse are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const bookmark = await addBookmark(req.tenantId!, member.id, {
      translationCode,
      bookSlug,
      chapter,
      verse,
    });
    res.status(201).json({ data: bookmark });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/bookmarks/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await removeBookmark(req.tenantId!, req.params.id as string);
    res.json({ message: 'Bookmark removed successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/bookmarks', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const list = await listBookmarks(req.tenantId!, member.id);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 6. SCRIPTURE STUDY NOTES API
// ─────────────────────────────────────────────────────────────

router.post('/notes', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { bookSlug, chapter, verse, noteText } = req.body;
    if (!bookSlug || !chapter || !verse || noteText === undefined) {
      res.status(400).json({ error: 'bookSlug, chapter, verse, and noteText are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const note = await saveVerseNote(req.tenantId!, member.id, {
      bookSlug,
      chapter,
      verse,
      noteText,
    });
    res.json({ data: note });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/notes', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const { bookSlug, chapter } = req.query;
    const filter: any = {};
    if (bookSlug) filter.bookSlug = bookSlug as string;
    if (chapter) filter.chapter = parseInt(chapter as string, 10);

    const list = await listVerseNotes(req.tenantId!, member.id, filter);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 7. DAILY DEVOTIONALS API
// ─────────────────────────────────────────────────────────────

router.post('/devotionals', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, title, content, scriptureRef } = req.body;
    if (!date || !title || !content || !scriptureRef) {
      res.status(400).json({ error: 'date, title, content, and scriptureRef are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    const authorId = member?.id || undefined;

    const devotional = await createDailyDevotional(req.tenantId!, {
      date,
      title,
      content,
      scriptureRef,
      authorId,
    });
    res.status(201).json({ data: devotional });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/devotionals/today', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const dateParam = req.query.date ? new Date(req.query.date as string) : new Date();
    const dev = await getDailyDevotional(req.tenantId!, dateParam);
    if (!dev) {
      res.status(404).json({ error: 'Devotional not found for this date' });
      return;
    }
    res.json({ data: dev });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 8. SERMONS / SERVICES LINKING API
// ─────────────────────────────────────────────────────────────

router.get('/linked-sermons', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { book, chapter } = req.query;
    if (!book || !chapter) {
      res.status(400).json({ error: 'book and chapter are required query parameters' });
      return;
    }

    const list = await getLinkedSermons(req.tenantId!, book as string, parseInt(chapter as string, 10));
    res.json({ data: list });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 9. VERSE HIGHLIGHTS API
// ─────────────────────────────────────────────────────────────

router.post('/highlights', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { translationCode, bookSlug, chapter, verse, color } = req.body;
    if (!translationCode || !bookSlug || !chapter || !verse || !color) {
      res.status(400).json({ error: 'translationCode, bookSlug, chapter, verse, and color are required' });
      return;
    }

    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const highlight = await addHighlight(req.tenantId!, member.id, {
      translationCode,
      bookSlug,
      chapter,
      verse,
      color,
    });
    res.status(201).json({ data: highlight });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/highlights/:id', requirePermission('member.update'), async (req: Request, res: Response): Promise<void> => {
  try {
    await removeHighlight(req.tenantId!, req.params.id as string);
    res.json({ message: 'Highlight removed successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/highlights', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const member = await prisma.member.findFirst({
      where: { userId: req.user!.userId, tenantId: req.tenantId! },
    });
    if (!member) {
      res.status(400).json({ error: 'Authenticated user does not have a member profile' });
      return;
    }

    const list = await listHighlights(req.tenantId!, member.id);
    res.json({ data: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 10. AUDIO BIBLE API
// ─────────────────────────────────────────────────────────────

router.post('/audio', requirePermission('tenant.settings'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { translationCode, bookSlug, chapter, audioUrl, provider } = req.body;
    if (!translationCode || !bookSlug || !chapter || !audioUrl) {
      res.status(400).json({ error: 'translationCode, bookSlug, chapter, and audioUrl are required' });
      return;
    }

    const track = await registerAudioTrack(req.tenantId!, { translationCode, bookSlug, chapter, audioUrl, provider });
    res.status(201).json({ data: track });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/audio/:translation/:book/:chapter', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const audioUrl = await getAudioTrack(
      req.tenantId!,
      req.params.translation as string,
      req.params.book as string,
      parseInt(req.params.chapter as string, 10)
    );
    res.json({ data: { audioUrl } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 11. OFFLINE DOWNLOAD API
// ─────────────────────────────────────────────────────────────

router.get('/translations/:code/download', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const payload = await getTranslationDownload(req.tenantId!, req.params.code as string);
    res.json(payload);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// 12. SCRIPTURE GRAPHICS API
// ─────────────────────────────────────────────────────────────

router.get('/graphics/templates', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const templates = getGraphicTemplates();
    res.json({ data: templates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/graphics/generate', requirePermission('member.read'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { text, reference, templateId } = req.body;
    if (!text || !reference || !templateId) {
      res.status(400).json({ error: 'text, reference, and templateId are required' });
      return;
    }

    const graphic = await generateScriptureGraphic(req.tenantId!, { text, reference, templateId });
    res.status(201).json({ data: graphic });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
