import prisma from '../lib/prisma';
import { trackEvent } from './analytics';

const MEMBER_MODULE_KEY = 'members';

const DEFAULT_MEMBER_SETTINGS = {
  enabled: true,
  memberPortalEnabled: true,
  allowPublicRegistration: true,
  memberOnlyContent: true,
  showGivingHistory: true,
  showAttendanceHistory: true,
  showCourseProgress: true,
  showGroupMemberships: true,
  showEventRegistrations: true,
  requireEmailVerification: false,
  duplicateCheck: true,
  followUpDays: 3,
};

function safeJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeEmail(email?: string | null): string | null {
  const value = email?.trim().toLowerCase();
  return value || null;
}

function emailVariants(email?: string | null): string[] {
  const raw = email?.trim();
  const normalized = normalizeEmail(email);
  return Array.from(new Set([raw, normalized].filter(Boolean) as string[]));
}

function normalizeStatus(status?: string): string | undefined {
  const clean = status?.trim().toLowerCase();
  if (!clean) return undefined;
  return clean;
}

function normalizeDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (!value) return null;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function birthDateForAge(age: number): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - age);
  return date;
}

function buildMemberWhere(tenantId: string, options: any): any {
  const whereClause: any = { tenantId };

  if (options.status) whereClause.membershipStatus = normalizeStatus(options.status);
  if (options.gender) whereClause.gender = String(options.gender).trim().toLowerCase();
  if (options.branchId) whereClause.branchId = String(options.branchId);
  if (options.familyId) whereClause.familyId = String(options.familyId);

  if (options.hasEmail !== undefined) {
    const hasEmail = String(options.hasEmail) === 'true' || options.hasEmail === true;
    whereClause.email = hasEmail ? { not: null } : null;
  }

  if (options.tagName) {
    whereClause.tagAssignments = {
      some: {
        tag: {
          name: String(options.tagName).toLowerCase().trim(),
        },
      },
    };
  }

  if (options.joinedAfter || options.joinedBefore) {
    whereClause.createdAt = {};
    if (options.joinedAfter) whereClause.createdAt.gte = new Date(String(options.joinedAfter));
    if (options.joinedBefore) whereClause.createdAt.lte = new Date(String(options.joinedBefore));
  }

  if (options.ageMin || options.ageMax) {
    whereClause.birthday = {};
    if (options.ageMin) whereClause.birthday.lte = birthDateForAge(Number(options.ageMin));
    if (options.ageMax) whereClause.birthday.gte = birthDateForAge(Number(options.ageMax) + 1);
  }

  if (options.search) {
    const searchClean = String(options.search).toLowerCase().trim();
    whereClause.OR = [
      { firstName: { contains: searchClean } },
      { lastName: { contains: searchClean } },
      { phone: { contains: searchClean } },
      { email: { contains: searchClean } },
      { address: { contains: searchClean } },
    ];
  }

  return whereClause;
}

async function recordMemberEvent(
  tenantId: string,
  name: string,
  payload: {
    memberId?: string | null;
    userId?: string | null;
    value?: number | null;
    metadata?: any;
  } = {}
): Promise<void> {
  try {
    await trackEvent(tenantId, {
      category: 'member',
      name,
      entityId: payload.memberId || null,
      value: payload.value ?? null,
      userId: payload.userId || null,
      metadata: payload.metadata || {},
    });
  } catch (err) {
    console.warn('Member analytics event failed:', err);
  }
}

export async function searchMembers(
  tenantId: string,
  options: {
    search?: string;
    status?: string;
    tagName?: string;
    gender?: string;
    branchId?: string;
    familyId?: string;
    ageMin?: number;
    ageMax?: number;
    hasEmail?: boolean;
    joinedAfter?: string;
    joinedBefore?: string;
    sortBy?: string;
    sortDir?: string;
    page?: number;
    limit?: number;
  }
): Promise<{ data: any[]; count: number }> {
  const page = Math.max(Number(options.page) || 1, 1);
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 200);
  const skip = (page - 1) * limit;
  const whereClause = buildMemberWhere(tenantId, options);

  const sortBy = ['firstName', 'lastName', 'createdAt', 'updatedAt', 'membershipStatus'].includes(String(options.sortBy))
    ? String(options.sortBy)
    : 'lastName';
  const sortDir = options.sortDir === 'desc' ? 'desc' : 'asc';

  const [data, count] = await prisma.$transaction([
    prisma.member.findMany({
      where: whereClause,
      include: {
        family: true,
        branch: true,
        user: { select: { id: true, email: true, status: true, createdAt: true } },
        tagAssignments: {
          include: { tag: true },
        },
      },
      orderBy: { [sortBy]: sortDir },
      skip,
      take: limit,
    }),
    prisma.member.count({ where: whereClause }),
  ]);

  return { data, count };
}

