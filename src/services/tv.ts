import prisma from '../lib/prisma';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

/**
 * ─────────────────────────────────────────────────────────────
 * TV CHANNEL CRUD SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createChannel(
  tenantId: string,
  data: {
    name: string;
    slug?: string;
    slogan?: string;
    description?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    socialLinks?: any[];
    streamType?: string;
    streamProvider?: string;
    streamUrl?: string;
    streamKey?: string;
    isAutoProgrammingEnabled?: boolean;
  }
): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  const existing = await prisma.tvChannel.findFirst({
    where: { tenantId, slug },
  });
  if (existing) {
    throw new Error(`TV channel with slug '${slug}' already exists`);
  }

  const socialLinksStr = data.socialLinks ? JSON.stringify(data.socialLinks) : '[]';

  return await prisma.tvChannel.create({
    data: {
      tenantId,
      name: data.name,
      slug,
      slogan: data.slogan || null,
      description: data.description || null,
      logoUrl: data.logoUrl || null,
      coverImageUrl: data.coverImageUrl || null,
      socialLinks: socialLinksStr,
      streamType: data.streamType || 'managed',
      streamProvider: data.streamProvider || null,
      streamUrl: data.streamUrl || null,
      streamKey: data.streamKey || null,
      isAutoProgrammingEnabled: data.isAutoProgrammingEnabled !== undefined ? data.isAutoProgrammingEnabled : true,
      status: 'offline',
    },
  });
}

export async function updateChannel(
  id: string,
  tenantId: string,
  data: {
    name?: string;
    slug?: string;
    slogan?: string;
    description?: string;
    logoUrl?: string;
    coverImageUrl?: string;
    socialLinks?: any[];
    streamType?: string;
    streamProvider?: string;
    streamUrl?: string;
    streamKey?: string;
    status?: string;
    isAutoProgrammingEnabled?: boolean;
  }
): Promise<any> {
  const channel = await prisma.tvChannel.findFirst({
    where: { id, tenantId },
  });
  if (!channel) {
    throw new Error('TV channel not found');
  }

  let slug = channel.slug;
  if (data.slug) {
    slug = slugify(data.slug);
    const existing = await prisma.tvChannel.findFirst({
      where: { tenantId, slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`TV channel with slug '${slug}' already exists`);
    }
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.slug !== undefined) updateData.slug = slug;
  if (data.slogan !== undefined) updateData.slogan = data.slogan;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
  if (data.coverImageUrl !== undefined) updateData.coverImageUrl = data.coverImageUrl;
  if (data.socialLinks !== undefined) updateData.socialLinks = JSON.stringify(data.socialLinks);
  if (data.streamType !== undefined) updateData.streamType = data.streamType;
  if (data.streamProvider !== undefined) updateData.streamProvider = data.streamProvider;
  if (data.streamUrl !== undefined) updateData.streamUrl = data.streamUrl;
  if (data.streamKey !== undefined) updateData.streamKey = data.streamKey;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.isAutoProgrammingEnabled !== undefined) updateData.isAutoProgrammingEnabled = data.isAutoProgrammingEnabled;

  return await prisma.tvChannel.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteChannel(id: string, tenantId: string): Promise<any> {
  const channel = await prisma.tvChannel.findFirst({
    where: { id, tenantId },
  });
  if (!channel) {
    throw new Error('TV channel not found');
  }

  return await prisma.tvChannel.delete({
    where: { id },
  });
}

export async function getChannel(idOrSlug: string, tenantId: string): Promise<any> {
  const channel = await prisma.tvChannel.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });

  if (!channel) {
    throw new Error('TV channel not found');
  }

  return channel;
}

export async function listChannels(tenantId: string): Promise<any[]> {
  return await prisma.tvChannel.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * TV PROGRAM CRUD SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createProgram(
  tenantId: string,
  channelId: string,
  data: {
    title: string;
    slug?: string;
    description?: string;
    speaker?: string;
    category: string;
  }
): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.title);

  const existing = await prisma.tvProgram.findFirst({
    where: { tenantId, channelId, slug },
  });
  if (existing) {
    throw new Error(`TV program with slug '${slug}' already exists for this channel`);
  }

  return await prisma.tvProgram.create({
    data: {
      tenantId,
      channelId,
      title: data.title,
      slug,
      description: data.description || null,
      speaker: data.speaker || null,
      category: data.category,
    },
  });
}

export async function updateProgram(
  id: string,
  tenantId: string,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    speaker?: string;
    category?: string;
  }
): Promise<any> {
  const program = await prisma.tvProgram.findFirst({
    where: { id, tenantId },
  });
  if (!program) {
    throw new Error('TV program not found');
  }

  let slug = program.slug;
  if (data.slug) {
    slug = slugify(data.slug);
    const existing = await prisma.tvProgram.findFirst({
      where: { tenantId, channelId: program.channelId, slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`TV program with slug '${slug}' already exists`);
    }
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.speaker !== undefined) updateData.speaker = data.speaker;
  if (data.category !== undefined) updateData.category = data.category;

  return await prisma.tvProgram.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteProgram(id: string, tenantId: string): Promise<any> {
  const program = await prisma.tvProgram.findFirst({
    where: { id, tenantId },
  });
  if (!program) {
    throw new Error('TV program not found');
  }

  return await prisma.tvProgram.delete({
    where: { id },
  });
}

export async function listPrograms(channelId: string, tenantId: string): Promise<any[]> {
  return await prisma.tvProgram.findMany({
    where: { channelId, tenantId },
    orderBy: { title: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * TV SCHEDULE SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createSchedule(
  tenantId: string,
  programId: string,
  data: {
    startTime: string | Date;
    endTime: string | Date;
    recurrence?: string;
    daysOfWeek?: string;
  }
): Promise<any> {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  if (start >= end) {
    throw new Error('Start time must be before end time');
  }

  return await prisma.tvSchedule.create({
    data: {
      tenantId,
      programId,
      startTime: start,
      endTime: end,
      recurrence: data.recurrence || 'none',
      daysOfWeek: data.daysOfWeek || null,
    },
  });
}

export async function updateSchedule(
  id: string,
  tenantId: string,
  data: {
    startTime?: string | Date;
    endTime?: string | Date;
    recurrence?: string;
    daysOfWeek?: string;
  }
): Promise<any> {
  const schedule = await prisma.tvSchedule.findFirst({
    where: { id, tenantId },
  });
  if (!schedule) {
    throw new Error('Schedule entry not found');
  }

  const start = data.startTime ? new Date(data.startTime) : new Date(schedule.startTime);
  const end = data.endTime ? new Date(data.endTime) : new Date(schedule.endTime);

  if (start >= end) {
    throw new Error('Start time must be before end time');
  }

  const updateData: any = {};
  if (data.startTime !== undefined) updateData.startTime = start;
  if (data.endTime !== undefined) updateData.endTime = end;
  if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
  if (data.daysOfWeek !== undefined) updateData.daysOfWeek = data.daysOfWeek;

  return await prisma.tvSchedule.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteSchedule(id: string, tenantId: string): Promise<any> {
  const schedule = await prisma.tvSchedule.findFirst({
    where: { id, tenantId },
  });
  if (!schedule) {
    throw new Error('Schedule entry not found');
  }

  return await prisma.tvSchedule.delete({
    where: { id },
  });
}

export async function listSchedules(channelId: string, tenantId: string): Promise<any[]> {
  return await prisma.tvSchedule.findMany({
    where: {
      tenantId,
      program: { channelId },
    },
    include: {
      program: true,
    },
    orderBy: { startTime: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * TV PLAYLIST SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createPlaylist(
  tenantId: string,
  channelId: string,
  data: {
    name: string;
    isAutoProgramming?: boolean;
    rotationRule?: string;
  }
): Promise<any> {
  if (data.isAutoProgramming) {
    // Disable any existing Auto Programming playlist for this channel
    await prisma.tvPlaylist.updateMany({
      where: { channelId, tenantId, isAutoProgramming: true },
      data: { isAutoProgramming: false },
    });
  }

  return await prisma.tvPlaylist.create({
    data: {
      tenantId,
      channelId,
      name: data.name,
      isAutoProgramming: data.isAutoProgramming || false,
      rotationRule: data.rotationRule || 'sequential',
    },
  });
}

export async function updatePlaylist(
  id: string,
  tenantId: string,
  data: {
    name?: string;
    isAutoProgramming?: boolean;
    rotationRule?: string;
  }
): Promise<any> {
  const playlist = await prisma.tvPlaylist.findFirst({
    where: { id, tenantId },
  });
  if (!playlist) {
    throw new Error('Playlist not found');
  }

  if (data.isAutoProgramming) {
    // Disable other Auto DJ playlists
    await prisma.tvPlaylist.updateMany({
      where: { channelId: playlist.channelId, tenantId, isAutoProgramming: true, NOT: { id } },
      data: { isAutoProgramming: false },
    });
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.isAutoProgramming !== undefined) updateData.isAutoProgramming = data.isAutoProgramming;
  if (data.rotationRule !== undefined) updateData.rotationRule = data.rotationRule;

  return await prisma.tvPlaylist.update({
    where: { id },
    data: updateData,
  });
}

export async function deletePlaylist(id: string, tenantId: string): Promise<any> {
  const playlist = await prisma.tvPlaylist.findFirst({
    where: { id, tenantId },
  });
  if (!playlist) {
    throw new Error('Playlist not found');
  }

  return await prisma.tvPlaylist.delete({
    where: { id },
  });
}

export async function listPlaylists(channelId: string, tenantId: string): Promise<any[]> {
  return await prisma.tvPlaylist.findMany({
    where: { channelId, tenantId },
    include: {
      items: {
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addPlaylistItem(
  playlistId: string,
  data: {
    mediaAssetId?: string;
    title: string;
    videoUrl: string;
    durationSeconds?: number;
    sortOrder?: number;
  }
): Promise<any> {
  let order = data.sortOrder;
  if (order === undefined) {
    const agg = await prisma.tvPlaylistItem.aggregate({
      where: { playlistId },
      _max: { sortOrder: true },
    });
    order = (agg._max.sortOrder || 0) + 1;
  }

  return await prisma.tvPlaylistItem.create({
    data: {
      playlistId,
      mediaAssetId: data.mediaAssetId || null,
      title: data.title,
      videoUrl: data.videoUrl,
      durationSeconds: data.durationSeconds || 180,
      sortOrder: order,
    },
  });
}

export async function removePlaylistItem(id: string): Promise<any> {
  return await prisma.tvPlaylistItem.delete({
    where: { id },
  });
}

export async function updatePlaylistItemSort(playlistId: string, itemIdsOrdered: string[]): Promise<void> {
  for (let i = 0; i < itemIdsOrdered.length; i++) {
    await prisma.tvPlaylistItem.updateMany({
      where: { id: itemIdsOrdered[i], playlistId },
      data: { sortOrder: i },
    });
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * CONTROL & BROADCAST STATES
 * ─────────────────────────────────────────────────────────────
 */

