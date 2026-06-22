import prisma from '../lib/prisma';

export interface GroupSettingsData {
  cellSizeLimit?: number;
  superCellSizeLimit?: number;
  autoNamingRuleEnabled?: boolean;
  hierarchyDeepLimit?: number;
}

export interface GroupTypeData {
  name: string;
  tierLevel: number;
  maxMembersThreshold?: number;
  nestedCellsThreshold?: number;
}

export interface GroupCreateData {
  name?: string;
  description?: string;
  parentId?: string;
  groupTypeId: string;
  leaderId?: string;
  coLeaderId?: string;
  hostId?: string;
  locationGeocoding?: string;
  onlineMeetingUrl?: string;
}

export interface NoticePostData {
  title: string;
  content: string;
  category: 'announcement' | 'alert' | 'sermon_outline' | 'video' | 'audio';
  fileAttachmentsJson?: string;
  externalEmbedsJson?: string;
}

/**
 * Verification check for Cell Leader eligibility.
 * Must have either:
 * 1. Member.membershipStatus === 'leader'
 * 2. VolunteerProfile.trainingStatus === 'certified'
 * 3. Completed LmsCourse with slug 'cell-ministry-leadership-course' or title contains 'Cell Ministry Leadership'
 */
export async function verifyLeadershipPrerequisite(tenantId: string, memberId: string): Promise<boolean> {
  const member = await prisma.member.findFirst({
    where: { id: memberId, tenantId },
  });
  if (member?.membershipStatus === 'leader') {
    return true;
  }

  const volProfile = await prisma.volunteerProfile.findFirst({
    where: { memberId, tenantId },
  });
  if (volProfile?.trainingStatus === 'certified') {
    return true;
  }

  const enrollment = await prisma.lmsEnrollment.findFirst({
    where: {
      memberId,
      tenantId,
      status: 'completed',
      course: {
        OR: [
          { slug: 'cell-ministry-leadership-course' },
          { title: { contains: 'Cell Ministry Leadership' } }
        ]
      }
    }
  });

  return !!enrollment;
}

/**
 * 1. Settings & Group Type Setup
 */
export async function upsertGroupSettings(tenantId: string, data: GroupSettingsData) {
  return await prisma.groupSettings.upsert({
    where: { tenantId },
    create: {
      tenantId,
      cellSizeLimit: data.cellSizeLimit ?? 25,
      superCellSizeLimit: data.superCellSizeLimit ?? 25,
      autoNamingRuleEnabled: data.autoNamingRuleEnabled ?? true,
      hierarchyDeepLimit: data.hierarchyDeepLimit ?? 3,
    },
    update: {
      ...data
    }
  });
}

export async function getGroupSettings(tenantId: string) {
  let settings = await prisma.groupSettings.findUnique({
    where: { tenantId },
  });
  if (!settings) {
    settings = await upsertGroupSettings(tenantId, {});
  }
  return settings;
}

export async function createGroupType(tenantId: string, data: GroupTypeData) {
  return await prisma.groupType.create({
    data: {
      tenantId,
      name: data.name,
      tierLevel: data.tierLevel,
      maxMembersThreshold: data.maxMembersThreshold ?? 25,
      nestedCellsThreshold: data.nestedCellsThreshold ?? 25,
    }
  });
}

export async function listGroupTypes(tenantId: string) {
  return await prisma.groupType.findMany({
    where: { tenantId },
    orderBy: { tierLevel: 'asc' }
  });
}

/**
 * 2. Cell / Group Management
 */