export async function getMemberModuleSettings(tenantId: string): Promise<any> {
  const row = await prisma.moduleSettings.findUnique({
    where: { tenantId_moduleKey: { tenantId, moduleKey: MEMBER_MODULE_KEY } },
  });

  return {
    ...DEFAULT_MEMBER_SETTINGS,
    ...safeJson(row?.settings, {}),
  };
}

export async function updateMemberModuleSettings(
  tenantId: string,
  settings: Record<string, any>,
  userId?: string | null
): Promise<any> {
  const current = await getMemberModuleSettings(tenantId);
  const next = {
    ...current,
    ...settings,
  };

  await prisma.moduleSettings.upsert({
    where: { tenantId_moduleKey: { tenantId, moduleKey: MEMBER_MODULE_KEY } },
    update: { settings: JSON.stringify(next) },
    create: {
      tenantId,
      moduleKey: MEMBER_MODULE_KEY,
      settings: JSON.stringify(next),
    },
  });

  await recordMemberEvent(tenantId, 'settings_updated', {
    userId,
    metadata: { updatedKeys: Object.keys(settings) },
  });

  return next;
}

export async function getMemberProfile(tenantId: string, memberId: string): Promise<any | null> {
  return prisma.member.findFirst({
    where: { id: memberId, tenantId },
    include: {
      family: { include: { members: true } },
      branch: true,
      user: { select: { id: true, email: true, status: true, createdAt: true } },
      tagAssignments: { include: { tag: true } },
      checkIns: { orderBy: { checkedInAt: 'desc' }, take: 20 },
      notes: { orderBy: { createdAt: 'desc' }, take: 20 },
      groupMemberships: { include: { group: true }, orderBy: { joinedAt: 'desc' } },
      lmsEnrollments: { include: { course: true }, orderBy: { createdAt: 'desc' } },
      eventRegistrations: { include: { event: true }, orderBy: { createdAt: 'desc' } },
      notificationPref: true,
    },
  });
}

export async function getMemberPortalAccount(tenantId: string, userId: string): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { tenantId, userId },
    include: {
      family: { include: { members: true } },
      branch: true,
      user: { select: { id: true, email: true, status: true, preferredLanguage: true, createdAt: true } },
      tagAssignments: { include: { tag: true } },
      checkIns: { orderBy: { checkedInAt: 'desc' }, take: 10 },
      communicationLogs: { orderBy: { createdAt: 'desc' }, take: 10 },
      groupMemberships: { include: { group: true }, orderBy: { joinedAt: 'desc' } },
      lmsEnrollments: { include: { course: true }, orderBy: { createdAt: 'desc' } },
      eventRegistrations: { include: { event: true }, orderBy: { createdAt: 'desc' }, take: 10 },
      notificationPref: true,
    },
  });

  if (!member) {
    throw new Error('Member account profile not found');
  }

  const giving = await getMemberFinancialHistory(tenantId, member.email || member.user?.email || '');
  const settings = await getMemberModuleSettings(tenantId);

  return {
    member,
    giving,
    settings,
  };
}

export async function updateMemberSelfProfile(
  tenantId: string,
  userId: string,
  data: Record<string, any>
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { tenantId, userId },
    include: { user: true },
  });

  if (!member) {
    throw new Error('Member account profile not found');
  }

  const nextEmail = normalizeEmail(data.email);
  if (nextEmail && nextEmail !== member.user?.email?.toLowerCase()) {
    const duplicate = await prisma.user.findUnique({
      where: { tenantId_email: { tenantId, email: nextEmail } },
    });
    if (duplicate && duplicate.id !== userId) {
      throw new Error('Email already registered in this church');
    }
  }

  const birthday = normalizeDate(data.birthday);
  const emergencyContact = data.emergencyContact !== undefined
    ? (data.emergencyContact ? JSON.stringify(data.emergencyContact) : null)
    : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    if (nextEmail && member.user) {
      await tx.user.update({
        where: { id: userId },
        data: { email: nextEmail },
      });
    }

    return tx.member.update({
      where: { id: member.id },
      data: {
        ...(data.firstName !== undefined && { firstName: String(data.firstName).trim() }),
        ...(data.lastName !== undefined && { lastName: String(data.lastName).trim() }),
        ...(data.phone !== undefined && { phone: data.phone ? String(data.phone).trim() : null }),
        ...(nextEmail && { email: nextEmail }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl || null }),
        ...(data.gender !== undefined && { gender: data.gender ? String(data.gender).toLowerCase() : null }),
        ...(birthday !== undefined && { birthday }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.preferredLanguage !== undefined && { preferredLanguage: data.preferredLanguage || 'en' }),
        ...(emergencyContact !== undefined && { emergencyContact }),
      },
      include: {
        family: true,
        branch: true,
        user: { select: { id: true, email: true, status: true, preferredLanguage: true } },
        notificationPref: true,
      },
    });
  });

  await recordMemberEvent(tenantId, 'profile_updated', {
    memberId: member.id,
    userId,
    metadata: { updatedKeys: Object.keys(data) },
  });

  return updated;
}

