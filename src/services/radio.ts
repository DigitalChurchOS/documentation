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
 * STATION CRUD SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createStation(
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
    isAutoDjEnabled?: boolean;
  }
): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.name);

  const existing = await prisma.radioStation.findFirst({
    where: { tenantId, slug },
  });
  if (existing) {
    throw new Error(`Radio station with slug '${slug}' already exists`);
  }

  const socialLinksStr = data.socialLinks ? JSON.stringify(data.socialLinks) : '[]';

  return await prisma.radioStation.create({
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
      isAutoDjEnabled: data.isAutoDjEnabled !== undefined ? data.isAutoDjEnabled : true,
      status: 'offline',
    },
  });
}

export async function updateStation(
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
    isAutoDjEnabled?: boolean;
  }
): Promise<any> {
  const station = await prisma.radioStation.findFirst({
    where: { id, tenantId },
  });
  if (!station) {
    throw new Error('Radio station not found');
  }

  let slug = station.slug;
  if (data.slug) {
    slug = slugify(data.slug);
    const existing = await prisma.radioStation.findFirst({
      where: { tenantId, slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Radio station with slug '${slug}' already exists`);
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
  if (data.isAutoDjEnabled !== undefined) updateData.isAutoDjEnabled = data.isAutoDjEnabled;

  return await prisma.radioStation.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteStation(id: string, tenantId: string): Promise<any> {
  const station = await prisma.radioStation.findFirst({
    where: { id, tenantId },
  });
  if (!station) {
    throw new Error('Radio station not found');
  }

  return await prisma.radioStation.delete({
    where: { id },
  });
}

export async function getStation(idOrSlug: string, tenantId: string): Promise<any> {
  const station = await prisma.radioStation.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });

  if (!station) {
    throw new Error('Radio station not found');
  }

  return station;
}

export async function listStations(tenantId: string): Promise<any[]> {
  return await prisma.radioStation.findMany({
    where: { tenantId },
    orderBy: { name: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * PROGRAM CRUD SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createProgram(
  tenantId: string,
  stationId: string,
  data: {
    title: string;
    slug?: string;
    description?: string;
    speaker?: string;
    category: string;
  }
): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.title);

  const existing = await prisma.radioProgram.findFirst({
    where: { tenantId, stationId, slug },
  });
  if (existing) {
    throw new Error(`Radio program with slug '${slug}' already exists on this station`);
  }

  return await prisma.radioProgram.create({
    data: {
      tenantId,
      stationId,
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
  const program = await prisma.radioProgram.findFirst({
    where: { id, tenantId },
  });
  if (!program) {
    throw new Error('Radio program not found');
  }

  let slug = program.slug;
  if (data.slug) {
    slug = slugify(data.slug);
    const existing = await prisma.radioProgram.findFirst({
      where: { tenantId, stationId: program.stationId, slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Radio program with slug '${slug}' already exists on this station`);
    }
  }

  const updateData: any = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.slug !== undefined) updateData.slug = slug;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.speaker !== undefined) updateData.speaker = data.speaker;
  if (data.category !== undefined) updateData.category = data.category;

  return await prisma.radioProgram.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteProgram(id: string, tenantId: string): Promise<any> {
  const program = await prisma.radioProgram.findFirst({
    where: { id, tenantId },
  });
  if (!program) {
    throw new Error('Radio program not found');
  }

  return await prisma.radioProgram.delete({
    where: { id },
  });
}

