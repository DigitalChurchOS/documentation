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

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function formatCdata(text: string | null | undefined): string {
  if (!text) return '';
  // Remove any nested CDATA closing sequences just in case
  const cleanText = text.replace(/\]\]>/g, ']]&gt;');
  return `<![CDATA[${cleanText}]]>`;
}

/**
 * ─────────────────────────────────────────────────────────────
 * SHOW CRUD SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createShow(
  tenantId: string,
  data: {
    title: string;
    slug?: string;
    description?: string;
    author: string;
    email?: string;
    coverImageUrl?: string;
    category: string;
    subcategory?: string;
    language?: string;
    link?: string;
    copyright?: string;
    explicit?: boolean;
    status?: string;
  }
): Promise<any> {
  const slug = data.slug ? slugify(data.slug) : slugify(data.title);

  // Check if show with this slug already exists for the tenant
  const existing = await prisma.podcastShow.findFirst({
    where: { tenantId, slug },
  });
  if (existing) {
    throw new Error(`Podcast show with slug '${slug}' already exists`);
  }

  return await prisma.podcastShow.create({
    data: {
      tenantId,
      title: data.title,
      slug,
      description: data.description || null,
      author: data.author,
      email: data.email || null,
      coverImageUrl: data.coverImageUrl || null,
      category: data.category,
      subcategory: data.subcategory || null,
      language: data.language || 'en',
      link: data.link || null,
      copyright: data.copyright || null,
      explicit: data.explicit !== undefined ? data.explicit : false,
      status: data.status || 'draft',
    },
  });
}

export async function updateShow(
  id: string,
  tenantId: string,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    author?: string;
    email?: string;
    coverImageUrl?: string;
    category?: string;
    subcategory?: string;
    language?: string;
    link?: string;
    copyright?: string;
    explicit?: boolean;
    status?: string;
  }
): Promise<any> {
  const show = await prisma.podcastShow.findFirst({
    where: { id, tenantId },
  });
  if (!show) {
    throw new Error('Podcast show not found');
  }

  let slug = show.slug;
  if (data.slug) {
    slug = slugify(data.slug);
    const existing = await prisma.podcastShow.findFirst({
      where: { tenantId, slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Podcast show with slug '${slug}' already exists`);
    }
  }

  return await prisma.podcastShow.update({
    where: { id },
    data: {
      title: data.title !== undefined ? data.title : show.title,
      slug,
      description: data.description !== undefined ? data.description : show.description,
      author: data.author !== undefined ? data.author : show.author,
      email: data.email !== undefined ? data.email : show.email,
      coverImageUrl: data.coverImageUrl !== undefined ? data.coverImageUrl : show.coverImageUrl,
      category: data.category !== undefined ? data.category : show.category,
      subcategory: data.subcategory !== undefined ? data.subcategory : show.subcategory,
      language: data.language !== undefined ? data.language : show.language,
      link: data.link !== undefined ? data.link : show.link,
      copyright: data.copyright !== undefined ? data.copyright : show.copyright,
      explicit: data.explicit !== undefined ? data.explicit : show.explicit,
      status: data.status !== undefined ? data.status : show.status,
    },
  });
}

export async function deleteShow(id: string, tenantId: string): Promise<any> {
  const show = await prisma.podcastShow.findFirst({
    where: { id, tenantId },
  });
  if (!show) {
    throw new Error('Podcast show not found');
  }

  // Soft delete by archiving
  return await prisma.podcastShow.update({
    where: { id },
    data: { status: 'archived' },
  });
}

export async function getShow(idOrSlug: string, tenantId: string): Promise<any> {
  const show = await prisma.podcastShow.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      episodes: {
        orderBy: { publishDate: 'desc' },
      },
    },
  });

  if (!show) {
    throw new Error('Podcast show not found');
  }

  return show;
}

export async function listShows(
  tenantId: string,
  filters: {
    status?: string;
    search?: string;
  } = {}
): Promise<any[]> {
  const whereClause: any = {
    tenantId,
  };

  if (filters.status) {
    whereClause.status = filters.status;
  } else {
    whereClause.status = 'published'; // Default to published for members/public
  }

  if (filters.search) {
    whereClause.OR = [
      { title: { contains: filters.search } },
      { description: { contains: filters.search } },
    ];
  }

  return await prisma.podcastShow.findMany({
    where: whereClause,
    orderBy: { title: 'asc' },
  });
}

/**
 * ─────────────────────────────────────────────────────────────
 * EPISODE CRUD SERVICES
 * ─────────────────────────────────────────────────────────────
 */

