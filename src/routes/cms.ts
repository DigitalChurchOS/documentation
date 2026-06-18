import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { dnsMiddleware } from '../middleware/dns';
import { authMiddleware } from '../middleware/auth';
import { requireAnyPermission } from '../middleware/rbac';
import { requireModule } from '../middleware/entitlements';
import { ECCLESIA_GLOBAL_CONTENT_KEY, createEcclesiaGlobalContent } from '../themes/ecclesia';
import { CHURCH_SERVICES_MODULE_KEY, ChurchServicesService } from '../services/churchServices';
import {
  LIVESTREAM_MODULE_KEY,
  getSettings as getLivestreamSettings,
  getChatMessages,
  sendChatMessage,
  trackViewerJoin,
  trackViewerLeave,
  submitInteraction,
} from '../services/livestream';
import { getChapter, searchBible, resolveScriptureReference } from '../services/bible';

const router = Router();

function statusForChurchServices(error: Error) {
  const message = error.message.toLowerCase();
  if (message.includes('not found')) return 404;
  if (message.includes('disabled') || message.includes('inactive')) return 403;
  return 400;
}

async function hasActiveModule(tenantId: string, moduleKey: string) {
  const entitlement = await prisma.tenantModule.findUnique({
    where: { tenantId_moduleKey: { tenantId, moduleKey } },
  });
  return entitlement?.status === 'active';
}

function churchServiceFilters(req: Request) {
  return {
    serviceType: req.query.serviceType as string | undefined,
    speakerId: req.query.speakerId as string | undefined,
    dateFrom: req.query.dateFrom as string | undefined,
    dateTo: req.query.dateTo as string | undefined,
    search: req.query.search as string | undefined,
    sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
  };
}

const PUBLIC_STREAM_STATUSES = ['live', 'scheduled', 'ended'];
const PUBLIC_INTERACTION_TYPES = ['prayer_request', 'salvation_response', 'note', 'giving_click', 'reaction'];

function parseMultiPlatformLinks(value: string | null | undefined) {
  const links = safeJson<any[]>(value, []);
  return Array.isArray(links)
    ? links.filter((item) => item && typeof item.platform === 'string' && typeof item.url === 'string')
    : [];
}

const SERVICE_MOMENT_THEMES = new Set(['sunrise', 'ocean', 'rose', 'forest', 'gold']);

function trimString(value: any, fallback = '', max = 500) {
  return typeof value === 'string'
    ? value.trim().slice(0, max)
    : fallback;
}

function safeActionUrl(value: any) {
  const url = trimString(value, '#', 300);
  if (url.startsWith('/') || url.startsWith('#') || /^https?:\/\//i.test(url) || /^mailto:/i.test(url)) return url;
  return '#';
}

function sanitizeServiceMomentCtas(value: any) {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, 8)
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const title = trimString(item.title, '', 90);
      const summary = trimString(item.summary, '', 180);
      if (!title || !summary) return null;
      const theme = trimString(item.theme, 'sunrise', 24);
      return {
        id: trimString(item.id, `service-moment-${index}`, 80),
        title,
        summary,
        details: trimString(item.details, summary, 1200),
        buttonLabel: trimString(item.buttonLabel, 'Open', 60),
        buttonUrl: safeActionUrl(item.buttonUrl),
        theme: SERVICE_MOMENT_THEMES.has(theme) ? theme : 'sunrise',
        enabled: item.enabled !== false,
      };
    })
    .filter(Boolean);
}

function serviceTypeLabel(value: string | null | undefined) {
  const labels: Record<string, string> = {
    sunday: 'Sunday Service',
    midweek: 'Midweek Service',
    prayer: 'Prayer Service',
    communion: 'Communion Service',
    healing: 'Healing Service',
    thanksgiving: 'Thanksgiving Service',
    youth: 'Youth Service',
    special: 'Special Service',
    other: 'Other Service',
  };
  return value ? labels[value] || value : 'Service';
}

function sanitizeMediaAsset(asset: any) {
  if (!asset) return null;
  return {
    id: asset.id,
    title: asset.title,
    description: asset.description || null,
    type: asset.type,
    providerType: asset.providerType || null,
    sourceUrl: asset.sourceUrl || null,
    thumbnailUrl: asset.thumbnailUrl || null,
    durationSeconds: asset.durationSeconds || null,
    publishedAt: asset.publishedAt || null,
  };
}

function sanitizeLivestreamService(service: any) {
  if (!service) return null;
  return {
    id: service.id,
    title: service.title,
    description: service.description || null,
    serviceDate: service.serviceDate,
    serviceType: service.serviceType,
    serviceTypeLabel: serviceTypeLabel(service.serviceType),
    detailUrl: `/services/${encodeURIComponent(service.id)}`,
    speaker: service.speaker ? {
      id: service.speaker.id,
      name: service.speaker.name,
      title: service.speaker.title || null,
      photoUrl: service.speaker.photoUrl || null,
    } : null,
    scriptures: service.scriptures || [],
    attachments: service.attachments || [],
    sermonMedia: sanitizeMediaAsset(service.sermonMedia),
    serviceAudio: sanitizeMediaAsset(service.serviceAudio),
  };
}

