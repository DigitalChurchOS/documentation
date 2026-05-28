import prisma from '../lib/prisma';

// ─────────────────────────────────────────────────────────────
// 1. MEETING LIFECYCLE & SETUP
// ─────────────────────────────────────────────────────────────

export async function createMeeting(
  tenantId: string,
  data: {
    hostMemberId: string;
    title: string;
    description?: string;
    meetingType?: 'video' | 'audio' | string;
    provider?: 'native' | 'zoom' | 'google_meet' | string;
    scheduledStart: Date | string;
    scheduledEnd?: Date | string;
    recurrence?: 'none' | 'weekly' | 'monthly' | string;
    recurrenceRules?: string;
    enableWaitingRoom?: boolean;
  }
): Promise<any> {
  if (!data.hostMemberId || !data.title || !data.scheduledStart) {
    throw new Error('hostMemberId, title, and scheduledStart are required');
  }

  // Verify host member exists
  const host = await prisma.member.findFirst({
    where: { id: data.hostMemberId, tenantId },
  });
  if (!host) {
    throw new Error('Host member not found');
  }

  const sStart = new Date(data.scheduledStart);
  const sEnd = data.scheduledEnd ? new Date(data.scheduledEnd) : null;
  if (sEnd && sEnd < sStart) {
    throw new Error('Scheduled end date cannot be before start date');
  }

  const provider = data.provider || 'native';
  const meetingType = data.meetingType || 'video';

  // Generate mock provider url
  let meetingUrl = '';
  let providerMeetingId = '';
  if (provider === 'zoom') {
    providerMeetingId = Math.floor(100000000 + Math.random() * 900000000).toString();
    meetingUrl = `https://zoom.us/j/${providerMeetingId}`;
  } else if (provider === 'google_meet') {
    providerMeetingId = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
    meetingUrl = `https://meet.google.com/${providerMeetingId}`;
  } else {
    // default native (Jitsi mock)
    providerMeetingId = `room-${Math.random().toString(36).substring(2, 9)}`;
    meetingUrl = `https://meet.churchos.org/${providerMeetingId}`;
  }

  // Create meeting inside database
  const meeting = await prisma.liveMeeting.create({
    data: {
      tenantId,
      hostMemberId: data.hostMemberId,
      title: data.title,
      description: data.description || null,
      meetingType,
      provider,
      providerMeetingId,
      meetingUrl,
      scheduledStart: sStart,
      scheduledEnd: sEnd,
      recurrence: data.recurrence || 'none',
      recurrenceRules: data.recurrenceRules || null,
      enableWaitingRoom: data.enableWaitingRoom || false,
      status: 'scheduled',
    },
    include: {
      hostMember: true,
    },
  });

  // Automatically add the host as an approved host participant
  await prisma.liveMeetingParticipant.create({
    data: {
      tenantId,
      meetingId: meeting.id,
      memberId: host.id,
      firstName: host.firstName,
      lastName: host.lastName,
      email: host.email ? host.email.toLowerCase().trim() : 'host@church.com',
      role: 'host',
      joinStatus: 'approved',
    },
  });

  return meeting;
}

export async function getMeeting(
  tenantId: string,
  meetingId: string
): Promise<any> {
  const meeting = await prisma.liveMeeting.findFirst({
    where: { id: meetingId, tenantId },
    include: {
      hostMember: true,
      participants: {
        include: {
          member: { select: { id: true, firstName: true, lastName: true, photoUrl: true } },
        },
      },
      chats: {
        orderBy: { createdAt: 'asc' },
      },
      attendance: {
        orderBy: { joinedAt: 'asc' },
      },
      reminders: true,
    },
  });

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  return meeting;
}