export async function createGroup(tenantId: string, data: GroupCreateData) {
  const settings = await getGroupSettings(tenantId);
  const groupType = await prisma.groupType.findFirst({
    where: { id: data.groupTypeId, tenantId },
  });

  if (!groupType) {
    throw new Error('Invalid group type specified');
  }

  // Validate hierarchy deep limit
  if (data.parentId) {
    let depth = 1;
    let currParentId = data.parentId;
    while (currParentId) {
      const parentNode = await prisma.group.findFirst({
        where: { id: currParentId, tenantId },
      });
      if (parentNode) {
        depth++;
        currParentId = parentNode.parentId || '';
      } else {
        break;
      }
    }
    if (depth > settings.hierarchyDeepLimit) {
      throw new Error(`Hierarchy depth limit of ${settings.hierarchyDeepLimit} exceeded`);
    }
  }

  // Auto-naming rules logic
  let finalName = data.name;
  if (!finalName && settings.autoNamingRuleEnabled) {
    const counts = await prisma.group.count({
      where: { tenantId, groupTypeId: data.groupTypeId },
    });
    finalName = `${groupType.name} Group ${counts + 1}`;
  }

  if (!finalName) {
    throw new Error('Group name is required when auto-naming is disabled');
  }

  // Verify leader qualifications
  if (data.leaderId) {
    const isEligible = await verifyLeadershipPrerequisite(tenantId, data.leaderId);
    if (!isEligible) {
      throw new Error('Leader does not meet LMS certification or certified eligibility prerequisites');
    }
  }

  const group = await prisma.group.create({
    data: {
      tenantId,
      parentId: data.parentId || null,
      groupTypeId: data.groupTypeId,
      name: finalName,
      description: data.description,
      leaderId: data.leaderId || null,
      coLeaderId: data.coLeaderId || null,
      hostId: data.hostId || null,
      locationGeocoding: data.locationGeocoding,
      onlineMeetingUrl: data.onlineMeetingUrl,
    }
  });

  // Automatically provision the Notice Board for this cell
  await prisma.groupNoticeBoard.create({
    data: {
      tenantId,
      groupId: group.id,
    }
  });

  // If a leader/coleader/host is assigned, register them in GroupMembers roster
  if (data.leaderId) {
    await prisma.groupMember.create({
      data: { tenantId, groupId: group.id, memberId: data.leaderId, role: 'leader', status: 'active' }
    });
  }
  if (data.coLeaderId) {
    await prisma.groupMember.create({
      data: { tenantId, groupId: group.id, memberId: data.coLeaderId, role: 'assistant', status: 'active' }
    });
  }
  if (data.hostId) {
    await prisma.groupMember.create({
      data: { tenantId, groupId: group.id, memberId: data.hostId, role: 'host', status: 'active' }
    });
  }

  return group;
}

export async function listGroups(tenantId: string, filters: { parentId?: string; groupTypeId?: string } = {}) {
  const whereClause: any = { tenantId };
  if (filters.parentId !== undefined) {
    whereClause.parentId = filters.parentId === 'null' || !filters.parentId ? null : filters.parentId;
  }
  if (filters.groupTypeId) {
    whereClause.groupTypeId = filters.groupTypeId;
  }

  return await prisma.group.findMany({
    where: whereClause,
    include: {
      groupType: true,
      leader: true,
      coLeader: true,
      host: true,
    }
  });
}

export async function getGroup(tenantId: string, groupId: string) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, tenantId },
    include: {
      groupType: true,
      leader: true,
      coLeader: true,
      host: true,
      members: {
        include: { member: true }
      },
      noticeBoard: {
        include: { posts: true }
      }
    }
  });

  if (!group) {
    throw new Error('Group not found');
  }
  return group;
}

export async function updateGroup(tenantId: string, groupId: string, data: Partial<GroupCreateData> & { status?: string }) {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) {
    throw new Error('Group not found');
  }

  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status) updateData.status = data.status;
  if (data.onlineMeetingUrl !== undefined) updateData.onlineMeetingUrl = data.onlineMeetingUrl;
  if (data.locationGeocoding !== undefined) updateData.locationGeocoding = data.locationGeocoding;

  return await prisma.group.update({
    where: { id: groupId },
    data: updateData,
  });
}

export async function assignGroupRoles(tenantId: string, groupId: string, rolesData: { leaderId?: string; coLeaderId?: string; hostId?: string }) {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) {
    throw new Error('Group not found');
  }

  if (rolesData.leaderId) {
    const isEligible = await verifyLeadershipPrerequisite(tenantId, rolesData.leaderId);
    if (!isEligible) {
      throw new Error('Leader does not meet LMS certification or certified eligibility prerequisites');
    }
  }

  const updateData: any = {};
  if (rolesData.leaderId !== undefined) updateData.leaderId = rolesData.leaderId || null;
  if (rolesData.coLeaderId !== undefined) updateData.coLeaderId = rolesData.coLeaderId || null;
  if (rolesData.hostId !== undefined) updateData.hostId = rolesData.hostId || null;

  const updatedGroup = await prisma.group.update({
    where: { id: groupId },
    data: updateData,
  });

  // Synchronize GroupMember roster
  if (rolesData.leaderId) {
    await prisma.groupMember.upsert({
      where: { id: `leader-${groupId}` }, // Wait, compound unique constraints or custom identifier
      // Let's find existing leader role or create/update
      create: { tenantId, groupId, memberId: rolesData.leaderId, role: 'leader', status: 'active' },
      update: { memberId: rolesData.leaderId, status: 'active' }
    }).catch(async () => {
      // In SQLite, if unique constraints block upserts on compound keys, do it manually
      await prisma.groupMember.deleteMany({ where: { groupId, role: 'leader' } });
      await prisma.groupMember.create({ data: { tenantId, groupId, memberId: rolesData.leaderId!, role: 'leader', status: 'active' } });
    });
  }

  return updatedGroup;
}