export async function goLive(id: string, tenantId: string): Promise<any> {
  return await updateChannel(id, tenantId, { status: 'live' });
}

export async function stopLive(id: string, tenantId: string): Promise<any> {
  const channel = await getChannel(id, tenantId);

  // Archive active live stream
  if (channel.streamUrl) {
    await prisma.tvBroadcastArchive.create({
      data: {
        tenantId,
        channelId: id,
        title: `Live Broadcast - ${new Date().toLocaleDateString()}`,
        videoUrl: channel.streamUrl,
        durationSeconds: 3600, // Dummy 1 hour
        recordedAt: new Date(),
      },
    });
  }

  return await updateChannel(id, tenantId, { status: 'offline' });
}

export async function listArchives(channelId: string, tenantId: string): Promise<any[]> {
  return await prisma.tvBroadcastArchive.findMany({
    where: { channelId, tenantId },
    orderBy: { recordedAt: 'desc' },
  });
}

export async function convertToMediaAsset(archiveId: string, tenantId: string): Promise<any> {
  const archive = await prisma.tvBroadcastArchive.findFirst({
    where: { id: archiveId, tenantId },
  });
  if (!archive) {
    throw new Error('Broadcast archive not found');
  }

  const asset = await prisma.mediaAsset.create({
    data: {
      tenantId,
      title: archive.title,
      description: 'Archived television broadcast.',
      type: 'video',
      providerType: 'platform_managed',
      providerKey: 's3',
      sourceUrl: archive.videoUrl,
      durationSeconds: archive.durationSeconds,
      visibility: 'public',
      status: 'published',
      publishedAt: new Date(),
    },
  });

  await prisma.tvBroadcastArchive.update({
    where: { id: archiveId },
    data: {
      isMediaAsset: true,
      mediaAssetId: asset.id,
    },
  });

  return asset;
}