function sanitizeStream(stream: any, relatedService?: any) {
  if (!stream) return null;
  const service = relatedService || stream.churchServices?.[0] || null;
  const replayAsset = sanitizeMediaAsset(stream.replayAsset);
  return {
    id: stream.id,
    title: stream.title,
    description: stream.description || null,
    scheduledAt: stream.scheduledAt || null,
    startedAt: stream.startedAt || null,
    endedAt: stream.endedAt || null,
    status: stream.status,
    thumbnailUrl: stream.thumbnailUrl || replayAsset?.thumbnailUrl || null,
    countdownEnabled: stream.countdownEnabled,
    chatEnabled: stream.chatEnabled,
    multiPlatformLinks: parseMultiPlatformLinks(stream.multiPlatformLinks),
    replayAsset,
    playbackUrl: replayAsset?.sourceUrl || null,
    watchUrl: `/livestream/${encodeURIComponent(stream.id)}`,
    relatedService: sanitizeLivestreamService(service),
  };
}

async function assertPublicLivestreamAccess(tenantId: string) {
  if (!(await hasActiveModule(tenantId, LIVESTREAM_MODULE_KEY))) {
    throw new Error('Livestream module is inactive');
  }
  const settings = await getLivestreamSettings(tenantId);
  if (!settings.enabled) {
    throw new Error('Livestream module is disabled');
  }
  const config = safeJson<Record<string, any>>(settings.configJson, {});
  return {
    settings,
    config: {
      chatEnabled: config.chatEnabled !== false,
      givingButtonEnabled: config.givingButtonEnabled !== false,
      prayerRequestEnabled: config.prayerRequestEnabled !== false,
      salvationResponseEnabled: config.salvationResponseEnabled !== false,
      biblePanelEnabled: config.biblePanelEnabled !== false,
      notesPanelEnabled: config.notesPanelEnabled !== false,
      replayAutoArchive: config.replayAutoArchive !== false,
      publicPublishingEnabled: config.publicPublishingEnabled !== false,
      serviceMomentCtas: sanitizeServiceMomentCtas(config.serviceMomentCtas),
    },
  };
}

async function findPublicLivestream(tenantId: string, streamId: string) {
  return prisma.livestream.findFirst({
    where: { id: streamId, tenantId, status: { in: PUBLIC_STREAM_STATUSES } },
    include: {
      replayAsset: true,
      churchServices: {
        where: { status: 'published', visibility: { in: ['public', 'unlisted'] } },
        include: {
          speaker: true,
          sermonMedia: true,
          serviceAudio: true,
          scriptures: { orderBy: { order: 'asc' } },
          attachments: { orderBy: { createdAt: 'desc' } },
        },
        take: 1,
      },
    },
  });
}

