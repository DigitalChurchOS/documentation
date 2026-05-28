import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// 1. SALVATION RESPONSE & ONBOARDING AUTOMATIONS
// ─────────────────────────────────────────────────────────────

export async function registerSalvationResponse(
  tenantId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    source: string; // livestream | physical_service | funnel | web
    serviceId?: string;
    funnelId?: string;
    preferredLanguage?: string;
    gender?: string;
    age?: number;
    location?: string;
  }
): Promise<any> {
  if (!data.firstName || !data.lastName || !data.email || !data.source) {
    throw new Error('firstName, lastName, email, and source are required');
  }

  // 1. Find or create Member profile
  let member = await prisma.member.findFirst({
    where: { email: data.email.toLowerCase().trim(), tenantId },
  });

  if (!member) {
    member = await prisma.member.create({
      data: {
        tenantId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
        membershipStatus: 'visitor',
        preferredLanguage: data.preferredLanguage || 'en',
      },
    });
  }

  // Check if they already have a New Believer Profile
  let profile = await prisma.newBelieverProfile.findUnique({
    where: { memberId: member.id },
  });

  if (profile) {
    return profile;
  }

  // 2. Automated Demographic Care Agent Routing
  // Find first available leader in the tenant to act as care agent
  const leader = await prisma.member.findFirst({
    where: { tenantId, membershipStatus: 'leader' },
  });
  const agentId = leader ? leader.id : null;

  // 3. Create New Believer Profile
  profile = await prisma.newBelieverProfile.create({
    data: {
      tenantId,
      memberId: member.id,
      source: data.source,
      serviceId: data.serviceId || null,
      funnelId: data.funnelId || null,
      assignedAgentId: agentId,
      welcomeSentAt: new Date(), // Immediate Pastor Welcome Welcome (mocked)
      followUpStartedAt: new Date(), // 30-day email drip starter
      bibleReadingPlanStartedAt: new Date(), // Auto 14-day Bible reading plan enrollment
      lmsEnrolledAt: new Date(), // Auto LMS Foundation School enrollment
      cellId: data.location ? `cell-${data.location.toLowerCase().replace(/\s+/g, '-')}` : 'cell-virtual-default',
    },
  });

  // 4. Schedule Day 7 and Day 30 follow-up call reminders
  const day7Date = new Date();
  day7Date.setDate(day7Date.getDate() + 7);

  const day30Date = new Date();
  day30Date.setDate(day30Date.getDate() + 30);

  await prisma.newBelieverReminder.createMany({
    data: [
      {
        profileId: profile.id,
        reminderType: 'day7',
        scheduledFor: day7Date,
        status: 'pending',
      },
      {
        profileId: profile.id,
        reminderType: 'day30',
        scheduledFor: day30Date,
        status: 'pending',
      },
    ],
  });

  // Increment Salvation response count on ChurchService if linked
  if (data.serviceId) {
    try {
      await prisma.churchService.update({
        where: { id: data.serviceId },
        data: {
          salvationCount: { increment: 1 },
        },
      });
    } catch (e) {
      // Ignore if service doesn't exist
    }
  }

  return await prisma.newBelieverProfile.findUnique({
    where: { id: profile.id },
    include: {
      member: true,
      assignedAgent: true,
      reminders: true,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 2. MILESTONE & PROGRESS TRACKING
// ─────────────────────────────────────────────────────────────

export async function recordBaptism(tenantId: string, profileId: string, baptismDate: Date): Promise<any> {
  const profile = await prisma.newBelieverProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('New believer profile not found');
  }

  return await prisma.newBelieverProfile.update({
    where: { id: profile.id },
    data: {
      isBaptized: true,
      baptismDate: new Date(baptismDate),
    },
  });
}

export async function updateMilestone(
  tenantId: string,
  profileId: string,
  milestone: 'joinedGroup' | 'finishedClass',
  value: boolean
): Promise<any> {
  const profile = await prisma.newBelieverProfile.findFirst({
    where: { id: profileId, tenantId },
  });
  if (!profile) {
    throw new Error('New believer profile not found');
  }

  const updateData: any = {};
  updateData[milestone] = value;

  if (milestone === 'finishedClass' && value) {
    updateData.lmsCompletedAt = new Date();
  } else if (milestone === 'finishedClass' && !value) {
    updateData.lmsCompletedAt = null;
  }

  return await prisma.newBelieverProfile.update({
    where: { id: profile.id },
    data: updateData,
  });
}

export async function getNewBelieverProfile(tenantId: string, memberId: string): Promise<any> {
  const profile = await prisma.newBelieverProfile.findFirst({
    where: { memberId, tenantId },
    include: {
      member: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      },
      assignedAgent: {
        select: { id: true, firstName: true, lastName: true },
      },
      reminders: true,
    },
  });
  if (!profile) {
    throw new Error('New believer profile not found');
  }

  return profile;
}

// ─────────────────────────────────────────────────────────────
// 3. CARE TEAM REMINDERS
// ─────────────────────────────────────────────────────────────

export async function completeReminder(tenantId: string, reminderId: string, notes?: string): Promise<any> {
  const reminder = await prisma.newBelieverReminder.findFirst({
    where: {
      id: reminderId,
      profile: { tenantId },
    },
  });
  if (!reminder) {
    throw new Error('Reminder not found');
  }

  return await prisma.newBelieverReminder.update({
    where: { id: reminder.id },
    data: {
      completedAt: new Date(),
      status: 'completed',
      notes: notes || null,
    },
  });
}

export async function listPendingReminders(tenantId: string, assignedAgentId?: string): Promise<any[]> {
  const whereClause: any = {
    status: 'pending',
    profile: { tenantId },
  };

  if (assignedAgentId) {
    whereClause.profile.assignedAgentId = assignedAgentId;
  }

  return await prisma.newBelieverReminder.findMany({
    where: whereClause,
    include: {
      profile: {
        include: {
          member: {
            select: { id: true, firstName: true, lastName: true, email: true, phone: true },
          },
        },
      },
    },
    orderBy: { scheduledFor: 'asc' },
  });
}

// ─────────────────────────────────────────────────────────────
// 4. RESOURCE RECOMMENDATIONS
// ─────────────────────────────────────────────────────────────

export function getSalvationResources(): any[] {
  return [
    {
      title: 'Free Digital Holy Bible',
      description: 'An introductory guide with translations optimized for new believers.',
      downloadUrl: 'https://cdn.church.org/pdf/new-believer-bible.pdf',
      estimatedReadTime: '14 days reading plan',
    },
    {
      title: 'Foundation School Student Guide',
      description: 'The complete syllabus detailing repentance, grace, faith, and salvation.',
      downloadUrl: 'https://cdn.church.org/pdf/foundation-school-guide.pdf',
      estimatedReadTime: '4 modules',
    },
  ];
}

// ─────────────────────────────────────────────────────────────
// 5. COMPLETION REPORTS & ANALYTICS
// ─────────────────────────────────────────────────────────────

export async function getSalvationCompletionReport(tenantId: string): Promise<any> {
  const profiles = await prisma.newBelieverProfile.findMany({
    where: { tenantId },
  });

  const totalConverts = profiles.length;
  const welcomedCount = profiles.filter((p) => p.welcomeSentAt !== null).length;
  const lmsEnrolled = profiles.filter((p) => p.lmsEnrolledAt !== null).length;
  const lmsCompleted = profiles.filter((p) => p.lmsCompletedAt !== null).length;
  const baptized = profiles.filter((p) => p.isBaptized).length;
  const joinedGroup = profiles.filter((p) => p.joinedGroup).length;
  const finishedClass = profiles.filter((p) => p.finishedClass).length;

  // Source distribution
  const sourceDistribution: Record<string, number> = {};
  profiles.forEach((p) => {
    sourceDistribution[p.source] = (sourceDistribution[p.source] || 0) + 1;
  });

  const bySource = Object.entries(sourceDistribution).map(([source, count]) => ({
    source,
    count,
  }));

  // Calculate conversion rates
  const lmsCompletionRate = lmsEnrolled > 0 ? parseFloat(((lmsCompleted / lmsEnrolled) * 100).toFixed(1)) : 0;
  const baptismRate = totalConverts > 0 ? parseFloat(((baptized / totalConverts) * 100).toFixed(1)) : 0;

  return {
    totalConverts,
    welcomedCount,
    lmsEnrolled,
    lmsCompleted,
    baptized,
    joinedGroup,
    finishedClass,
    lmsCompletionRate,
    baptismRate,
    bySource,
  };
}
