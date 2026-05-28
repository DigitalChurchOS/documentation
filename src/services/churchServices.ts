import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// SERVICE CRUD
// ─────────────────────────────────────────────────────────────
interface CreateServiceInput {
  title: string;
  serviceType: string;
  serviceDate: string;
  description?: string;
  notes?: string;
  thumbnailUrl?: string;
  speakerId?: string;
  sermonMediaId?: string;
  serviceAudioId?: string;
  livestreamId?: string;
  attendanceCount?: number;
  givingTotal?: number;
  salvationCount?: number;
  status?: string;
}

export async function createService(tenantId: string, data: CreateServiceInput) {
  return prisma.churchService.create({
    data: {
      tenantId,
      title: data.title,
      serviceType: data.serviceType,
      serviceDate: new Date(data.serviceDate),
      description: data.description,
      notes: data.notes,
      thumbnailUrl: data.thumbnailUrl,
      speakerId: data.speakerId,
      sermonMediaId: data.sermonMediaId,
      serviceAudioId: data.serviceAudioId,
      livestreamId: data.livestreamId,
      attendanceCount: data.attendanceCount,
      givingTotal: data.givingTotal,
      salvationCount: data.salvationCount,
      status: data.status || 'draft',
    },
    include: {
      speaker: true,
      sermonMedia: true,
      serviceAudio: true,
      livestream: true,
    },
  });
}

export async function getService(id: string, tenantId: string) {
  return prisma.churchService.findFirst({
    where: { id, tenantId },
    include: {
      speaker: true,
      sermonMedia: true,
      serviceAudio: true,
      livestream: true,
      scriptures: { orderBy: { order: 'asc' } },
      attachments: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function updateService(
  id: string,
  tenantId: string,
  data: Partial<CreateServiceInput>
) {
  const existing = await prisma.churchService.findFirst({ where: { id, tenantId } });
  if (!existing) throw new Error('Service not found');

  return prisma.churchService.update({
    where: { id },
    data: {
      ...data,
      serviceDate: data.serviceDate ? new Date(data.serviceDate) : undefined,
    },
    include: {
      speaker: true,
      sermonMedia: true,
      serviceAudio: true,
      livestream: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// LIST / FILTER / SORT
// ─────────────────────────────────────────────────────────────
interface ServiceFilters {
  serviceType?: string;
  speakerId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export async function listServices(tenantId: string, filters: ServiceFilters = {}) {
  const {
    serviceType, speakerId, dateFrom, dateTo, status, search,
    sortOrder = 'desc', page = 1, pageSize = 20,
  } = filters;

  const where: any = { tenantId };

  if (serviceType) where.serviceType = serviceType;
  if (speakerId) where.speakerId = speakerId;
  if (status) where.status = status;
  if (search) where.title = { contains: search };

  // Date range filter
  if (dateFrom || dateTo) {
    where.serviceDate = {};
    if (dateFrom) where.serviceDate.gte = new Date(dateFrom);
    if (dateTo) where.serviceDate.lte = new Date(dateTo);
  }

  const [services, total] = await Promise.all([
    prisma.churchService.findMany({
      where,
      include: {
        speaker: true,
        sermonMedia: true,
        livestream: true,
      },
      orderBy: { serviceDate: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.churchService.count({ where }),
  ]);

  return { services, total, page, pageSize };
}

// ─────────────────────────────────────────────────────────────
// RECURRING SCHEDULES
// ─────────────────────────────────────────────────────────────
interface RecurringPattern {
  serviceType: string;
  titleTemplate: string; // e.g. "Sunday Morning Service"
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startDate: string;
  count: number; // how many services to generate
  speakerId?: string;
}

export async function generateRecurringServices(
  tenantId: string,
  pattern: RecurringPattern
) {
  const services = [];
  const startDate = new Date(pattern.startDate);

  // Find the first occurrence of the target day of week
  const currentDay = startDate.getDay();
  let daysUntilTarget = pattern.dayOfWeek - currentDay;
  if (daysUntilTarget < 0) daysUntilTarget += 7;

  const firstDate = new Date(startDate);
  firstDate.setDate(firstDate.getDate() + daysUntilTarget);

  for (let i = 0; i < pattern.count; i++) {
    const serviceDate = new Date(firstDate);
    serviceDate.setDate(serviceDate.getDate() + i * 7);

    const dateStr = serviceDate.toISOString().split('T')[0];

    services.push({
      tenantId,
      title: `${pattern.titleTemplate} - ${dateStr}`,
      serviceType: pattern.serviceType,
      serviceDate,
      speakerId: pattern.speakerId,
      status: 'draft',
    });
  }

  // Create all services in batch
  const created = [];
  for (const svc of services) {
    const record = await prisma.churchService.create({ data: svc });
    created.push(record);
  }

  return created;
}

// ─────────────────────────────────────────────────────────────
// SCRIPTURE REFERENCES
// ─────────────────────────────────────────────────────────────
export async function addScriptures(
  serviceId: string,
  references: Array<{ reference: string; order?: number }>
) {
  const data = references.map((ref, idx) => ({
    serviceId,
    reference: ref.reference,
    order: ref.order ?? idx,
  }));

  const created = [];
  for (const item of data) {
    const record = await prisma.serviceScripture.create({ data: item });
    created.push(record);
  }
  return created;
}

export async function getScriptures(serviceId: string) {
  return prisma.serviceScripture.findMany({
    where: { serviceId },
    orderBy: { order: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// ATTACHMENTS
// ─────────────────────────────────────────────────────────────
interface AttachmentInput {
  title: string;
  fileUrl: string;
  fileType?: string;
}

export async function addAttachment(serviceId: string, data: AttachmentInput) {
  return prisma.serviceAttachment.create({
    data: { serviceId, ...data },
  });
}

export async function getAttachments(serviceId: string) {
  return prisma.serviceAttachment.findMany({
    where: { serviceId },
    orderBy: { createdAt: 'desc' },
  });
}
