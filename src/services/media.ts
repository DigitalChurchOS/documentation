import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// Helper: slugify a name
// ─────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

// ─────────────────────────────────────────────────────────────
// CATEGORIES
// ─────────────────────────────────────────────────────────────
export async function createCategory(
  tenantId: string,
  name: string,
  parentId?: string
) {
  const slug = slugify(name);
  return prisma.mediaCategory.create({
    data: { tenantId, name, slug, parentId },
    include: { parent: true, children: true },
  });
}

export async function listCategories(tenantId: string) {
  return prisma.mediaCategory.findMany({
    where: { tenantId },
    include: { children: true },
    orderBy: { name: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// TAGS
// ─────────────────────────────────────────────────────────────
export async function createTag(tenantId: string, name: string) {
  const slug = slugify(name);
  return prisma.mediaTag.create({
    data: { tenantId, name, slug },
  });
}

export async function listTags(tenantId: string) {
  return prisma.mediaTag.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// SPEAKERS
// ─────────────────────────────────────────────────────────────
interface SpeakerInput {
  name: string;
  title?: string;
  bio?: string;
  photoUrl?: string;
}

export async function createSpeaker(tenantId: string, data: SpeakerInput) {
  return prisma.speaker.create({
    data: { tenantId, ...data },
  });
}

export async function listSpeakers(tenantId: string) {
  return prisma.speaker.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

export async function updateSpeaker(
  id: string,
  tenantId: string,
  data: Partial<SpeakerInput>
) {
  return prisma.speaker.update({
    where: { id },
    data,
  });
}

// ─────────────────────────────────────────────────────────────
// SERIES
// ─────────────────────────────────────────────────────────────
interface SeriesInput {
  title: string;
  description?: string;
  coverImageUrl?: string;
}

export async function createSeries(tenantId: string, data: SeriesInput) {
  return prisma.mediaSeries.create({
    data: { tenantId, ...data },
  });
}

export async function listSeries(tenantId: string) {
  return prisma.mediaSeries.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// ASSETS
// ─────────────────────────────────────────────────────────────
interface AssetInput {
  title: string;
  description?: string;
  type: string;
  providerType: string;
  providerKey?: string;
  sourceUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  mimeType?: string;
  categoryId?: string;
  seriesId?: string;
  seriesOrder?: number;
  speakerId?: string;
  visibility?: string;
  status?: string;
}

export async function createAsset(tenantId: string, data: AssetInput) {
  const publishedAt = data.status === 'published' ? new Date() : undefined;
  return prisma.mediaAsset.create({
    data: {
      tenantId,
      ...data,
      publishedAt,
    },
    include: {
      category: true,
      series: true,
      speaker: true,
      assetTags: { include: { tag: true } },
    },
  });
}

export async function getAsset(id: string, tenantId: string) {
  return prisma.mediaAsset.findFirst({
    where: { id, tenantId },
    include: {
      category: true,
      series: true,
      speaker: true,
      assetTags: { include: { tag: true } },
    },
  });
}

interface AssetFilters {
  categoryId?: string;
  seriesId?: string;
  speakerId?: string;
  tagIds?: string[];
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listAssets(tenantId: string, filters: AssetFilters = {}) {
  const { categoryId, seriesId, speakerId, tagIds, type, status, search, page = 1, pageSize = 20 } = filters;

  const where: any = { tenantId };

  if (categoryId) where.categoryId = categoryId;
  if (seriesId) where.seriesId = seriesId;
  if (speakerId) where.speakerId = speakerId;
  if (type) where.type = type;
  if (status) where.status = status;
  if (search) where.title = { contains: search };

  // Filter by tags: find assets that have at least one of the given tagIds
  if (tagIds && tagIds.length > 0) {
    where.assetTags = {
      some: { tagId: { in: tagIds } },
    };
  }

  const [assets, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      include: {
        category: true,
        series: true,
        speaker: true,
        assetTags: { include: { tag: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.mediaAsset.count({ where }),
  ]);

  return { assets, total, page, pageSize };
}

export async function updateAsset(
  id: string,
  tenantId: string,
  data: Partial<AssetInput>
) {
  // If status is being changed to 'published' and wasn't before, set publishedAt
  const existing = await prisma.mediaAsset.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Asset not found');

  const publishedAt =
    data.status === 'published' && existing.status !== 'published'
      ? new Date()
      : undefined;

  return prisma.mediaAsset.update({
    where: { id },
    data: {
      ...data,
      ...(publishedAt ? { publishedAt } : {}),
    },
    include: {
      category: true,
      series: true,
      speaker: true,
      assetTags: { include: { tag: true } },
    },
  });
}

export async function deleteAsset(id: string, tenantId: string) {
  // Soft-delete: set status to 'archived'
  const existing = await prisma.mediaAsset.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Asset not found');

  return prisma.mediaAsset.update({
    where: { id },
    data: { status: 'archived' },
  });
}

// ─────────────────────────────────────────────────────────────
// TAGGING ASSETS
// ─────────────────────────────────────────────────────────────
export async function tagAsset(assetId: string, tagIds: string[]) {
  // Use individual upserts for SQLite compatibility (no skipDuplicates support)
  for (const tagId of tagIds) {
    await prisma.mediaAssetTag.upsert({
      where: {
        assetId_tagId: { assetId, tagId },
      },
      create: { assetId, tagId },
      update: {},
    });
  }

  return prisma.mediaAssetTag.findMany({
    where: { assetId },
    include: { tag: true },
  });
}

export async function untagAsset(assetId: string, tagIds: string[]) {
  return prisma.mediaAssetTag.deleteMany({
    where: {
      assetId,
      tagId: { in: tagIds },
    },
  });
}

// ─────────────────────────────────────────────────────────────
// PLAYLISTS
// ─────────────────────────────────────────────────────────────
interface PlaylistInput {
  name: string;
  description?: string;
  coverImageUrl?: string;
  isPublic?: boolean;
}

export async function createPlaylist(tenantId: string, data: PlaylistInput) {
  return prisma.mediaPlaylist.create({
    data: { tenantId, ...data },
  });
}

export async function listPlaylists(tenantId: string) {
  return prisma.mediaPlaylist.findMany({
    where: { tenantId },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addToPlaylist(playlistId: string, assetId: string, order: number = 0) {
  return prisma.mediaPlaylistItem.create({
    data: { playlistId, assetId, order },
    include: { asset: true },
  });
}

export async function removeFromPlaylist(playlistId: string, assetId: string) {
  return prisma.mediaPlaylistItem.deleteMany({
    where: { playlistId, assetId },
  });
}

export async function getPlaylistItems(playlistId: string) {
  return prisma.mediaPlaylistItem.findMany({
    where: { playlistId },
    include: {
      asset: {
        include: {
          speaker: true,
          category: true,
        },
      },
    },
    orderBy: { order: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// EMBED CODE GENERATION
// ─────────────────────────────────────────────────────────────
export function generateEmbed(asset: {
  id: string;
  sourceUrl?: string | null;
  providerType: string;
  providerKey?: string | null;
  title: string;
}): string {
  if (asset.providerType === 'external_link' && asset.sourceUrl) {
    // For YouTube, extract video ID and generate iframe
    if (asset.providerKey === 'youtube') {
      const videoId = extractYouTubeId(asset.sourceUrl);
      if (videoId) {
        return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="${asset.title}" frameborder="0" allowfullscreen></iframe>`;
      }
    }

    // For Vimeo, extract video ID and generate iframe
    if (asset.providerKey === 'vimeo') {
      const vimeoId = extractVimeoId(asset.sourceUrl);
      if (vimeoId) {
        return `<iframe width="560" height="315" src="https://player.vimeo.com/video/${vimeoId}" title="${asset.title}" frameborder="0" allowfullscreen></iframe>`;
      }
    }

    // Generic external link: direct iframe
    return `<iframe width="560" height="315" src="${asset.sourceUrl}" title="${asset.title}" frameborder="0" allowfullscreen></iframe>`;
  }

  // Platform-managed: use a platform embed player URL
  return `<iframe width="560" height="315" src="/embed/media/${asset.id}" title="${asset.title}" frameborder="0" allowfullscreen></iframe>`;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return match ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}