async function findPublicLivestreamService(tenantId: string, serviceId: string) {
  return prisma.churchService.findFirst({
    where: { id: serviceId, tenantId, status: 'published', visibility: { in: ['public', 'unlisted'] } },
    include: {
      speaker: true,
      sermonMedia: true,
      serviceAudio: true,
      scriptures: { orderBy: { order: 'asc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
      livestream: { include: { replayAsset: true } },
    },
  });
}

function chooseDefaultStream(streams: any[]) {
  const now = Date.now();
  const live = streams.find((stream) => stream.status === 'live');
  if (live) return live;

  const upcoming = streams
    .filter((stream) => stream.status === 'scheduled' && (!stream.scheduledAt || new Date(stream.scheduledAt).getTime() >= now))
    .sort((a, b) => new Date(a.scheduledAt || a.createdAt).getTime() - new Date(b.scheduledAt || b.createdAt).getTime())[0];
  if (upcoming) return upcoming;

  return streams
    .filter((stream) => stream.status === 'ended')
    .sort((a, b) => new Date(b.endedAt || b.updatedAt || b.createdAt).getTime() - new Date(a.endedAt || a.updatedAt || a.createdAt).getTime())[0]
    || streams[0]
    || null;
}

async function getPublicLivestreamContext(tenantId: string, query: Record<string, any>, streamId?: string) {
  const access = await assertPublicLivestreamAccess(tenantId);
  let selectedStream: any = null;
  let relatedService: any = null;

  if (query.serviceId) {
    relatedService = await findPublicLivestreamService(tenantId, String(query.serviceId));
    if (relatedService?.livestream) selectedStream = relatedService.livestream;
  }

  if (!selectedStream && streamId) {
    selectedStream = await findPublicLivestream(tenantId, streamId);
    relatedService = selectedStream?.churchServices?.[0] || null;
  }

  const streams = await prisma.livestream.findMany({
    where: { tenantId, status: { in: PUBLIC_STREAM_STATUSES } },
    include: {
      replayAsset: true,
      churchServices: {
        where: { status: 'published', visibility: { in: ['public', 'unlisted'] } },
        include: {
          speaker: true,
          sermonMedia: true,
          serviceAudio: true,
          scriptures: { orderBy: { order: 'asc' } },
          attachments: { orderBy: { createdAt: 'desc' } },
        },
        take: 1,
      },
    },
    orderBy: [{ scheduledAt: 'desc' }, { createdAt: 'desc' }],
    take: 50,
  });

  if (!selectedStream) selectedStream = chooseDefaultStream(streams);
  if (selectedStream && !relatedService) relatedService = selectedStream.churchServices?.[0] || null;

  const sanitizedStreams = streams
    .map((stream) => sanitizeStream(stream))
    .filter((stream): stream is NonNullable<ReturnType<typeof sanitizeStream>> => Boolean(stream));
  return {
    stream: sanitizeStream(selectedStream, relatedService),
    streams: sanitizedStreams,
    liveStreams: sanitizedStreams.filter((stream) => stream.status === 'live'),
    upcomingStreams: sanitizedStreams.filter((stream) => stream.status === 'scheduled'),
    replayStreams: sanitizedStreams.filter((stream) => stream.status === 'ended'),
    relatedService: sanitizeLivestreamService(relatedService),
    settings: access.config,
  };
}

const FALLBACK_KJV_VERSES = [
  { bookSlug: 'genesis', book: 'Genesis', chapter: 1, verse: 1, text: 'In the beginning God created the heaven and the earth.' },
  { bookSlug: 'psalms', book: 'Psalms', chapter: 23, verse: 1, text: 'The LORD is my shepherd; I shall not want.' },
  { bookSlug: 'john', book: 'John', chapter: 3, verse: 16, text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' },
  { bookSlug: 'romans', book: 'Romans', chapter: 8, verse: 28, text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.' },
  { bookSlug: 'hebrews', book: 'Hebrews', chapter: 11, verse: 1, text: 'Now faith is the substance of things hoped for, the evidence of things not seen.' },
];

function bookSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function normalizeBibleVerse(verse: any) {
  const book = verse.book || verse.book_name || verse.bookSlug || verse.bookSlug?.replace(/-/g, ' ') || '';
  const slug = verse.bookSlug || bookSlug(book);
  return {
    id: verse.id || `${slug}-${verse.chapter}-${verse.verse}`,
    translationCode: (verse.translationCode || 'kjv').toLowerCase(),
    bookSlug: slug,
    book: book || slug.replace(/-/g, ' '),
    chapter: Number(verse.chapter),
    verse: Number(verse.verse),
    text: verse.text,
    reference: `${book || slug.replace(/-/g, ' ')} ${verse.chapter}:${verse.verse}`,
  };
}

async function fetchKjvReference(reference: string) {
  try {
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(reference)}?translation=kjv`);
    if (!response.ok) return [];
    const json: any = await response.json();
    const verses = Array.isArray(json.verses) ? json.verses : [];
    return verses.map(normalizeBibleVerse);
  } catch {
    return [];
  }
}

async function bibleChapterFallback(translation: string, book: string, chapter: number) {
  if (translation.toLowerCase() !== 'kjv') return [];
  const remote = await fetchKjvReference(`${book} ${chapter}`);
  if (remote.length) return remote;
  return FALLBACK_KJV_VERSES
    .filter((verse) => verse.bookSlug === bookSlug(book) && verse.chapter === chapter)
    .map(normalizeBibleVerse);
}

async function bibleReferenceFallback(translation: string, reference: string) {
  if (translation.toLowerCase() !== 'kjv') return [];
  const remote = await fetchKjvReference(reference);
  if (remote.length) return remote;
  const needle = reference.toLowerCase().replace(/\s+/g, ' ').trim();
  return FALLBACK_KJV_VERSES
    .filter((verse) => `${verse.book} ${verse.chapter}:${verse.verse}`.toLowerCase() === needle)
    .map(normalizeBibleVerse);
}

function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeNavigationItems(value: string | null | undefined) {
  const items = safeJson<any[]>(value, []);
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const url = typeof item.url === 'string' && item.url.trim()
        ? item.url
        : typeof item.href === 'string' && item.href.trim()
          ? item.href
          : '';
      return {
        ...item,
        url,
      };
    })
    .filter((item): item is Record<string, any> => Boolean(item?.url));
}

async function ensureEcclesiaGlobalContent(tenantId: string) {
  const existing = await prisma.reusableBlock.findUnique({
    where: { tenantId_key: { tenantId, key: ECCLESIA_GLOBAL_CONTENT_KEY } },
  });

  if (existing) return existing;

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });

  return prisma.reusableBlock.create({
    data: {
      tenantId,
      name: 'Ecclesia Global Content',
      key: ECCLESIA_GLOBAL_CONTENT_KEY,
      content: JSON.stringify(createEcclesiaGlobalContent(tenant?.name)),
    },
  });
}

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINT: GET /api/cms/render
// ─────────────────────────────────────────────────────────────
// Resolves website pages by domain / subdomain DNS context.
// No auth required. Enforces 'published' status filter.
// ─────────────────────────────────────────────────────────────
router.get('/render', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const websiteId = (req as any).websiteId as string | undefined;
    const slug = (req.query.slug as string) || ''; // default to home page ""
    const previewToken = req.query.previewToken as string | undefined;

    if (!tenantId || !websiteId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    // Enforce that the 'website-cms' module is active for the tenant
    const entitlement = await prisma.tenantModule.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } },
    });

    if (!entitlement || entitlement.status !== 'active') {
      res.status(403).json({ error: 'Website CMS module is inactive' });
      return;
    }

    let isPreview = false;
    if (previewToken) {
      try {
        const decoded = jwt.verify(previewToken, process.env.JWT_SECRET || 'fallback-secret') as any;
        if (decoded && decoded.pageId) {
          isPreview = true;
        }
      } catch (err) {
        res.status(401).json({ error: 'Invalid or expired preview token' });
        return;
      }
    }

    // Retrieve page layout
    const page = await prisma.page.findFirst({
      where: {
        websiteId,
        slug,
        ...(isPreview ? {} : { status: 'published' }),
      },
      include: {
        website: {
          include: { theme: true },
        },
      },
    });

    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    // Fetch active navigation menu for this website
    const navMenu = await prisma.navigationMenu.findFirst({
      where: { websiteId, isActive: true },
    });

    // Fetch footer configuration for this website
    const cmsFooter = await prisma.cmsFooter.findFirst({
      where: { websiteId },
    });

    const globalContentBlock = await prisma.reusableBlock.findUnique({
      where: { tenantId_key: { tenantId, key: ECCLESIA_GLOBAL_CONTENT_KEY } },
    });

    const pageContent = isPreview ? (page.draftContent || page.content) : page.content;
    const themeSettings = (isPreview && page.website.theme.draftSettings) ? page.website.theme.draftSettings : page.website.theme.settings;
    const globalContent = globalContentBlock
      ? safeJson(globalContentBlock.content, createEcclesiaGlobalContent(page.website.title))
      : createEcclesiaGlobalContent(page.website.title);

    res.json({
      data: {
        pageId: page.id,
        title: page.title,
        slug: page.slug,
        isHome: page.isHome,
        contentBlocks: safeJson(pageContent, []),
        isPreview,
        seoTitle: page.seoTitle,
        seoDescription: page.seoDescription,
        seoKeywords: page.seoKeywords,
        globalContent,
        navigation: navMenu ? {
          id: navMenu.id,
          name: navMenu.name,
          items: normalizeNavigationItems(navMenu.items),
        } : null,
        footer: cmsFooter ? {
          id: cmsFooter.id,
          copyrightText: cmsFooter.copyrightText,
          socialLinks: safeJson(cmsFooter.socialLinks, []),
          secondaryLinks: safeJson(cmsFooter.secondaryLinks, []),
        } : null,
        theme: {
          name: page.website.theme.name,
          settings: safeJson(themeSettings, {}),
        },
      },
    });
  } catch (err) {
    console.error('Render CMS page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// PUBLIC ENDPOINT: GET /api/cms/site-context
// ─────────────────────────────────────────────────────────────
// Resolves website global settings, active theme, and navigation.
// No auth required.
// ─────────────────────────────────────────────────────────────
router.get('/site-context', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    const websiteId = (req as any).websiteId as string | undefined;

    if (!tenantId || !websiteId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant || tenant.status !== 'active') {
      res.status(404).json({ error: 'Tenant not found or inactive' });
      return;
    }

    // Enforce that the 'website-cms' module is active for the tenant
    const entitlement = await prisma.tenantModule.findUnique({
      where: { tenantId_moduleKey: { tenantId, moduleKey: 'website-cms' } },
    });

    if (!entitlement || entitlement.status !== 'active') {
      res.status(403).json({ error: 'Website CMS module is inactive' });
      return;
    }

    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      include: { theme: true },
    });

    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    // Fetch active navigation menu for this website
    const navMenu = await prisma.navigationMenu.findFirst({
      where: { websiteId, isActive: true },
    });

    // Fetch footer configuration for this website
    const cmsFooter = await prisma.cmsFooter.findFirst({
      where: { websiteId },
    });

    // Fetch active plugins for this tenant
    const plugins = await prisma.tenantPlugin.findMany({
      where: { tenantId, status: 'active' },
    });
    const enabledPlugins = plugins.map(p => p.pluginId);
    const pluginSettings: Record<string, any> = {};
    for (const p of plugins) {
      pluginSettings[p.pluginId] = safeJson(p.settings, {});
    }

    // Fetch modules to build moduleEntitlements list
    const modules = await prisma.tenantModule.findMany({
      where: { tenantId },
    });
    const moduleEntitlements = modules.map(m => ({
      moduleKey: m.moduleKey,
      enabled: m.status === 'active',
    }));

    res.json({
      data: {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          subdomain: tenant.subdomain,
          status: tenant.status,
        },
        theme: {
          id: website.theme.id,
          name: website.theme.name,
          settings: safeJson(website.theme.settings, {}),
          draftSettings: safeJson(website.theme.draftSettings, null),
        },
        moduleEntitlements,
        navigation: navMenu ? {
          id: navMenu.id,
          items: normalizeNavigationItems(navMenu.items),
        } : null,
        footer: cmsFooter ? {
          id: cmsFooter.id,
          copyrightText: cmsFooter.copyrightText,
          socialLinks: safeJson(cmsFooter.socialLinks, []),
          secondaryLinks: safeJson(cmsFooter.secondaryLinks, []),
        } : null,
        announcement: {
          id: 'default-announcement',
          isActive: false,
          text: '',
        },
        enabledPlugins,
        pluginSettings,
      },
    });
  } catch (err) {
    console.error('Fetch site context error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// ADMIN ENDPOINTS (Requires authentication & entitlement locks)
// ─────────────────────────────────────────────────────────────
// Public Church Services archive/detail/replay endpoints.
router.get('/services', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    if (!(await hasActiveModule(tenantId, CHURCH_SERVICES_MODULE_KEY))) {
      res.status(403).json({ error: 'Church Services module is inactive' });
      return;
    }

    const result = await ChurchServicesService.listPublicServices(tenantId, churchServiceFilters(req));
    res.json({
      data: result.services,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
      },
      serviceTypes: result.serviceTypes,
      latestService: result.latestService,
      upcomingServices: result.upcomingServices,
      summary: result.summary,
    });
  } catch (err: any) {
    console.error('Fetch public church services error:', err);
    res.status(statusForChurchServices(err)).json({ error: err.message });
  }
});

router.get('/services/:id', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    if (!(await hasActiveModule(tenantId, CHURCH_SERVICES_MODULE_KEY))) {
      res.status(403).json({ error: 'Church Services module is inactive' });
      return;
    }

    const data = await ChurchServicesService.getPublicService(req.params.id as string, tenantId, { trackView: true });
    res.json({ data });
  } catch (err: any) {
    console.error('Fetch public church service detail error:', err);
    res.status(statusForChurchServices(err)).json({ error: err.message });
  }
});

router.post('/services/:id/replay', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    if (!(await hasActiveModule(tenantId, CHURCH_SERVICES_MODULE_KEY))) {
      res.status(403).json({ error: 'Church Services module is inactive' });
      return;
    }

    const data = await ChurchServicesService.recordPublicReplay(tenantId, req.params.id as string);
    res.json({ data });
  } catch (err: any) {
    console.error('Record public church service replay error:', err);
    res.status(statusForChurchServices(err)).json({ error: err.message });
  }
});

// Public Livestream player context, chat, interactions, and Bible lookup endpoints.
router.get('/livestream', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    const data = await getPublicLivestreamContext(tenantId, req.query as Record<string, any>);
    res.json({ data });
  } catch (err: any) {
    console.error('Fetch public livestream context error:', err);
    res.status(statusForChurchServices(err)).json({ error: err.message });
  }
});

router.get('/livestream/:id', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    const data = await getPublicLivestreamContext(tenantId, req.query as Record<string, any>, req.params.id as string);
    if (!data.stream) {
      res.status(404).json({ error: 'Livestream not found' });
      return;
    }
    res.json({ data });
  } catch (err: any) {
    console.error('Fetch public livestream detail error:', err);
    res.status(statusForChurchServices(err)).json({ error: err.message });
  }
});

router.get('/livestream/:id/chat', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }
    await assertPublicLivestreamAccess(tenantId);
    const stream = await findPublicLivestream(tenantId, req.params.id as string);
    if (!stream) {
      res.status(404).json({ error: 'Livestream not found' });
      return;
    }
    if (!stream.chatEnabled) {
      res.status(403).json({ error: 'Live chat is disabled for this stream.' });
      return;
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const messages = await getChatMessages(stream.id, limit);
    res.json({ data: messages });
  } catch (err: any) {
    console.error('Fetch public livestream chat error:', err);
    res.status(statusForChurchServices(err)).json({ error: err.message });
  }
});

router.post('/livestream/:id/chat', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }
    await assertPublicLivestreamAccess(tenantId);
    const stream = await findPublicLivestream(tenantId, req.params.id as string);
    if (!stream) {
      res.status(404).json({ error: 'Livestream not found' });
      return;
    }
    if (stream.status !== 'live') {
      res.status(400).json({ error: 'Cannot send chat message to an inactive broadcast.' });
      return;
    }
    if (!stream.chatEnabled) {
      res.status(403).json({ error: 'Live chat is disabled for this stream.' });
      return;
    }

    const displayName = String(req.body?.displayName || '').trim();
    const message = String(req.body?.message || '').trim();
    if (!displayName || !message) {
      res.status(400).json({ error: 'displayName and message are required' });
      return;
    }

    const chat = await sendChatMessage(stream.id, tenantId, null, displayName.slice(0, 80), message.slice(0, 1000));
    res.status(201).json({ data: chat });
  } catch (err: any) {
    console.error('Send public livestream chat error:', err);
    res.status(statusForChurchServices(err)).json({ error: err.message });
  }
});

router.post('/livestream/:id/interactions', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }
    await assertPublicLivestreamAccess(tenantId);
    const stream = await findPublicLivestream(tenantId, req.params.id as string);
    if (!stream) {
      res.status(404).json({ error: 'Livestream not found' });
      return;
    }

    const type = String(req.body?.type || '').trim();
    const content = req.body?.content === undefined ? undefined : String(req.body.content).slice(0, 2000);
    if (!PUBLIC_INTERACTION_TYPES.includes(type)) {
      res.status(400).json({ error: `type must be one of: ${PUBLIC_INTERACTION_TYPES.join(', ')}` });
      return;
    }

    const interaction = await submitInteraction(stream.id, tenantId, type, undefined, content);
    res.status(201).json({ data: interaction });
  } catch (err: any) {
    console.error('Submit public livestream interaction error:', err);
    res.status(statusForChurchServices(err)).json({ error: err.message });
  }
});

router.post('/livestream/:id/viewers/join', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }
    await assertPublicLivestreamAccess(tenantId);
    const stream = await findPublicLivestream(tenantId, req.params.id as string);
    if (!stream) {
      res.status(404).json({ error: 'Livestream not found' });
      return;
    }

    const viewer = await trackViewerJoin(stream.id, tenantId, undefined, req.body?.sessionId);
    res.status(201).json({ data: viewer });
  } catch (err: any) {
    console.error('Public livestream viewer join error:', err);
    res.status(statusForChurchServices(err)).json({ error: err.message });
  }
});

router.post('/livestream/:id/viewers/leave', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }
    await assertPublicLivestreamAccess(tenantId);
    if (!req.body?.viewerId) {
      res.status(400).json({ error: 'viewerId is required' });
      return;
    }

    const viewer = await trackViewerLeave(req.body.viewerId as string);
    res.json({ data: viewer });
  } catch (err: any) {
    console.error('Public livestream viewer leave error:', err);
    res.status(statusForChurchServices(err)).json({ error: err.message });
  }
});

router.get('/bible/read/:translation/:book/:chapter', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    const translation = req.params.translation as string;
    const book = req.params.book as string;
    const chapter = parseInt(req.params.chapter as string, 10);
    const verses = await getChapter(tenantId, translation, bookSlug(book), chapter);
    const data = verses.length ? verses.map(normalizeBibleVerse) : await bibleChapterFallback(translation, book, chapter);
    res.json({ data });
  } catch (err: any) {
    console.error('Public Bible chapter error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/bible/search', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    const translation = String(req.query.translation || 'kjv');
    const q = String(req.query.q || '').trim();
    if (!q) {
      res.status(400).json({ error: 'q is required' });
      return;
    }

    const verses = await searchBible(tenantId, translation, q);
    let data = verses.map(normalizeBibleVerse);
    if (!data.length && /\d+:\d+/.test(q)) {
      data = await bibleReferenceFallback(translation, q);
    }
    if (!data.length && translation.toLowerCase() === 'kjv') {
      const needle = q.toLowerCase();
      data = FALLBACK_KJV_VERSES
        .filter((verse) => verse.text.toLowerCase().includes(needle) || `${verse.book} ${verse.chapter}:${verse.verse}`.toLowerCase().includes(needle))
        .map(normalizeBibleVerse);
    }
    res.json({ data });
  } catch (err: any) {
    console.error('Public Bible search error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.get('/bible/resolve', dnsMiddleware, async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      res.status(404).json({ error: 'Website context not found' });
      return;
    }

    const translation = String(req.query.translation || 'kjv');
    const ref = String(req.query.ref || '').trim();
    if (!ref) {
      res.status(400).json({ error: 'ref is required' });
      return;
    }

    const verses = await resolveScriptureReference(tenantId, translation, ref).catch(() => []);
    const data = verses.length ? verses.map(normalizeBibleVerse) : await bibleReferenceFallback(translation, ref);
    res.json({ data });
  } catch (err: any) {
    console.error('Public Bible resolve error:', err);
    res.status(400).json({ error: err.message });
  }
});

router.use(authMiddleware);
router.use(requireModule('website-cms'));

const requireCmsPermission = (...permissions: string[]) =>
  requireAnyPermission('tenant.settings', ...permissions);

// Read persisted Website Builder global content.
router.get('/global-content', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const block = await ensureEcclesiaGlobalContent(req.tenantId!);
    res.json({
      data: {
        id: block.id,
        key: block.key,
        name: block.name,
        content: safeJson(block.content, createEcclesiaGlobalContent()),
      },
    });
  } catch (err) {
    console.error('Get global content error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save Website Builder global content without changing page or theme drafts.
router.patch('/global-content', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;
    const current = await ensureEcclesiaGlobalContent(tenantId);
    const incoming = req.body?.content && typeof req.body.content === 'object' ? req.body.content : req.body;
    const existingContent = safeJson<Record<string, any>>(current.content, createEcclesiaGlobalContent());
    const content = {
      ...existingContent,
      ...incoming,
      churchIdentity: { ...(existingContent.churchIdentity || {}), ...(incoming.churchIdentity || {}) },
      leadership: { ...(existingContent.leadership || {}), ...(incoming.leadership || {}) },
      contact: { ...(existingContent.contact || {}), ...(incoming.contact || {}) },
      social: { ...(existingContent.social || {}), ...(incoming.social || {}) },
      services: { ...(existingContent.services || {}), ...(incoming.services || {}) },
      callsToAction: { ...(existingContent.callsToAction || {}), ...(incoming.callsToAction || {}) },
    };

    const block = await prisma.reusableBlock.update({
      where: { id: current.id },
      data: {
        name: 'Ecclesia Global Content',
        content: JSON.stringify(content),
      },
    });

    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'global_content_update',
        metadataJson: JSON.stringify({ key: ECCLESIA_GLOBAL_CONTENT_KEY }),
      },
    });

    res.json({
      data: {
        id: block.id,
        key: block.key,
        name: block.name,
        content,
      },
    });
  } catch (err) {
    console.error('Save global content error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new Website profile
router.post('/websites', requireCmsPermission('core-website-cms.create', 'core-website-cms.manage_settings'), async (req: Request, res: Response) => {
  try {
    const { title, description, domain, themeId } = req.body;
    const tenantId = req.tenantId!;

    if (!title || !themeId) {
      res.status(400).json({ error: 'title and themeId are required' });
      return;
    }

    // Verify theme exists and belongs to this tenant or is global (tenantId === null)
    const theme = await prisma.theme.findFirst({
      where: {
        id: themeId as string,
        OR: [{ tenantId: null }, { tenantId }],
      },
    });

    if (!theme) {
      res.status(404).json({ error: 'Theme not found' });
      return;
    }

    const website = await prisma.website.create({
      data: {
        tenantId,
        themeId,
        title,
        description: description || null,
        domain: domain || null,
        isActive: true,
      },
    });

    res.status(201).json({ data: website });
  } catch (err) {
    console.error('Create website error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all websites for the active tenant
router.get('/websites', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const websites = await prisma.website.findMany({
      where: { tenantId },
    });
    res.json({ data: websites });
  } catch (err) {
    console.error('Fetch websites error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a custom Theme configuration
router.post('/themes', requireCmsPermission('core-website-cms.manage_settings'), async (req: Request, res: Response) => {
  try {
    const { name, settings } = req.body;
    const tenantId = req.tenantId!;

    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const theme = await prisma.theme.create({
      data: {
        tenantId,
        name,
        settings: settings ? JSON.stringify(settings) : '{}',
        isCustom: true,
      },
    });

    res.status(201).json({ data: theme });
  } catch (err) {
    console.error('Create theme error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper to save page revision and enforce 15 revisions limit
async function savePageRevision(tenantId: string, pageId: string, content: string, userId?: string) {
  const lastRevision = await prisma.pageRevision.findFirst({
    where: { pageId },
    orderBy: { version: 'desc' },
  });
  const nextVersion = lastRevision ? lastRevision.version + 1 : 1;

  await prisma.pageRevision.create({
    data: {
      tenantId,
      pageId,
      content,
      version: nextVersion,
      createdById: userId || null,
    },
  });

  const revisions = await prisma.pageRevision.findMany({
    where: { pageId },
    orderBy: { version: 'desc' },
  });
  if (revisions.length > 15) {
    const oldestToKeep = revisions[14];
    await prisma.pageRevision.deleteMany({
      where: {
        pageId,
        version: { lt: oldestToKeep.version },
      },
    });
  }
}

// ─────────────────────────────────────────────────────────────
// PAGES CRUD & REVISIONS
// ─────────────────────────────────────────────────────────────

// Create a new CMS page
router.post('/pages', requireCmsPermission('core-website-cms.create'), async (req: Request, res: Response) => {
  try {
    const { websiteId, slug, title, content, status, isHome, seoTitle, seoDescription, seoKeywords } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!websiteId || slug === undefined || !title) {
      res.status(400).json({ error: 'websiteId, slug, and title are required' });
      return;
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId as string, tenantId },
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const duplicate = await prisma.page.findUnique({
      where: { websiteId_slug: { websiteId, slug } },
    });
    if (duplicate) {
      res.status(409).json({ error: 'A page with this slug already exists on this website' });
      return;
    }

    const pageContent = content ? (typeof content === 'string' ? content : JSON.stringify(content)) : '[]';

    const page = await prisma.page.create({
      data: {
        tenantId,
        websiteId,
        slug,
        title,
        content: pageContent,
        status: status || 'draft',
        isHome: isHome || false,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        seoKeywords: seoKeywords || null,
      },
    });

    // Save initial revision
    await savePageRevision(tenantId, page.id, pageContent, userId);

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_create',
        pageId: page.id,
        metadataJson: JSON.stringify({ title: page.title, slug: page.slug }),
      },
    });

    res.status(201).json({ data: page });
  } catch (err) {
    console.error('Create page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all pages (including drafts) for editing
router.get('/pages', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const pages = await prisma.page.findMany({
      where: { tenantId },
      orderBy: { slug: 'asc' },
    });

    res.json({ data: pages });
  } catch (err) {
    console.error('List pages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get page details by ID (including draft and metadata)
router.get('/pages/:id', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }
    res.json({ data: page });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/pages/:id', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    const existing = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const { slug, title, content, status, isHome, seoTitle, seoDescription, seoKeywords } = req.body;

    const pageContent = content !== undefined ? (typeof content === 'string' ? content : JSON.stringify(content)) : undefined;

    const page = await prisma.page.update({
      where: { id },
      data: {
        ...(slug !== undefined && { slug }),
        ...(title !== undefined && { title }),
        ...(pageContent !== undefined && { content: pageContent }),
        ...(status !== undefined && { status }),
        ...(isHome !== undefined && { isHome }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(seoKeywords !== undefined && { seoKeywords }),
      },
    });

    // Create a new version revision if content changed
    if (pageContent !== undefined && pageContent !== existing.content) {
      await savePageRevision(tenantId, page.id, pageContent, userId);
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_update',
        pageId: page.id,
        metadataJson: JSON.stringify({ title: page.title, slug: page.slug, updatedFields: Object.keys(req.body) }),
      },
    });

    res.json({ data: page });
  } catch (err) {
    console.error('Update page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List all revisions for a specific page
router.get('/pages/:id/revisions', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const revisions = await prisma.pageRevision.findMany({
      where: { pageId: id, tenantId },
      include: {
        createdBy: {
          select: { email: true },
        },
      },
      orderBy: { version: 'desc' },
    });

    res.json({ data: revisions });
  } catch (err) {
    console.error('List revisions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rollback page content to a specific revision
router.post('/pages/:id/rollback', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { revisionId } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!revisionId) {
      res.status(400).json({ error: 'revisionId is required' });
      return;
    }

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const revision = await prisma.pageRevision.findFirst({
      where: { id: revisionId, pageId: id, tenantId },
    });
    if (!revision) {
      res.status(404).json({ error: 'Revision not found' });
      return;
    }

    const updatedPage = await prisma.page.update({
      where: { id },
      data: {
        content: revision.content,
      },
    });

    // Rollback creates a new revision version
    await savePageRevision(tenantId, page.id, revision.content, userId);

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_rollback',
        pageId: page.id,
        metadataJson: JSON.stringify({ rollbackToVersion: revision.version, revisionId }),
      },
    });

    res.json({ data: updatedPage });
  } catch (err) {
    console.error('Rollback page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// NAVIGATION MENU MANAGEMENT
// ─────────────────────────────────────────────────────────────

// List navigation menus
router.get('/navigation', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const menus = await prisma.navigationMenu.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    res.json({ data: menus });
  } catch (err) {
    console.error('List navigation menus error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update a menu structure
router.post('/navigation', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const { id, websiteId, name, items, isActive } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!websiteId || !name) {
      res.status(400).json({ error: 'websiteId and name are required' });
      return;
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const menuItems = items ? (typeof items === 'string' ? items : JSON.stringify(items)) : '[]';

    let menu;
    if (id) {
      // ownership check
      const existing = await prisma.navigationMenu.findFirst({
        where: { id, tenantId },
      });
      if (!existing) {
        res.status(404).json({ error: 'Navigation menu not found' });
        return;
      }
      menu = await prisma.navigationMenu.update({
        where: { id },
        data: {
          name,
          items: menuItems,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    } else {
      menu = await prisma.navigationMenu.create({
        data: {
          tenantId,
          websiteId,
          name,
          items: menuItems,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'navigation_update',
        metadataJson: JSON.stringify({ menuId: menu.id, name: menu.name }),
      },
    });

    res.json({ data: menu });
  } catch (err) {
    console.error('Save navigation menu error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// FOOTER BUILDER MANAGEMENT
// ─────────────────────────────────────────────────────────────

// Get footer configuration for website
router.get('/footer', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const websiteId = req.query.websiteId as string;
    const tenantId = req.tenantId!;

    if (!websiteId) {
      res.status(400).json({ error: 'websiteId is required' });
      return;
    }

    const footer = await prisma.cmsFooter.findFirst({
      where: { websiteId, tenantId },
    });

    res.json({ data: footer });
  } catch (err) {
    console.error('Get footer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create or update website footer
router.post('/footer', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const { websiteId, copyrightText, socialLinks, secondaryLinks } = req.body;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    if (!websiteId) {
      res.status(400).json({ error: 'websiteId is required' });
      return;
    }

    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const social = socialLinks ? (typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks)) : '[]';
    const secondary = secondaryLinks ? (typeof secondaryLinks === 'string' ? secondaryLinks : JSON.stringify(secondaryLinks)) : '[]';

    const existingFooter = await prisma.cmsFooter.findFirst({
      where: { websiteId, tenantId },
    });

    let footer;
    if (existingFooter) {
      footer = await prisma.cmsFooter.update({
        where: { id: existingFooter.id },
        data: {
          copyrightText: copyrightText || null,
          socialLinks: social,
          secondaryLinks: secondary,
        },
      });
    } else {
      footer = await prisma.cmsFooter.create({
        data: {
          tenantId,
          websiteId,
          copyrightText: copyrightText || null,
          socialLinks: social,
          secondaryLinks: secondary,
        },
      });
    }

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'footer_update',
        metadataJson: JSON.stringify({ footerId: footer.id }),
      },
    });

    res.json({ data: footer });
  } catch (err) {
    console.error('Save footer error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// REUSABLE BLOCKS MANAGEMENT
// ─────────────────────────────────────────────────────────────

// List reusable blocks
router.get('/reusable-blocks', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const blocks = await prisma.reusableBlock.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    res.json({ data: blocks });
  } catch (err) {
    console.error('List reusable blocks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create reusable block
router.post('/reusable-blocks', requireCmsPermission('core-website-cms.create'), async (req: Request, res: Response) => {
  try {
    const { name, key, content } = req.body;
    const tenantId = req.tenantId!;

    if (!name || !key || !content) {
      res.status(400).json({ error: 'name, key, and content are required' });
      return;
    }

    const duplicate = await prisma.reusableBlock.findFirst({
      where: { tenantId, key },
    });
    if (duplicate) {
      res.status(409).json({ error: 'A block with this key already exists for this tenant' });
      return;
    }

    const block = await prisma.reusableBlock.create({
      data: {
        tenantId,
        name,
        key,
        content: typeof content === 'string' ? content : JSON.stringify(content),
      },
    });

    res.status(201).json({ data: block });
  } catch (err) {
    console.error('Create reusable block error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update reusable block
router.patch('/reusable-blocks/:id', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const { name, key, content } = req.body;

    const existing = await prisma.reusableBlock.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      res.status(404).json({ error: 'Reusable block not found' });
      return;
    }

    if (key && key !== existing.key) {
      const duplicate = await prisma.reusableBlock.findFirst({
        where: { tenantId, key, id: { not: id } },
      });
      if (duplicate) {
        res.status(409).json({ error: 'A block with this key already exists for this tenant' });
        return;
      }
    }

    const block = await prisma.reusableBlock.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(key !== undefined && { key }),
        ...(content !== undefined && { content: typeof content === 'string' ? content : JSON.stringify(content) }),
      },
    });

    res.json({ data: block });
  } catch (err) {
    console.error('Update reusable block error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// AUDIT LOGS (CMS ACTIVITY LOGS)
// ─────────────────────────────────────────────────────────────

// Get CMS activity logs
router.get('/activity-logs', requireCmsPermission('core-website-cms.view_reports'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const logs = await prisma.cmsActivityLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100, // cap to 100 for safety
    });

    res.json({ data: logs });
  } catch (err) {
    console.error('Get CMS activity logs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save page visual changes to draftContent
router.patch('/pages/:id/draft', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const { draftContent } = req.body;

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const contentStr = typeof draftContent === 'string' ? draftContent : JSON.stringify(draftContent);

    const updated = await prisma.page.update({
      where: { id },
      data: {
        draftContent: contentStr,
      },
    });

    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Promote page draftContent to live content, set status to published, and clear draftContent
router.post('/pages/:id/publish', requireCmsPermission('core-website-cms.update'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;
    const userId = req.user?.userId;

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const nextContent = page.draftContent || page.content;

    const updated = await prisma.page.update({
      where: { id },
      data: {
        content: nextContent,
        draftContent: null,
        status: 'published',
      },
    });

    // Save page revision snapshot
    await savePageRevision(tenantId, page.id, nextContent, userId);

    // Log activity
    await prisma.cmsActivityLog.create({
      data: {
        tenantId,
        userId,
        actionType: 'page_publish',
        pageId: page.id,
        metadataJson: JSON.stringify({ title: page.title, slug: page.slug }),
      },
    });

    res.json({ data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Generate 15-minute temporary preview JWT token
router.post('/pages/:id/preview', requireCmsPermission('core-website-cms.read'), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const tenantId = req.tenantId!;

    const page = await prisma.page.findFirst({
      where: { id, tenantId },
    });
    if (!page) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const payload = {
      pageId: page.id,
      tenantId: page.tenantId,
      exp: Math.floor(Date.now() / 1000) + 15 * 60, // 15 minutes
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret');

    res.json({
      data: {
        previewToken: token,
        previewUrl: `/api/cms/render?slug=${page.slug}&previewToken=${token}`,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