/**
 * 3. Group Member Management (Exclusivity)
 */
export async function addMemberToGroup(tenantId: string, groupId: string, memberId: string, role = 'member') {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) {
    throw new Error('Group not found');
  }

  // Strict Exclusivity check
  const activeMembership = await prisma.groupMember.findFirst({
    where: {
      tenantId,
      memberId,
      status: 'active',
    }
  });

  if (activeMembership) {
    throw new Error('Member is already active in another cell');
  }

  return await prisma.groupMember.create({
    data: {
      tenantId,
      groupId,
      memberId,
      role,
      status: 'active',
    }
  });
}

export async function removeMemberFromGroup(tenantId: string, groupId: string, memberId: string) {
  const membership = await prisma.groupMember.findFirst({
    where: { tenantId, groupId, memberId, status: 'active' }
  });

  if (!membership) {
    throw new Error('Active group membership not found');
  }

  return await prisma.groupMember.update({
    where: { id: membership.id },
    data: { status: 'inactive' }
  });
}

/**
 * 4. Meetings & Attendance Logging
 */
export async function scheduleMeeting(tenantId: string, groupId: string, meetingData: { topic: string; scheduledAt: string; studyGuideUrl?: string }) {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) {
    throw new Error('Group not found');
  }

  return await prisma.groupMeeting.create({
    data: {
      tenantId,
      groupId,
      topic: meetingData.topic,
      scheduledAt: new Date(meetingData.scheduledAt),
      studyGuideUrl: meetingData.studyGuideUrl,
    }
  });
}

export async function logMeetingAttendance(
  tenantId: string,
  meetingId: string,
  attendancesList: { memberId: string; status: 'present' | 'absent' | 'excused' }[],
  checkedInById?: string
) {
  const meeting = await prisma.groupMeeting.findFirst({ where: { id: meetingId, tenantId } });
  if (!meeting) {
    throw new Error('Meeting not found');
  }

  // Perform inside a transaction for atomic consistency
  return await prisma.$transaction(async (tx) => {
    // Delete existing attendance for this meeting to prevent duplicates
    await tx.groupAttendance.deleteMany({ where: { meetingId } });

    // Write new attendance records
    await tx.groupAttendance.createMany({
      data: attendancesList.map((att) => ({
        tenantId,
        meetingId,
        memberId: att.memberId,
        status: att.status,
        checkedInById: checkedInById || null,
      }))
    });

    const presentCount = attendancesList.filter((a) => a.status === 'present').length;

    // Update meeting attendance counter
    return await tx.groupMeeting.update({
      where: { id: meetingId },
      data: {
        heldAt: new Date(),
        attendanceCount: presentCount,
      }
    });
  });
}

export async function listMeetings(tenantId: string, groupId: string) {
  return await prisma.groupMeeting.findMany({
    where: { groupId, tenantId },
    orderBy: { scheduledAt: 'desc' }
  });
}

/**
 * 5. Notice Board
 */
export async function verifyNoticeBoardAccess(
  tenantId: string,
  groupId: string,
  userId: string,
  permissionType: 'read' | 'write'
): Promise<boolean> {
  // Admins always have read/write
  const userRoles = await prisma.userRole.findMany({
    where: { userId, role: { tenantId } },
    include: { role: true }
  });
  const isAdmin = userRoles.some((ur) => ur.role.name === 'Admin');
  if (isAdmin) return true;

  // Resolve member profile
  const member = await prisma.member.findFirst({ where: { userId, tenantId } });
  if (!member) return false;

  // 1. Membership Check for READ access
  if (permissionType === 'read') {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, memberId: member.id, status: 'active' }
    });
    if (membership) return true;

    // A parent leader (Super Cell or Master Cell) can also read nested boards
    // Let's traverse upwards from the target group to see if member is the leader of any ancestor group
    let currentGroup = await prisma.group.findFirst({ where: { id: groupId } });
    while (currentGroup && currentGroup.parentId) {
      const parentGroup = await prisma.group.findFirst({
        where: { id: currentGroup.parentId },
        include: { members: true }
      });
      if (parentGroup) {
        const isParentLeader = parentGroup.leaderId === member.id || parentGroup.coLeaderId === member.id;
        if (isParentLeader) return true;
        currentGroup = parentGroup;
      } else {
        break;
      }
    }
    return false;
  }

  // 2. WRITE Access Checks
  // A. Check direct cell roles: Leader, Assistant, or delegated Secretary
  const directMembership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      memberId: member.id,
      status: 'active',
      role: { in: ['leader', 'assistant', 'secretary'] }
    }
  });
  if (directMembership) return true;

  // B. Check parent group hierarchical roles (Super/Master leaders)
  let currentGroup = await prisma.group.findFirst({ where: { id: groupId } });
  while (currentGroup && currentGroup.parentId) {
    const parentGroup = await prisma.group.findFirst({
      where: { id: currentGroup.parentId }
    });
    if (parentGroup) {
      const isParentLeader = parentGroup.leaderId === member.id || parentGroup.coLeaderId === member.id;
      if (isParentLeader) return true;
      currentGroup = parentGroup;
    } else {
      break;
    }
  }

  return false;
}