export async function upsertMemberNotificationPreferences(
  tenantId: string,
  userId: string,
  data: Record<string, any>
): Promise<any> {
  const member = await prisma.member.findFirst({ where: { tenantId, userId } });
  if (!member) throw new Error('Member account profile not found');

  const pref = await prisma.notificationPreference.upsert({
    where: { memberId: member.id },
    update: {
      ...(data.preferEmail !== undefined && { preferEmail: Boolean(data.preferEmail) }),
      ...(data.preferSms !== undefined && { preferSms: Boolean(data.preferSms) }),
      ...(data.preferPush !== undefined && { preferPush: Boolean(data.preferPush) }),
      ...(data.preferWhatsapp !== undefined && { preferWhatsapp: Boolean(data.preferWhatsapp) }),
      ...(data.quietHoursStart !== undefined && { quietHoursStart: data.quietHoursStart || null }),
      ...(data.quietHoursEnd !== undefined && { quietHoursEnd: data.quietHoursEnd || null }),
    },
    create: {
      tenantId,
      memberId: member.id,
      preferEmail: data.preferEmail !== undefined ? Boolean(data.preferEmail) : true,
      preferSms: Boolean(data.preferSms),
      preferPush: data.preferPush !== undefined ? Boolean(data.preferPush) : true,
      preferWhatsapp: Boolean(data.preferWhatsapp),
      quietHoursStart: data.quietHoursStart || null,
      quietHoursEnd: data.quietHoursEnd || null,
    },
  });

  await recordMemberEvent(tenantId, 'notification_preferences_updated', {
    memberId: member.id,
    userId,
  });

  return pref;
}

