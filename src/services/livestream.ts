import prisma from '../lib/prisma';
import { randomBytes } from 'crypto';

// ─────────────────────────────────────────────────────────────
// Helper: generate a stream key
// ─────────────────────────────────────────────────────────────
function generateStreamKey(): string {
  return `live_${randomBytes(16).toString('hex')}`;
}

// ─────────────────────────────────────────────────────────────
// STREAM LIFECYCLE
// ─────────────────────────────────────────────────────────────
interface ScheduleStreamInput {
  title: string;
  description?: string;
  scheduledAt?: string;
  thumbnailUrl?: string;
  countdownEnabled?: boolean;
  chatEnabled?: boolean;
  multiPlatformLinks?: Array<{ platform: string; url: string }>;
}

export async function scheduleStream(tenantId: string, data: ScheduleStreamInput) {
  const streamKey = generateStreamKey();
  const rtmpIngestUrl = `rtmp://ingest.churchos.io/live/${streamKey}`;

  return prisma.livestream.create({
    data: {
      tenantId,
      title: data.title,
      description: data.description,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      streamKey,
      rtmpIngestUrl,
      thumbnailUrl: data.thumbnailUrl,
      countdownEnabled: data.countdownEnabled ?? true,
      chatEnabled: data.chatEnabled ?? true,
      multiPlatformLinks: JSON.stringify(data.multiPlatformLinks || []),
      status: 'scheduled',
    },
  });
}

export async function getStream(id: string, tenantId: string) {
  const stream = await prisma.livestream.findFirst({
    where: { id, tenantId },
    include: {
      replayAsset: true,
    },
  });

  if (!stream) return null;

  return {
    ...stream,
    multiPlatformLinks: JSON.parse(stream.multiPlatformLinks || '[]'),
  };
}

export async function listStreams(tenantId: string, status?: string) {
  const where: any = { tenantId };
  if (status) where.status = status;

  const streams = await prisma.livestream.findMany({
    where,
    orderBy: { scheduledAt: 'desc' },
    include: {
      replayAsset: true,
      _count: { select: { viewers: true, chatMessages: true } },
    },
  });

  return streams.map((s) => ({
    ...s,
    multiPlatformLinks: JSON.parse(s.multiPlatformLinks || '[]'),
  }));
}

export async function goLive(id: string, tenantId: string) {
  const stream = await prisma.livestream.findFirst({ where: { id, tenantId } });
  if (!stream) throw new Error('Stream not found');
  if (stream.status !== 'scheduled') throw new Error('Stream must be in scheduled status to go live');

  return prisma.livestream.update({
    where: { id },
    data: {
      status: 'live',
      startedAt: new Date(),
    },
  });
}