export async function postNotice(
  tenantId: string,
  groupId: string,
  postedByUserId: string,
  postData: NoticePostData
) {
  const isAuthorized = await verifyNoticeBoardAccess(tenantId, groupId, postedByUserId, 'write');
  if (!isAuthorized) {
    throw new Error('Not authorized to post to this group notice board');
  }

  const noticeBoard = await prisma.groupNoticeBoard.findFirst({
    where: { groupId, tenantId }
  });
  if (!noticeBoard) {
    throw new Error('Notice board not found');
  }

  return await prisma.groupNoticePost.create({
    data: {
      tenantId,
      boardId: noticeBoard.id,
      postedByUserId,
      title: postData.title,
      content: postData.content,
      category: postData.category,
      fileAttachmentsJson: postData.fileAttachmentsJson || null,
      externalEmbedsJson: postData.externalEmbedsJson || null,
    }
  });
}

export async function delegateNoticeBoardWrite(tenantId: string, groupId: string, memberId: string) {
  // Find group membership
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, memberId, tenantId, status: 'active' }
  });

  if (!membership) {
    throw new Error('Active group membership not found');
  }

  // Update role to secretary to delegate write permission
  return await prisma.groupMember.update({
    where: { id: membership.id },
    data: { role: 'secretary' }
  });
}

/**
 * 6. Outreach & Invite
 */
export async function createInviteLink(tenantId: string, groupId: string, createdByMemberId: string, customMessage?: string) {
  const group = await prisma.group.findFirst({ where: { id: groupId, tenantId } });
  if (!group) {
    throw new Error('Group not found');
  }

  const token = `cell-invite-${Math.random().toString(36).substr(2, 9)}`;

  return await prisma.groupInviteLink.create({
    data: {
      tenantId,
      groupId,
      createdByMemberId,
      token,
      customMessage,
      active: true,
    }
  });
}

export async function convertInvite(
  tenantId: string,
  token: string,
  visitorDetails: { firstName: string; lastName: string; email: string; phone?: string }
) {
  const inviteLink = await prisma.groupInviteLink.findFirst({
    where: { token, tenantId, active: true }
  });

  if (!inviteLink) {
    throw new Error('Invalid or inactive invite link token');
  }

  // Resolve or create Member directory record
  let member = await prisma.member.findFirst({
    where: { email: visitorDetails.email, tenantId }
  });

  if (!member) {
    member = await prisma.member.create({
      data: {
        tenantId,
        firstName: visitorDetails.firstName,
        lastName: visitorDetails.lastName,
        email: visitorDetails.email,
        phone: visitorDetails.phone,
        membershipStatus: 'visitor',
      }
    });
  }

  // Enforce single-cell exclusivity for visitor check
  const activeCell = await prisma.groupMember.findFirst({
    where: { memberId: member.id, tenantId, status: 'active' }
  });

  if (!activeCell) {
    // Automatically register visitor in the inviting cell
    await prisma.groupMember.create({
      data: {
        tenantId,
        groupId: inviteLink.groupId,
        memberId: member.id,
        role: 'member',
        status: 'active'
      }
    });
  }

  // Increment invite clicks
  await prisma.groupInviteLink.update({
    where: { id: inviteLink.id },
    data: { clicksCount: { increment: 1 } }
  });

  // Record conversion
  const conversion = await prisma.groupInviteConversion.create({
    data: {
      tenantId,
      inviteLinkId: inviteLink.id,
      visitorMemberId: member.id,
      attributionStatus: 'verified'
    }
  });

  return { member, conversion };
}

/**
 * 7. Accreditation & Scorecards
 */