export async function listMemberSelfActivity(tenantId: string, userId: string): Promise<any[]> {
  const member = await prisma.member.findFirst({ where: { tenantId, userId } });
  if (!member) throw new Error('Member account profile not found');

  return prisma.analyticsEvent.findMany({
    where: {
      tenantId,
      category: 'member',
      OR: [
        { entityId: member.id },
        { userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
}

export async function listMemberActivityEvents(
  tenantId: string,
  options: { memberId?: string; limit?: number } = {}
): Promise<any[]> {
  return prisma.analyticsEvent.findMany({
    where: {
      tenantId,
      category: 'member',
      ...(options.memberId && { entityId: options.memberId }),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(Math.max(Number(options.limit) || 50, 1), 200),
  });
}

export async function getMemberReportsSummary(tenantId: string): Promise<any> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const [
    totalMembers,
    officialMembers,
    visitors,
    leaders,
    linkedAccounts,
    households,
    newThisMonth,
    checkIns30d,
    logins30d,
    profileUpdates30d,
    tags,
  ] = await Promise.all([
    prisma.member.count({ where: { tenantId } }),
    prisma.member.count({ where: { tenantId, membershipStatus: 'member' } }),
    prisma.member.count({ where: { tenantId, membershipStatus: 'visitor' } }),
    prisma.member.count({ where: { tenantId, membershipStatus: 'leader' } }),
    prisma.member.count({ where: { tenantId, userId: { not: null } } }),
    prisma.family.count({ where: { tenantId } }),
    prisma.member.count({ where: { tenantId, createdAt: { gte: monthStart } } }),
    prisma.memberCheckIn.count({ where: { tenantId, checkedInAt: { gte: thirtyDaysAgo } } }),
    prisma.analyticsEvent.count({ where: { tenantId, category: 'member', name: 'login', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.analyticsEvent.count({ where: { tenantId, category: 'member', name: 'profile_updated', createdAt: { gte: thirtyDaysAgo } } }),
    prisma.memberTag.findMany({
      where: { tenantId },
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: 'asc' },
    }),
  ]);

  return {
    totals: {
      members: totalMembers,
      officialMembers,
      visitors,
      leaders,
      linkedAccounts,
      households,
      newThisMonth,
      checkIns30d,
      logins30d,
      profileUpdates30d,
    },
    statusBreakdown: [
      { status: 'member', count: officialMembers },
      { status: 'visitor', count: visitors },
      { status: 'leader', count: leaders },
    ],
    topTags: tags
      .map((tag: any) => ({ id: tag.id, name: tag.name, count: tag._count?.assignments || 0 }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10),
  };
}

export async function createMemberNote(
  tenantId: string,
  memberId: string,
  authorId: string,
  data: {
    noteText: string;
    category?: string;
  }
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }
  if (!data.noteText?.trim()) {
    throw new Error('noteText is required');
  }

  const note = await prisma.memberNote.create({
    data: {
      tenantId,
      memberId: member.id,
      authorId,
      noteText: data.noteText.trim(),
      category: data.category || 'general',
    },
    include: { author: { select: { id: true, email: true } } },
  });

  await recordMemberEvent(tenantId, 'note_created', {
    memberId: member.id,
    userId: authorId,
    metadata: { category: note.category },
  });

  return note;
}

export async function listMemberNotes(tenantId: string, memberId: string): Promise<any[]> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.memberNote.findMany({
    where: { tenantId, memberId: member.id },
    include: { author: { select: { id: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createMemberCheckIn(
  tenantId: string,
  memberId: string,
  data: {
    type: string;
    targetId: string;
  }
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }
  if (!data.type || !data.targetId) {
    throw new Error('type and targetId are required');
  }

  const checkIn = await prisma.memberCheckIn.create({
    data: {
      tenantId,
      memberId: member.id,
      type: data.type.toLowerCase().trim(),
      targetId: data.targetId,
    },
  });

  await recordMemberEvent(tenantId, 'check_in', {
    memberId: member.id,
    metadata: { type: checkIn.type, targetId: checkIn.targetId },
  });

  return checkIn;
}

export async function listMemberCheckIns(tenantId: string, memberId: string): Promise<any[]> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  return await prisma.memberCheckIn.findMany({
    where: { tenantId, memberId: member.id },
    orderBy: { checkedInAt: 'desc' },
  });
}

export async function upsertMemberTag(tenantId: string, name: string): Promise<any> {
  const nameClean = name.toLowerCase().trim();
  if (!nameClean) {
    throw new Error('name is required');
  }

  return await prisma.memberTag.upsert({
    where: {
      tenantId_name: {
        tenantId,
        name: nameClean,
      },
    },
    update: {},
    create: {
      tenantId,
      name: nameClean,
    },
  });
}

export async function assignTagToMember(
  tenantId: string,
  memberId: string,
  tagId: string
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  const tag = await prisma.memberTag.findFirst({
    where: { id: tagId, tenantId },
  });
  if (!tag) {
    throw new Error('Member tag not found');
  }

  const assignment = await prisma.memberTagAssignment.upsert({
    where: {
      memberId_tagId: {
        memberId: member.id,
        tagId: tag.id,
      },
    },
    update: {},
    create: {
      memberId: member.id,
      tagId: tag.id,
    },
    include: { tag: true },
  });

  await recordMemberEvent(tenantId, 'tag_assigned', {
    memberId: member.id,
    metadata: { tag: tag.name },
  });

  return assignment;
}

export async function removeTagFromMember(
  tenantId: string,
  memberId: string,
  tagId: string
): Promise<any> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (!member) {
    throw new Error('Member not found');
  }

  const assignment = await prisma.memberTagAssignment.findUnique({
    where: {
      memberId_tagId: {
        memberId: member.id,
        tagId,
      },
    },
  });

  if (!assignment) {
    throw new Error('Tag assignment not found');
  }

  const deleted = await prisma.memberTagAssignment.delete({
    where: { id: assignment.id },
  });

  await recordMemberEvent(tenantId, 'tag_removed', {
    memberId: member.id,
    metadata: { tagId },
  });

  return deleted;
}

export async function getMemberFinancialHistory(
  tenantId: string,
  email: string
): Promise<{
  donations: any[];
  partnerships: any[];
  recurringGivings: any[];
  recurringPartnerships: any[];
  totalGiven: number;
}> {
  const variants = emailVariants(email);
  if (variants.length === 0) {
    return {
      donations: [],
      partnerships: [],
      recurringGivings: [],
      recurringPartnerships: [],
      totalGiven: 0,
    };
  }

  const [donations, partnerships, recurringGivings, recurringPartnerships] = await Promise.all([
    prisma.donation.findMany({
      where: {
        tenantId,
        donorEmail: { in: variants },
        status: 'succeeded',
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.partnership.findMany({
      where: {
        tenantId,
        partnerEmail: { in: variants },
        status: 'succeeded',
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.recurringGiving.findMany({
      where: {
        tenantId,
        donorEmail: { in: variants },
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.recurringPartnership.findMany({
      where: {
        tenantId,
        partnerEmail: { in: variants },
      },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const donationsSum = donations.reduce((sum, d) => sum + d.amount, 0);
  const partnershipsSum = partnerships.reduce((sum, p) => sum + p.amount, 0);
  const totalGiven = donationsSum + partnershipsSum;

  return {
    donations,
    partnerships,
    recurringGivings,
    recurringPartnerships,
    totalGiven: Math.round(totalGiven * 100) / 100,
  };
}

export { recordMemberEvent };