export async function listPrograms(stationId: string, tenantId: string): Promise<any[]> {
  return await prisma.radioProgram.findMany({
    where: { stationId, tenantId },
    orderBy: { title: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * SCHEDULE CRUD SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createSchedule(
  tenantId: string,
  programId: string,
  data: {
    startTime: Date | string;
    endTime: Date | string;
    recurrence?: string;
    daysOfWeek?: string;
  }
): Promise<any> {
  return await prisma.radioSchedule.create({
    data: {
      tenantId,
      programId,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
      recurrence: data.recurrence || 'none',
      daysOfWeek: data.daysOfWeek || null,
    },
    include: {
      program: true,
    },
  });
}

export async function updateSchedule(
  id: string,
  tenantId: string,
  data: {
    startTime?: Date | string;
    endTime?: Date | string;
    recurrence?: string;
    daysOfWeek?: string;
  }
): Promise<any> {
  const schedule = await prisma.radioSchedule.findFirst({
    where: { id, tenantId },
  });
  if (!schedule) {
    throw new Error('Schedule entry not found');
  }

  const updateData: any = {};
  if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
  if (data.endTime !== undefined) updateData.endTime = new Date(data.endTime);
  if (data.recurrence !== undefined) updateData.recurrence = data.recurrence;
  if (data.daysOfWeek !== undefined) updateData.daysOfWeek = data.daysOfWeek;

  return await prisma.radioSchedule.update({
    where: { id },
    data: updateData,
    include: {
      program: true,
    },
  });
}

export async function deleteSchedule(id: string, tenantId: string): Promise<any> {
  const schedule = await prisma.radioSchedule.findFirst({
    where: { id, tenantId },
  });
  if (!schedule) {
    throw new Error('Schedule entry not found');
  }

  return await prisma.radioSchedule.delete({
    where: { id },
  });
}

export async function listSchedules(stationId: string, tenantId: string): Promise<any[]> {
  return await prisma.radioSchedule.findMany({
    where: {
      tenantId,
      program: { stationId },
    },
    include: {
      program: true,
    },
    orderBy: { startTime: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * PLAYLIST CRUD SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createPlaylist(
  tenantId: string,
  stationId: string,
  data: {
    name: string;
    isAutoDj?: boolean;
    rotationRule?: string;
  }
): Promise<any> {
  return await prisma.radioPlaylist.create({
    data: {
      tenantId,
      stationId,
      name: data.name,
      isAutoDj: data.isAutoDj !== undefined ? data.isAutoDj : false,
      rotationRule: data.rotationRule || 'random',
    },
  });
}

export async function updatePlaylist(
  id: string,
  tenantId: string,
  data: {
    name?: string;
    isAutoDj?: boolean;
    rotationRule?: string;
  }
): Promise<any> {
  const playlist = await prisma.radioPlaylist.findFirst({
    where: { id, tenantId },
  });
  if (!playlist) {
    throw new Error('Radio playlist not found');
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.isAutoDj !== undefined) updateData.isAutoDj = data.isAutoDj;
  if (data.rotationRule !== undefined) updateData.rotationRule = data.rotationRule;

  return await prisma.radioPlaylist.update({
    where: { id },
    data: updateData,
  });
}

export async function deletePlaylist(id: string, tenantId: string): Promise<any> {
  const playlist = await prisma.radioPlaylist.findFirst({
    where: { id, tenantId },
  });
  if (!playlist) {
    throw new Error('Radio playlist not found');
  }

  return await prisma.radioPlaylist.delete({
    where: { id },
  });
}

export async function listPlaylists(stationId: string, tenantId: string): Promise<any[]> {
  return await prisma.radioPlaylist.findMany({
    where: { stationId, tenantId },
    include: {
      items: true,
    },
    orderBy: { name: 'asc' },
  });
}

export async function addPlaylistItem(
  playlistId: string,
  data: {
    mediaAssetId?: string;
    podcastEpisodeId?: string;
    title: string;
    audioUrl: string;
    durationSeconds?: number;
    sortOrder?: number;
  }
): Promise<any> {
  return await prisma.radioPlaylistItem.create({
    data: {
      playlistId,
      mediaAssetId: data.mediaAssetId || null,
      podcastEpisodeId: data.podcastEpisodeId || null,
      title: data.title,
      audioUrl: data.audioUrl,
      durationSeconds: data.durationSeconds || null,
      sortOrder: data.sortOrder || 0,
    },
  });
}

export async function removePlaylistItem(id: string): Promise<any> {
  return await prisma.radioPlaylistItem.delete({
    where: { id },
  });
}

export async function updatePlaylistItemSort(playlistId: string, itemIdsOrdered: string[]): Promise<void> {
  for (let i = 0; i < itemIdsOrdered.length; i++) {
    await prisma.radioPlaylistItem.updateMany({
      where: { id: itemIdsOrdered[i], playlistId },
      data: { sortOrder: i },
    });
  }
}

/**
 * ─────────────────────────────────────────────────────────────
 * NOW PLAYING & AUTO DJ LOGIC
 * ─────────────────────────────────────────────────────────────
 */

export async function getNowPlaying(stationId: string, tenantId: string): Promise<any> {
  const station = await prisma.radioStation.findFirst({
    where: { id: stationId, tenantId },
  });
  if (!station) {
    throw new Error('Station not found');
  }

  const now = new Date();
  const currentTimestampSec = Math.floor(now.getTime() / 1000);

  if (station.status === 'live') {
    return {
      status: 'live',
      name: station.name,
      slogan: station.slogan,
      logoUrl: station.logoUrl,
      streamUrl: station.streamUrl,
      currentProgram: {
        title: 'Live Radio Broadcast',
        speaker: 'Live Broadcaster',
        category: 'Live',
      },
    };
  }

  const schedules = await prisma.radioSchedule.findMany({
    where: {
      tenantId,
      program: { stationId },
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

  let playlistTrack = null;
  let offsetSeconds = 0;
  let totalPlaylistDuration = 0;
  let nextTrack = null;

  if (station.isAutoDjEnabled) {
    const autoDjPlaylist = await prisma.radioPlaylist.findFirst({
      where: { stationId, tenantId, isAutoDj: true },
      include: {
        items: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (autoDjPlaylist && autoDjPlaylist.items.length > 0) {
      const items = autoDjPlaylist.items;
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

  return {
    status: activeSchedule ? 'scheduled' : (playlistTrack ? 'automated' : 'offline'),
    name: station.name,
    slogan: station.slogan,
    logoUrl: station.logoUrl,
    streamUrl: station.streamUrl,
    currentProgram: activeSchedule ? {
      title: activeSchedule.program.title,
      speaker: activeSchedule.program.speaker,
      category: activeSchedule.program.category,
      description: activeSchedule.program.description,
    } : (playlistTrack ? {
      title: 'Continuous Worship & Word',
      speaker: 'Auto DJ rotation',
      category: 'Automated Broadcast',
    } : {
      title: 'Station Offline',
      speaker: null,
      category: 'Offline',
    }),
    nowPlayingTrack: playlistTrack ? {
      title: playlistTrack.title,
      audioUrl: playlistTrack.audioUrl,
      durationSeconds: playlistTrack.durationSeconds || 180,
      offsetSeconds,
    } : null,
    nextTrack: nextTrack ? {
      title: nextTrack.title,
    } : null,
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * BROADCASTING STUDIO
 * ─────────────────────────────────────────────────────────────
 */

export async function goLive(
  stationId: string,
  tenantId: string
): Promise<any> {
  const station = await prisma.radioStation.findFirst({
    where: { id: stationId, tenantId },
  });
  if (!station) {
    throw new Error('Radio station not found');
  }

  const generatedStreamKey = `live_${station.slug}_${Math.floor(100000 + Math.random() * 900000)}`;

  return await prisma.radioStation.update({
    where: { id: stationId },
    data: {
      status: 'live',
      streamKey: generatedStreamKey,
      streamUrl: station.streamUrl || `https://stream.churchos.io/radio/${stationId}/live.mp3`,
    },
  });
}

export async function stopLive(
  stationId: string,
  tenantId: string
): Promise<any> {
  const station = await prisma.radioStation.findFirst({
    where: { id: stationId, tenantId },
  });
  if (!station) {
    throw new Error('Radio station not found');
  }

  const duration = Math.floor(1800 + Math.random() * 3600);
  await prisma.radioBroadcastArchive.create({
    data: {
      tenantId,
      stationId,
      title: `Live Broadcast - ${new Date().toLocaleDateString()}`,
      audioUrl: `https://assets.churched.online/recordings/radio-live-${Date.now()}.mp3`,
      durationSeconds: duration,
      fileSize: duration * 16000,
    },
  });

  return await prisma.radioStation.update({
    where: { id: stationId },
    data: {
      status: 'offline',
    },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * CHAT & ENGAGEMENT
 * ─────────────────────────────────────────────────────────────
 */

export async function createChatMessage(
  tenantId: string,
  stationId: string,
  userId: string | null,
  displayName: string,
  message: string
): Promise<any> {
  return await prisma.radioChatMessage.create({
    data: {
      tenantId,
      stationId,
      userId,
      displayName,
      message,
    },
  });
}

export async function getChatMessages(
  stationId: string,
  tenantId: string,
  limit = 40
): Promise<any[]> {
  return await prisma.radioChatMessage.findMany({
    where: { stationId, tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function addReaction(
  tenantId: string,
  stationId: string,
  reactionType: string
): Promise<any> {
  const valid = ['amen', 'hallelujah', 'praise', 'fire', 'prayer'];
  if (!valid.includes(reactionType.toLowerCase())) {
    throw new Error('Invalid reaction type');
  }

  return await prisma.radioReaction.create({
    data: {
      tenantId,
      stationId,
      reactionType: reactionType.toLowerCase(),
    },
  });
}

export async function getReactions(
  stationId: string,
  tenantId: string
): Promise<Record<string, number>> {
  const reactions = await prisma.radioReaction.findMany({
    where: { stationId, tenantId },
  });

  const counts: Record<string, number> = {
    amen: 0,
    hallelujah: 0,
    praise: 0,
    fire: 0,
    prayer: 0,
  };

  for (const r of reactions) {
    if (counts[r.reactionType] !== undefined) {
      counts[r.reactionType]++;
    }
  }

  return counts;
}

/**
 * ─────────────────────────────────────────────────────────────
 * ARCHIVES & PODCAST INTEGRATION
 * ─────────────────────────────────────────────────────────────
 */

export async function listArchives(stationId: string, tenantId: string): Promise<any[]> {
  return await prisma.radioBroadcastArchive.findMany({
    where: { stationId, tenantId },
    orderBy: { recordedAt: 'desc' },
  });
}

export async function convertToPodcast(
  archiveId: string,
  tenantId: string,
  showId: string
): Promise<any> {
  const archive = await prisma.radioBroadcastArchive.findFirst({
    where: { id: archiveId, tenantId },
  });
  if (!archive) {
    throw new Error('Archive record not found');
  }

  if (archive.isPodcastEpisode) {
    throw new Error('This archive has already been converted to a podcast episode');
  }

  const show = await prisma.podcastShow.findUnique({
    where: { id: showId },
  });
  if (!show) {
    throw new Error('Target podcast show not found');
  }

  const slug = slugify(archive.title);

  const episode = await prisma.podcastEpisode.create({
    data: {
      tenantId,
      showId,
      title: archive.title,
      slug,
      audioUrl: archive.audioUrl,
      durationSeconds: archive.durationSeconds,
      fileSize: archive.fileSize,
      publishDate: new Date(),
      status: 'published',
    },
  });

  await prisma.radioBroadcastArchive.update({
    where: { id: archiveId },
    data: {
      isPodcastEpisode: true,
      podcastEpisodeId: episode.id,
    },
  });

  return episode;
}