export async function listMeetings(
  tenantId: string,
  filters: {
    hostMemberId?: string;
    status?: string;
  } = {}
): Promise<any[]> {
  const where: any = { tenantId };

  if (filters.hostMemberId) {
    where.hostMemberId = filters.hostMemberId;
  }
  if (filters.status) {
    where.status = filters.status;
  }

  return await prisma.liveMeeting.findMany({
    where,
    include: {
      hostMember: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { scheduledStart: 'asc' },
  });
}

export async function startMeeting(
  tenantId: string,
  meetingId: string
): Promise<any> {
  const meeting = await prisma.liveMeeting.findFirst({
    where: { id: meetingId, tenantId },
  });

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  if (meeting.status === 'ended' || meeting.status === 'cancelled') {
    throw new Error(`Cannot start a meeting that is already ${meeting.status}`);
  }

  return await prisma.liveMeeting.update({
    where: { id: meetingId },
    data: {
      status: 'live',
    },
  });
}

export async function endMeeting(
  tenantId: string,
  meetingId: string,
  data?: { recordingUrl?: string }
): Promise<any> {
  const meeting = await prisma.liveMeeting.findFirst({
    where: { id: meetingId, tenantId },
  });

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  if (meeting.status === 'ended') {
    return meeting;
  }

  // Update meeting state
  const updatedMeeting = await prisma.liveMeeting.update({
    where: { id: meetingId },
    data: {
      status: 'ended',
      recordingUrl: data?.recordingUrl || null,
    },
  });

  // If a recording was saved, automatically upload it into the digital Media archive (mocked)
  if (data?.recordingUrl) {
    try {
      // Find or create default "Meeting Recordings" media category
      let category = await prisma.mediaCategory.findFirst({
        where: { name: 'Meeting Recordings', tenantId },
      });

      if (!category) {
        category = await prisma.mediaCategory.create({
          data: {
            tenantId,
            name: 'Meeting Recordings',
            slug: 'meeting-recordings',
          },
        });
      }

      await prisma.mediaAsset.create({
        data: {
          tenantId,
          categoryId: category.id,
          title: `Recording: ${meeting.title}`,
          description: meeting.description || `Auto-archived meeting recording.`,
          sourceUrl: data.recordingUrl,
          type: meeting.meetingType === 'audio' ? 'audio' : 'video',
          providerType: 'platform_managed',
          status: 'published',
        },
      });
    } catch (err) {
      console.error('Failed to auto-archive live meeting recording:', err);
    }
  }

  return updatedMeeting;
}

// ─────────────────────────────────────────────────────────────
// 2. PARTICIPANT & LOBBY MANAGEMENT
// ─────────────────────────────────────────────────────────────

export async function joinMeetingLobby(
  tenantId: string,
  meetingId: string,
  data: {
    firstName: string;
    lastName: string;
    email: string;
    memberId?: string;
  }
): Promise<any> {
  if (!data.firstName || !data.lastName || !data.email) {
    throw new Error('firstName, lastName, and email are required');
  }

  const meeting = await prisma.liveMeeting.findFirst({
    where: { id: meetingId, tenantId },
  });

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  if (meeting.status === 'ended' || meeting.status === 'cancelled') {
    throw new Error('Cannot join a meeting that has ended or been cancelled');
  }

  if (meeting.isLocked) {
    throw new Error('Meeting room is locked by the host');
  }

  const emailClean = data.email.toLowerCase().trim();

  // If participant already joined, return existing
  const existing = await prisma.liveMeetingParticipant.findFirst({
    where: { meetingId, email: emailClean, tenantId },
  });
  if (existing) {
    return existing;
  }

  // Determine status (place in waiting room if flag set)
  const joinStatus = meeting.enableWaitingRoom ? 'in_waiting_room' : 'approved';

  return await prisma.liveMeetingParticipant.create({
    data: {
      tenantId,
      meetingId,
      memberId: data.memberId || null,
      firstName: data.firstName,
      lastName: data.lastName,
      email: emailClean,
      role: 'participant',
      joinStatus,
    },
  });
}

export async function updateParticipantStatus(
  tenantId: string,
  meetingId: string,
  participantId: string,
  status: 'approved' | 'rejected'
): Promise<any> {
  const participant = await prisma.liveMeetingParticipant.findFirst({
    where: { id: participantId, meetingId, tenantId },
  });

  if (!participant) {
    throw new Error('Participant not found');
  }

  return await prisma.liveMeetingParticipant.update({
    where: { id: participantId },
    data: {
      joinStatus: status,
    },
  });
}

export async function updateParticipantRole(
  tenantId: string,
  meetingId: string,
  participantId: string,
  role: 'host' | 'co_host' | 'participant'
): Promise<any> {
  const participant = await prisma.liveMeetingParticipant.findFirst({
    where: { id: participantId, meetingId, tenantId },
  });

  if (!participant) {
    throw new Error('Participant not found');
  }

  return await prisma.liveMeetingParticipant.update({
    where: { id: participantId },
    data: {
      role,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 3. IN-MEETING INTERACTIONS
// ─────────────────────────────────────────────────────────────

export async function toggleMeetingLock(
  tenantId: string,
  meetingId: string,
  isLocked: boolean
): Promise<any> {
  const meeting = await prisma.liveMeeting.findFirst({
    where: { id: meetingId, tenantId },
  });

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  return await prisma.liveMeeting.update({
    where: { id: meetingId },
    data: {
      isLocked,
    },
  });
}

export async function postMeetingChat(
  tenantId: string,
  meetingId: string,
  data: {
    senderName: string;
    senderEmail: string;
    message: string;
  }
): Promise<any> {
  if (!data.senderName || !data.senderEmail || !data.message) {
    throw new Error('senderName, senderEmail, and message are required');
  }

  const meeting = await prisma.liveMeeting.findFirst({
    where: { id: meetingId, tenantId },
  });

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  return await prisma.liveMeetingChat.create({
    data: {
      tenantId,
      meetingId,
      senderName: data.senderName,
      senderEmail: data.senderEmail.toLowerCase().trim(),
      message: data.message,
    },
  });
}

export async function linkWorshipSession(
  tenantId: string,
  meetingId: string,
  worshipSessionId: string
): Promise<any> {
  const meeting = await prisma.liveMeeting.findFirst({
    where: { id: meetingId, tenantId },
  });

  if (!meeting) {
    throw new Error('Meeting not found');
  }

  // Verify worship session exists
  const session = await prisma.worshipSession.findFirst({
    where: { id: worshipSessionId, tenantId },
  });
  if (!session) {
    throw new Error('Worship session not found');
  }

  return await prisma.liveMeeting.update({
    where: { id: meetingId },
    data: {
      activeWorshipSessionId: worshipSessionId,
    },
  });
}

// ─────────────────────────────────────────────────────────────
// 4. ATTENDANCE & REMINDERS
// ─────────────────────────────────────────────────────────────

export async function trackParticipantJoin(
  tenantId: string,
  meetingId: string,
  email: string
): Promise<any> {
  if (!email) {
    throw new Error('Email is required');
  }

  const meeting = await prisma.liveMeeting.findFirst({
    where: { id: meetingId, tenantId },
  });
  if (!meeting) {
    throw new Error('Meeting not found');
  }

  return await prisma.liveMeetingAttendance.create({
    data: {
      tenantId,
      meetingId,
      participantEmail: email.toLowerCase().trim(),
      joinedAt: new Date(),
    },
  });
}

export async function trackParticipantLeave(
  tenantId: string,
  meetingId: string,
  email: string
): Promise<any> {
  if (!email) {
    throw new Error('Email is required');
  }

  // Find latest active attendance record (where leftAt is null)
  const attendance = await prisma.liveMeetingAttendance.findFirst({
    where: {
      meetingId,
      participantEmail: email.toLowerCase().trim(),
      tenantId,
      leftAt: null,
    },
    orderBy: { joinedAt: 'desc' },
  });

  if (!attendance) {
    throw new Error('Active attendance record not found');
  }

  const leftAt = new Date();
  const diffMs = leftAt.getTime() - attendance.joinedAt.getTime();
  const durationMinutes = Math.max(1, Math.round(diffMs / 60000)); // minimum 1 minute

  return await prisma.liveMeetingAttendance.update({
    where: { id: attendance.id },
    data: {
      leftAt,
      durationMinutes,
    },
  });
}

export async function scheduleMeetingReminder(
  tenantId: string,
  meetingId: string,
  sendBeforeMinutes: number
): Promise<any> {
  if (sendBeforeMinutes <= 0) {
    throw new Error('sendBeforeMinutes must be greater than 0');
  }

  const meeting = await prisma.liveMeeting.findFirst({
    where: { id: meetingId, tenantId },
  });
  if (!meeting) {
    throw new Error('Meeting not found');
  }

  return await prisma.liveMeetingReminder.create({
    data: {
      tenantId,
      meetingId,
      sendBeforeMinutes,
      status: 'pending',
    },
  });
}

export async function triggerMeetingReminder(
  tenantId: string,
  reminderId: string
): Promise<any> {
  const reminder = await prisma.liveMeetingReminder.findFirst({
    where: { id: reminderId, tenantId },
  });

  if (!reminder) {
    throw new Error('Meeting reminder not found');
  }

  if (reminder.status === 'sent') {
    return reminder;
  }

  return await prisma.liveMeetingReminder.update({
    where: { id: reminderId },
    data: {
      status: 'sent',
      sentAt: new Date(),
    },
  });
}