/**
 * ─────────────────────────────────────────────────────────────
 * REAL-TIME COMMUNICATIONS (CHAT, REACTIONS, POLLS)
 * ─────────────────────────────────────────────────────────────
 */

export async function createChatMessage(
  tenantId: string,
  channelId: string,
  userId: string | null,
  displayName: string,
  message: string,
  countryCode?: string,
  userRole?: string
): Promise<any> {
  return await prisma.tvChatMessage.create({
    data: {
      tenantId,
      channelId,
      userId,
      displayName,
      message,
      countryCode: countryCode || null,
      userRole: userRole || 'guest',
    },
  });
}

export async function getChatMessages(channelId: string, tenantId: string): Promise<any[]> {
  return await prisma.tvChatMessage.findMany({
    where: { channelId, tenantId },
    orderBy: { createdAt: 'asc' },
    take: 100, // Return last 100 messages
  });
}

export async function addReaction(tenantId: string, channelId: string, reactionType: string): Promise<any> {
  return await prisma.tvReaction.create({
    data: {
      tenantId,
      channelId,
      reactionType,
    },
  });
}

export async function getReactions(channelId: string, tenantId: string): Promise<Record<string, number>> {
  const groups = await prisma.tvReaction.groupBy({
    by: ['reactionType'],
    where: { channelId, tenantId },
    _count: { id: true },
  });

  const tallies: Record<string, number> = {
    amen: 0,
    hallelujah: 0,
    fire: 0,
    praise_god: 0,
    love: 0,
    prayer_hands: 0,
  };

  for (const g of groups) {
    tallies[g.reactionType] = g._count.id;
  }

  return tallies;
}