export async function createEpisode(
  tenantId: string,
  data: {
    showId: string;
    title: string;
    slug?: string;
    description?: string;
    audioUrl: string;
    durationSeconds?: number;
    fileSize?: number;
    mimeType?: string;
    publishDate?: Date | string;
    status?: string;
    season?: number;
    episodeNumber?: number;
    episodeType?: string;
    explicit?: boolean;
  }
): Promise<any> {
  const show = await prisma.podcastShow.findFirst({
    where: { id: data.showId, tenantId },
  });
  if (!show) {
    throw new Error('Podcast show not found');
  }

  const slug = data.slug ? slugify(data.slug) : slugify(data.title);

  // Check if episode with this slug already exists for the show
  const existing = await prisma.podcastEpisode.findFirst({
    where: { tenantId, showId: data.showId, slug },
  });
  if (existing) {
    throw new Error(`Podcast episode with slug '${slug}' already exists for this show`);
  }

  return await prisma.podcastEpisode.create({
    data: {
      tenantId,
      showId: data.showId,
      title: data.title,
      slug,
      description: data.description || null,
      audioUrl: data.audioUrl,
      durationSeconds: data.durationSeconds || null,
      fileSize: data.fileSize || null,
      mimeType: data.mimeType || 'audio/mpeg',
      publishDate: data.publishDate ? new Date(data.publishDate) : new Date(),
      status: data.status || 'draft',
      season: data.season || null,
      episodeNumber: data.episodeNumber || null,
      episodeType: data.episodeType || 'full',
      explicit: data.explicit !== undefined ? data.explicit : false,
    },
  });
}

export async function updateEpisode(
  id: string,
  tenantId: string,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    audioUrl?: string;
    durationSeconds?: number;
    fileSize?: number;
    mimeType?: string;
    publishDate?: Date | string;
    status?: string;
    season?: number;
    episodeNumber?: number;
    episodeType?: string;
    explicit?: boolean;
  }
): Promise<any> {
  const episode = await prisma.podcastEpisode.findFirst({
    where: { id, tenantId },
  });
  if (!episode) {
    throw new Error('Podcast episode not found');
  }

  let slug = episode.slug;
  if (data.slug) {
    slug = slugify(data.slug);
    const existing = await prisma.podcastEpisode.findFirst({
      where: { tenantId, showId: episode.showId, slug, NOT: { id } },
    });
    if (existing) {
      throw new Error(`Podcast episode with slug '${slug}' already exists for this show`);
    }
  }

  return await prisma.podcastEpisode.update({
    where: { id },
    data: {
      title: data.title !== undefined ? data.title : episode.title,
      slug,
      description: data.description !== undefined ? data.description : episode.description,
      audioUrl: data.audioUrl !== undefined ? data.audioUrl : episode.audioUrl,
      durationSeconds: data.durationSeconds !== undefined ? data.durationSeconds : episode.durationSeconds,
      fileSize: data.fileSize !== undefined ? data.fileSize : episode.fileSize,
      mimeType: data.mimeType !== undefined ? data.mimeType : episode.mimeType,
      publishDate: data.publishDate !== undefined ? new Date(data.publishDate) : episode.publishDate,
      status: data.status !== undefined ? data.status : episode.status,
      season: data.season !== undefined ? data.season : episode.season,
      episodeNumber: data.episodeNumber !== undefined ? data.episodeNumber : episode.episodeNumber,
      episodeType: data.episodeType !== undefined ? data.episodeType : episode.episodeType,
      explicit: data.explicit !== undefined ? data.explicit : episode.explicit,
    },
  });
}

export async function deleteEpisode(id: string, tenantId: string): Promise<any> {
  const episode = await prisma.podcastEpisode.findFirst({
    where: { id, tenantId },
  });
  if (!episode) {
    throw new Error('Podcast episode not found');
  }

  // Soft delete by archiving
  return await prisma.podcastEpisode.update({
    where: { id },
    data: { status: 'archived' },
  });
}

export async function getEpisode(idOrSlug: string, tenantId: string): Promise<any> {
  const episode = await prisma.podcastEpisode.findFirst({
    where: {
      tenantId,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      show: true,
    },
  });

  if (!episode) {
    throw new Error('Podcast episode not found');
  }

  return episode;
}