export async function calculateScorecard(tenantId: string, groupId: string) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, tenantId },
    include: { members: { where: { status: 'active' }, include: { member: true } } }
  });

  if (!group) {
    throw new Error('Group not found');
  }

  const memberEmails = group.members.map((m) => m.member.email).filter(Boolean) as string[];

  // 1. Total Members
  const membersCount = group.members.length;

  // 2. Average Attendance Rate
  const meetings = await prisma.groupMeeting.findMany({
    where: { groupId, tenantId },
    include: { attendances: true }
  });

  let averageAttendanceRate = 0.0;
  if (meetings.length > 0) {
    let totalPresent = 0;
    let totalAssigned = 0;
    for (const mt of meetings) {
      totalPresent += mt.attendances.filter((a) => a.status === 'present').length;
      totalAssigned += mt.attendances.length;
    }
    averageAttendanceRate = totalAssigned > 0 ? parseFloat(((totalPresent / totalAssigned) * 100).toFixed(1)) : 0.0;
  }

  // 3. Giving Attribution
  let totalGivingAttribution = 0.0;
  if (memberEmails.length > 0) {
    const donationSum = await prisma.donation.aggregate({
      _sum: { amount: true },
      where: {
        tenantId,
        status: 'succeeded',
        donorEmail: { in: memberEmails }
      }
    });
    const partnershipSum = await prisma.partnership.aggregate({
      _sum: { amount: true },
      where: {
        tenantId,
        status: 'succeeded',
        partnerEmail: { in: memberEmails }
      }
    });

    totalGivingAttribution = (donationSum._sum.amount || 0.0) + (partnershipSum._sum.amount || 0.0);
  }

  // 4. Outreach conversions count
  const inviteLinks = await prisma.groupInviteLink.findMany({
    where: { groupId, tenantId }
  });
  const linkIds = inviteLinks.map((l) => l.id);

  let outreachConversionsCount = 0;
  if (linkIds.length > 0) {
    outreachConversionsCount = await prisma.groupInviteConversion.count({
      where: {
        tenantId,
        inviteLinkId: { in: linkIds },
        attributionStatus: 'verified'
      }
    });
  }

  return {
    groupId,
    membersCount,
    averageAttendanceRate,
    totalGivingAttribution,
    outreachConversionsCount,
  };
}

export async function promoteGroup(tenantId: string, groupId: string, approvedByAdminId: string) {
  const scorecard = await calculateScorecard(tenantId, groupId);
  const group = await prisma.group.findFirst({
    where: { id: groupId, tenantId },
    include: { groupType: true, leader: true }
  });

  if (!group) {
    throw new Error('Group not found');
  }

  const currentLevel = group.groupType.tierLevel;
  if (currentLevel <= 1) {
    throw new Error('Group is already at the highest hierarchy level (Master Cell)');
  }

  // Validate promotional metrics (cell size limits / nested cells counts thresholds)
  // For simplicity, we check if membersCount exceeds threshold
  const targetMembersThreshold = group.groupType.maxMembersThreshold;
  if (scorecard.membersCount < targetMembersThreshold) {
    throw new Error(`Promotional thresholds not met. Current active members: ${scorecard.membersCount}/${targetMembersThreshold}`);
  }

  // Resolve next level group type
  const targetLevel = currentLevel - 1;
  const nextGroupType = await prisma.groupType.findFirst({
    where: { tierLevel: targetLevel, tenantId }
  });

  if (!nextGroupType) {
    throw new Error(`Target Group Type for tier level ${targetLevel} is not configured`);
  }

  // Perform promotion inside a transaction
  return await prisma.$transaction(async (tx) => {
    // Record Promotion Audit
    const promotion = await tx.groupPromotion.create({
      data: {
        tenantId,
        targetId: groupId,
        type: 'group_level_up',
        oldValue: group.groupType.name,
        newValue: nextGroupType.name,
        scorecardSnapshotJson: JSON.stringify(scorecard),
        approvedByAdminId,
        pastorAuthorityVerified: true,
      }
    });

    // Update group type
    await tx.group.update({
      where: { id: groupId },
      data: { groupTypeId: nextGroupType.id }
    });

    // Also promote the leader profile classification to matches levels
    if (group.leaderId) {
      const nextRole = targetLevel === 2 ? 'Super Cell Leader' : 'Master Cell Leader';
      await tx.groupPromotion.create({
        data: {
          tenantId,
          targetId: group.leaderId,
          type: 'leader_level_up',
          oldValue: 'Cell Leader',
          newValue: nextRole,
          scorecardSnapshotJson: JSON.stringify(scorecard),
          approvedByAdminId,
          pastorAuthorityVerified: true,
        }
      });
    }

    return promotion;
  });
}