export async function createPoll(
  tenantId: string,
  channelId: string,
  question: string,
  options: string[]
): Promise<any> {
  // Deactivate existing polls
  await prisma.tvPoll.updateMany({
    where: { channelId, tenantId, isActive: true },
    data: { isActive: false },
  });

  return await prisma.tvPoll.create({
    data: {
      tenantId,
      channelId,
      question,
      options: JSON.stringify(options),
      isActive: true,
    },
  });
}

export async function submitPollResponse(pollId: string, userId: string | null, option: string): Promise<any> {
  const poll = await prisma.tvPoll.findUnique({
    where: { id: pollId },
  });

  if (!poll || !poll.isActive) {
    throw new Error('Active poll not found');
  }

  return await prisma.tvPollResponse.create({
    data: {
      pollId,
      userId,
      option,
    },
  });
}

export async function getPolls(channelId: string, tenantId: string): Promise<any[]> {
  const polls = await prisma.tvPoll.findMany({
    where: { channelId, tenantId },
    include: {
      responses: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return polls.map((p) => {
    const options = JSON.parse(p.options) as string[];
    const tallies: Record<string, number> = {};
    for (const opt of options) {
      tallies[opt] = 0;
    }
    for (const resp of p.responses) {
      if (tallies[resp.option] !== undefined) {
        tallies[resp.option]++;
      }
    }
    return {
      id: p.id,
      question: p.question,
      options,
      isActive: p.isActive,
      createdAt: p.createdAt,
      results: tallies,
      totalVotes: p.responses.length,
    };
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * INTERACTIVE LOWER THIRDS / OVERLAY SCHEDULER
 * ─────────────────────────────────────────────────────────────
 */

export async function createLowerThird(
  tenantId: string,
  channelId: string,
  data: {
    type: string;
    title: string;
    subtitle?: string;
    buttonText?: string;
    actionUrl?: string;
    startTime: string | Date;
    endTime: string | Date;
    position?: string;
    audience?: string;
  }
): Promise<any> {
  return await prisma.tvLowerThird.create({
    data: {
      tenantId,
      channelId,
      type: data.type,
      title: data.title,
      subtitle: data.subtitle || null,
      buttonText: data.buttonText || null,
      actionUrl: data.actionUrl || null,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      position: data.position || 'bottom-left',
      audience: data.audience || 'all',
      isActive: true,
    },
  });
}

export async function updateLowerThird(
  id: string,
  tenantId: string,
  data: {
    type?: string;
    title?: string;
    subtitle?: string;
    buttonText?: string;
    actionUrl?: string;
    startTime?: string | Date;
    endTime?: string | Date;
    position?: string;
    audience?: string;
    isActive?: boolean;
  }
): Promise<any> {
  const overlay = await prisma.tvLowerThird.findFirst({
    where: { id, tenantId },
  });
  if (!overlay) {
    throw new Error('Lower third overlay not found');
  }

  const updateData: any = {};
  if (data.type !== undefined) updateData.type = data.type;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.subtitle !== undefined) updateData.subtitle = data.subtitle;
  if (data.buttonText !== undefined) updateData.buttonText = data.buttonText;
  if (data.actionUrl !== undefined) updateData.actionUrl = data.actionUrl;
  if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
  if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
  if (data.position !== undefined) updateData.position = data.position;
  if (data.audience !== undefined) updateData.audience = data.audience;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return await prisma.tvLowerThird.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteLowerThird(id: string, tenantId: string): Promise<any> {
  const overlay = await prisma.tvLowerThird.findFirst({
    where: { id, tenantId },
  });
  if (!overlay) {
    throw new Error('Lower third overlay not found');
  }

  return await prisma.tvLowerThird.delete({
    where: { id },
  });
}

export async function getLowerThirds(channelId: string, tenantId: string): Promise<any[]> {
  const now = new Date();
  return await prisma.tvLowerThird.findMany({
    where: {
      channelId,
      tenantId,
      isActive: true,
      startTime: { lte: now },
      endTime: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * NOW PLAYING PLAYHEAD & TAKEOVER ORCHESTRATION
 * ─────────────────────────────────────────────────────────────
 */

export async function getNowPlaying(channelId: string, tenantId: string): Promise<any> {
  const channel = await prisma.tvChannel.findFirst({
    where: { id: channelId, tenantId },
  });
  if (!channel) {
    throw new Error('Channel not found');
  }

  const now = new Date();
  const currentTimestampSec = Math.floor(now.getTime() / 1000);

  // 1. Live Manual Takeover
  if (channel.status === 'live') {
    return {
      status: 'live',
      name: channel.name,
      slogan: channel.slogan,
      logoUrl: channel.logoUrl,
      streamUrl: channel.streamUrl,
      currentProgram: {
        title: 'Live TV Broadcast',
        speaker: 'Broadcaster',
        category: 'Live',
      },
    };
  }

  // 2. Automated Event Takeover from meetings / livestreams modules
  // Rule A: Check if a Livestream starts or is live
  const activeLiveStream = await prisma.livestream.findFirst({
    where: { tenantId, status: 'live' },
  });
  if (activeLiveStream) {
    return {
      status: 'live',
      name: channel.name,
      slogan: channel.slogan,
      logoUrl: channel.logoUrl,
      streamUrl: activeLiveStream.rtmpIngestUrl || channel.streamUrl || 'https://assets.mixkit.co/videos/preview/mixkit-worship-team-singing-in-church-41793-large.mp4',
      currentProgram: {
        title: activeLiveStream.title,
        speaker: 'Live Service Stream',
        category: 'Sunday Service',
        description: activeLiveStream.description,
      },
    };
  }

  // Rule B: Check if an active LiveMeeting (e.g. Prayer meeting or Worship session) is active
  // If the channel slug contains "prayer" and there is a live prayer meeting
  // Or if the channel slug contains "worship" and there is a live worship meeting
  // Or if it is the main channel, take over anyway
  const activeMeeting = await prisma.liveMeeting.findFirst({
    where: { tenantId, status: 'live' },
  });
  if (activeMeeting) {
    const slugLower = channel.slug.toLowerCase();
    const titleLower = activeMeeting.title.toLowerCase();
    const descLower = (activeMeeting.description || '').toLowerCase();
    
    let shouldTakeover = false;
    if (slugLower.includes('prayer') && (titleLower.includes('prayer') || descLower.includes('prayer'))) {
      shouldTakeover = true;
    } else if (slugLower.includes('worship') && (titleLower.includes('worship') || descLower.includes('worship'))) {
      shouldTakeover = true;
    } else if (slugLower.includes('main') || slugLower === 'church-tv' || slugLower === 'main-church-tv') {
      shouldTakeover = true;
    }

    if (shouldTakeover) {
      return {
        status: 'live',
        name: channel.name,
        slogan: channel.slogan,
        logoUrl: channel.logoUrl,
        streamUrl: activeMeeting.meetingUrl || 'https://assets.mixkit.co/videos/preview/mixkit-worship-team-singing-in-church-41793-large.mp4',
        currentProgram: {
          title: activeMeeting.title,
          speaker: 'Interactive Group Broadcast',
          category: 'Live Meeting',
          description: activeMeeting.description,
        },
      };
    }
  }

  // 3. EPG / Scheduled Program Checks
  const schedules = await prisma.tvSchedule.findMany({
    where: {
      tenantId,
      program: { channelId },
    },
    include: {
      program: true,
    },
  });

  let activeSchedule = null;
  for (const s of schedules) {
    const start = new Date(s.startTime);
    const end = new Date(s.endTime);

    if (s.recurrence === 'none') {
      if (now >= start && now <= end) {
        activeSchedule = s;
        break;
      }
    } else {
      const nowMinOfDay = now.getHours() * 60 + now.getMinutes();
      const startMinOfDay = start.getHours() * 60 + start.getMinutes();
      const endMinOfDay = end.getHours() * 60 + end.getMinutes();

      let isTimeMatch = false;
      if (startMinOfDay <= endMinOfDay) {
        isTimeMatch = nowMinOfDay >= startMinOfDay && nowMinOfDay <= endMinOfDay;
      } else {
        isTimeMatch = nowMinOfDay >= startMinOfDay || nowMinOfDay <= endMinOfDay;
      }

      if (isTimeMatch) {
        if (s.recurrence === 'daily') {
          activeSchedule = s;
          break;
        } else if (s.recurrence === 'weekdays' && now.getDay() >= 1 && now.getDay() <= 5) {
          activeSchedule = s;
          break;
        } else if (s.recurrence === 'weekends' && (now.getDay() === 0 || now.getDay() === 6)) {
          activeSchedule = s;
          break;
        } else if (s.recurrence === 'weekly' && s.daysOfWeek) {
          const days = s.daysOfWeek.split(',').map(Number);
          if (days.includes(now.getDay())) {
            activeSchedule = s;
            break;
          }
        }
      }
    }
  }

  // 4. Automated Channel Programming (Modulo Playhead Matcher)
  let playlistTrack = null;
  let offsetSeconds = 0;
  let totalPlaylistDuration = 0;
  let nextTrack = null;

  if (channel.isAutoProgrammingEnabled) {
    const autoPlaylist = await prisma.tvPlaylist.findFirst({
      where: { channelId, tenantId, isAutoProgramming: true },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (autoPlaylist && autoPlaylist.items.length > 0) {
      const items = autoPlaylist.items;
      const normalizedItems = items.map((item) => ({
        ...item,
        duration: item.durationSeconds || 180,
      }));

      totalPlaylistDuration = normalizedItems.reduce((acc, curr) => acc + curr.duration, 0);

      if (totalPlaylistDuration > 0) {
        const playheadSec = currentTimestampSec % totalPlaylistDuration;
        let accumulatedSec = 0;

        for (let i = 0; i < normalizedItems.length; i++) {
          const item = normalizedItems[i];
          if (playheadSec >= accumulatedSec && playheadSec < accumulatedSec + item.duration) {
            playlistTrack = item;
            offsetSeconds = playheadSec - accumulatedSec;
            nextTrack = normalizedItems[(i + 1) % normalizedItems.length];
            break;
          }
          accumulatedSec += item.duration;
        }
      }
    }
  }

  // Build the EPG schedules for the EPG guide widget
  const daySchedules = schedules
    .filter((s) => {
      if (s.recurrence === 'daily') return true;
      if (s.recurrence === 'weekdays' && now.getDay() >= 1 && now.getDay() <= 5) return true;
      if (s.recurrence === 'weekends' && (now.getDay() === 0 || now.getDay() === 6)) return true;
      if (s.recurrence === 'weekly' && s.daysOfWeek) {
        return s.daysOfWeek.split(',').map(Number).includes(now.getDay());
      }
      // Single event schedules on this specific calendar date
      const sDateStr = new Date(s.startTime).toDateString();
      return sDateStr === now.toDateString();
    })
    .map((s) => ({
      id: s.id,
      title: s.program.title,
      speaker: s.program.speaker,
      category: s.program.category,
      startTime: s.startTime,
      endTime: s.endTime,
    }))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return {
    status: activeSchedule ? 'scheduled' : (playlistTrack ? 'automated' : 'offline'),
    name: channel.name,
    slogan: channel.slogan,
    logoUrl: channel.logoUrl,
    streamUrl: activeSchedule ? channel.streamUrl : (playlistTrack ? playlistTrack.videoUrl : channel.streamUrl),
    currentProgram: activeSchedule ? {
      title: activeSchedule.program.title,
      speaker: activeSchedule.program.speaker,
      category: activeSchedule.program.category,
      description: activeSchedule.program.description,
    } : (playlistTrack ? {
      title: playlistTrack.title,
      speaker: 'Auto DJ Program',
      category: 'Automated Playback',
      videoUrl: playlistTrack.videoUrl,
      offsetSeconds,
      durationSeconds: playlistTrack.duration,
    } : null),
    nextProgram: nextTrack ? {
      title: nextTrack.title,
      videoUrl: nextTrack.videoUrl,
      durationSeconds: nextTrack.duration,
    } : null,
    daySchedules,
  };
}