export async function listEpisodes(
  showId: string,
  tenantId: string,
  filters: {
    status?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ episodes: any[]; total: number; page: number; limit: number }> {
  const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
  const limit = filters.limit ? Math.max(1, Number(filters.limit)) : 10;
  const skip = (page - 1) * limit;

  const whereClause: any = {
    showId,
    tenantId,
  };

  if (filters.status) {
    whereClause.status = filters.status;
  } else {
    whereClause.status = 'published';
  }

  const [episodes, total] = await Promise.all([
    prisma.podcastEpisode.findMany({
      where: whereClause,
      orderBy: { publishDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.podcastEpisode.count({ where: whereClause }),
  ]);

  return {
    episodes,
    total,
    page,
    limit,
  };
}

/**
 * ─────────────────────────────────────────────────────────────
 * RSS XML FEED GENERATOR
 * ─────────────────────────────────────────────────────────────
 */

export async function generateRssFeed(showSlug: string, tenantId: string): Promise<string> {
  const show = await prisma.podcastShow.findFirst({
    where: { slug: showSlug, tenantId, status: 'published' },
    include: {
      episodes: {
        where: { status: 'published' },
        orderBy: { publishDate: 'desc' },
      },
    },
  });

  if (!show) {
    throw new Error('Podcast show not found or not published');
  }

  const siteLink = show.link || `https://churchos.io/podcasts/${show.slug}`;
  const feedLink = `https://churchos.io/api/podcast/feeds/${tenantId}/${show.slug}`;

  // Start constructing the RSS feed
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <atom:link href="${escapeXml(feedLink)}" rel="self" type="application/rss+xml" />
    <title>${formatCdata(show.title)}</title>
    <description>${formatCdata(show.description || show.title)}</description>
    <link>${escapeXml(siteLink)}</link>
    <language>${escapeXml(show.language)}</language>
    <copyright>${formatCdata(show.copyright || `${new Date().getFullYear()} ${show.author}`)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <itunes:author>${escapeXml(show.author)}</itunes:author>
    <itunes:summary>${escapeXml(show.description || show.title)}</itunes:summary>
    <itunes:explicit>${show.explicit ? 'yes' : 'no'}</itunes:explicit>
`;

  // Owner element
  if (show.email) {
    xml += `    <itunes:owner>
      <itunes:name>${escapeXml(show.author)}</itunes:name>
      <itunes:email>${escapeXml(show.email)}</itunes:email>
    </itunes:owner>\n`;
  } else {
    xml += `    <itunes:owner>
      <itunes:name>${escapeXml(show.author)}</itunes:name>
    </itunes:owner>\n`;
  }

  // Cover image
  if (show.coverImageUrl) {
    xml += `    <itunes:image href="${escapeXml(show.coverImageUrl)}" />\n`;
  }

  // Category
  xml += `    <itunes:category text="${escapeXml(show.category)}">`;
  if (show.subcategory) {
    xml += `\n      <itunes:category text="${escapeXml(show.subcategory)}" />\n    `;
  }
  xml += `</itunes:category>\n`;

  // Episodes (Items)
  for (const episode of show.episodes) {
    const guid = episode.id;
    const pubDate = new Date(episode.publishDate).toUTCString();

    xml += `    <item>
      <title>${formatCdata(episode.title)}</title>
      <description>${formatCdata(episode.description || episode.title)}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${escapeXml(guid)}</guid>
      <enclosure url="${escapeXml(episode.audioUrl)}" length="${episode.fileSize || 0}" type="${escapeXml(episode.mimeType)}" />
      <itunes:explicit>${episode.explicit ? 'yes' : 'no'}</itunes:explicit>
      <itunes:episodeType>${escapeXml(episode.episodeType)}</itunes:episodeType>
`;

    if (episode.durationSeconds !== null && episode.durationSeconds !== undefined) {
      xml += `      <itunes:duration>${episode.durationSeconds}</itunes:duration>\n`;
    }

    if (episode.season !== null && episode.season !== undefined) {
      xml += `      <itunes:season>${episode.season}</itunes:season>\n`;
    }

    if (episode.episodeNumber !== null && episode.episodeNumber !== undefined) {
      xml += `      <itunes:episode>${episode.episodeNumber}</itunes:episode>\n`;
    }

    xml += `    </item>\n`;
  }

  xml += `  </channel>
</rss>`;

  return xml;
}