export async function endStream(id: string, tenantId: string) {
  const stream = await prisma.livestream.findFirst({ where: { id, tenantId } });
  if (!stream) throw new Error('Stream not found');
  if (stream.status !== 'live') throw new Error('Stream must be live to end');

  const endedAt = new Date();

  // Auto-create a replay MediaAsset from the ended stream
  const replayAsset = await prisma.mediaAsset.create({
    data: {
      tenantId,
      title: `Replay: ${stream.title}`,
      description: stream.description || `Replay of livestream: ${stream.title}`,
      type: 'video',
      providerType: 'platform_managed',
      sourceUrl: `https://cdn.churchos.io/replays/${stream.streamKey}.mp4`,
      thumbnailUrl: stream.thumbnailUrl,
      durationSeconds: stream.startedAt
        ? Math.floor((endedAt.getTime() - stream.startedAt.getTime()) / 1000)
        : null,
      status: 'published',
      visibility: 'public',
      publishedAt: endedAt,
    },
  });

  return prisma.livestream.update({
    where: { id },
    data: {
      status: 'ended',
      endedAt,
      replayAssetId: replayAsset.id,
    },
    include: {
      replayAsset: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// CHAT
// ─────────────────────────────────────────────────────────────
export async function sendChatMessage(
  livestreamId: string,
  tenantId: string,
  userId: string | null,
  displayName: string,
  message: string
) {
  return prisma.livestreamChat.create({
    data: { livestreamId, tenantId, userId, displayName, message },
  });
}

export async function getChatMessages(livestreamId: string, limit: number = 100) {
  return prisma.livestreamChat.findMany({
    where: { livestreamId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

// ─────────────────────────────────────────────────────────────
// VIEWER TRACKING
// ─────────────────────────────────────────────────────────────
export async function trackViewerJoin(
  livestreamId: string,
  tenantId: string,
  userId?: string,
  sessionId?: string
) {
  return prisma.livestreamViewer.create({
    data: { livestreamId, tenantId, userId, sessionId },
  });
}

export async function trackViewerLeave(viewerId: string) {
  const viewer = await prisma.livestreamViewer.findUnique({ where: { id: viewerId } });
  if (!viewer) throw new Error('Viewer session not found');

  const leftAt = new Date();
  const durationSeconds = Math.floor((leftAt.getTime() - viewer.joinedAt.getTime()) / 1000);

  return prisma.livestreamViewer.update({
    where: { id: viewerId },
    data: { leftAt, durationSeconds },
  });
}

export async function getStreamAnalytics(livestreamId: string) {
  const viewers = await prisma.livestreamViewer.findMany({
    where: { livestreamId },
  });

  const totalViewers = viewers.length;
  const uniqueUserIds = new Set(viewers.filter((v) => v.userId).map((v) => v.userId));
  const uniqueViewers = uniqueUserIds.size || totalViewers; // fallback to total if no userIds

  // Aggregate watch time in seconds
  const totalWatchTimeSeconds = viewers.reduce((sum, v) => sum + (v.durationSeconds || 0), 0);

  // Compute peak concurrent viewers
  // Build a timeline of join/leave events
  const events: Array<{ time: Date; delta: number }> = [];
  for (const v of viewers) {
    events.push({ time: v.joinedAt, delta: 1 });
    if (v.leftAt) {
      events.push({ time: v.leftAt, delta: -1 });
    }
  }
  events.sort((a, b) => a.time.getTime() - b.time.getTime());

  let concurrent = 0;
  let peakConcurrent = 0;
  for (const event of events) {
    concurrent += event.delta;
    if (concurrent > peakConcurrent) {
      peakConcurrent = concurrent;
    }
  }

  // Interaction counts
  const interactions = await prisma.livestreamInteraction.groupBy({
    by: ['type'],
    where: { livestreamId },
    _count: true,
  });

  const interactionCounts: Record<string, number> = {};
  for (const group of interactions) {
    interactionCounts[group.type] = group._count;
  }

  // Chat message count
  const chatCount = await prisma.livestreamChat.count({ where: { livestreamId } });

  return {
    totalViewers,
    uniqueViewers,
    peakConcurrent,
    totalWatchTimeSeconds,
    chatMessages: chatCount,
    interactions: interactionCounts,
  };
}

// ─────────────────────────────────────────────────────────────
// INTERACTIONS (prayer, salvation, notes, giving)
// ─────────────────────────────────────────────────────────────
export async function submitInteraction(
  livestreamId: string,
  tenantId: string,
  type: string,
  userId?: string,
  content?: string
) {
  return prisma.livestreamInteraction.create({
    data: { livestreamId, tenantId, type, userId, content },
  });
}

export async function getInteractions(livestreamId: string, type?: string) {
  const where: any = { livestreamId };
  if (type) where.type = type;

  return prisma.livestreamInteraction.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

// ─────────────────────────────────────────────────────────────
// EMBED CODE GENERATION
// ─────────────────────────────────────────────────────────────
export function generateStreamEmbed(stream: { id: string; title: string }): string {
  return `<iframe width="560" height="315" src="/live/${stream.id}" title="${stream.title}" frameborder="0" allowfullscreen></iframe>`;
}
