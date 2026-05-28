import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('Module 41: Live Meetings Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let adminUserId: string;
  let memberUserId: string;

  let hostMemberId: string;
  let participantMemberId: string;

  let meetingId: string;
  let participantId: string;
  let worshipSessionId: string;
  let reminderId: string;

  beforeAll(async () => {
    // 1. Clean up database records
    await prisma.liveMeetingReminder.deleteMany({});
    await prisma.liveMeetingAttendance.deleteMany({});
    await prisma.liveMeetingChat.deleteMany({});
    await prisma.liveMeetingParticipant.deleteMany({});
    await prisma.liveMeeting.deleteMany({});
    await prisma.worshipSession.deleteMany({});
    await prisma.worshipSong.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.mediaCategory.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Grace Meeting Church', subdomain: 'grace-meet', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Setup permissions & roles
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.read', 'member.update', 'tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const memberRole = await prisma.role.create({
      data: { tenantId, name: 'Member', isCustom: false },
    });
    const memberPermissions = permissions.filter((p) => ['member.read', 'member.update'].includes(p.name));
    await prisma.rolePermission.createMany({
      data: memberPermissions.map((p) => ({ roleId: memberRole.id, permissionId: p.id })),
    });

    const passHash = await bcrypt.hash('password123', 12);

    // 4. Create Admin User (Host)
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'pastor@grace-meet.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    const hostMember = await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Barnabas',
        lastName: 'Pastor',
        email: 'pastor@grace-meet.com',
        membershipStatus: 'leader',
      },
    });
    hostMemberId = hostMember.id;

    // 5. Create Normal Member User (Participant)
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@grace-meet.com', passwordHash: passHash },
    });
    memberUserId = memberUser.id;
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    const participantMember = await prisma.member.create({
      data: {
        tenantId,
        userId: memberUser.id,
        firstName: 'John',
        lastName: 'Disciple',
        email: 'member@grace-meet.com',
        membershipStatus: 'member',
      },
    });
    participantMemberId = participantMember.id;

    // 6. Create Worship Song & Session for linking checks
    const song = await prisma.worshipSong.create({
      data: {
        tenantId,
        title: 'Amazing Grace',
        lyrics: 'Amazing grace, how sweet the sound...',
      },
    });

    const session = await prisma.worshipSession.create({
      data: {
        tenantId,
        name: 'Sunday Morning Worship',
        currentSongId: song.id,
        status: 'active',
      },
    });
    worshipSessionId = session.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. MEETING LIFE CYCLE CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Meeting Lifecycle & Setup', () => {
    it('should allow admin/leader to create a scheduled meeting with waiting lobby', async () => {
      const res = await request(app)
        .post('/api/meetings')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          hostMemberId,
          title: 'Tuesday Midweek Bible Study',
          description: 'Deep study of the epistles.',
          meetingType: 'video',
          provider: 'native', // Jitsi mock
          scheduledStart: '2026-06-02T19:00:00Z',
          scheduledEnd: '2026-06-02T20:30:00Z',
          enableWaitingRoom: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.meetingUrl).toContain('meet.churchos.org');
      expect(res.body.data.status).toBe('scheduled');
      expect(res.body.data.enableWaitingRoom).toBe(true);

      meetingId = res.body.data.id;
    });

    it('should list active meetings', async () => {
      const res = await request(app)
        .get('/api/meetings')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(meetingId);
    });

    it('should allow starting the meeting, transitioning status to live', async () => {
      const res = await request(app)
        .post(`/api/meetings/${meetingId}/start`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('live');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. PARTICIPANTS, waiting room & lock controls
  // ─────────────────────────────────────────────────────────────
  describe('Participant & Lobby Controls', () => {
    it('should place a participant in the waiting room when lobby is active', async () => {
      const res = await request(app)
        .post(`/api/meetings/${meetingId}/join`)
        .set('x-tenant-id', tenantId)
        .send({
          firstName: 'Alice',
          lastName: 'Guest',
          email: 'alice@guest.com',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.joinStatus).toBe('in_waiting_room');
      expect(res.body.data.role).toBe('participant');

      participantId = res.body.data.id;
    });

    it('should allow host to approve waiting room attendee', async () => {
      const res = await request(app)
        .patch(`/api/meetings/${meetingId}/participants/${participantId}/status`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body.data.joinStatus).toBe('approved');
    });

    it('should allow host to promote participant to co-host', async () => {
      const res = await request(app)
        .patch(`/api/meetings/${meetingId}/participants/${participantId}/role`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'co_host' });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('co_host');
    });

    it('should lock the room and prevent new participants from joining', async () => {
      // 1. Lock room
      const resLock = await request(app)
        .post(`/api/meetings/${meetingId}/lock`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isLocked: true });

      expect(resLock.status).toBe(200);
      expect(resLock.body.data.isLocked).toBe(true);

      // 2. Try to join
      const resJoin = await request(app)
        .post(`/api/meetings/${meetingId}/join`)
        .set('x-tenant-id', tenantId)
        .send({
          firstName: 'Charlie',
          lastName: 'Late',
          email: 'charlie@late.com',
        });

      expect(resJoin.status).toBe(400);
      expect(resJoin.body.error).toContain('locked');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. CHATS & WORSHIP SYNC
  // ─────────────────────────────────────────────────────────────
  describe('In-Meeting Interactions & Worship Slide Sync', () => {
    it('should allow posting messages to meeting chat', async () => {
      const res = await request(app)
        .post(`/api/meetings/${meetingId}/chat`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          senderName: 'Alice Guest',
          senderEmail: 'alice@guest.com',
          message: 'Hello everyone!',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.message).toBe('Hello everyone!');
    });

    it('should support linking active worship slides session', async () => {
      const res = await request(app)
        .post(`/api/meetings/${meetingId}/worship`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ worshipSessionId });

      expect(res.status).toBe(200);
      expect(res.body.data.activeWorshipSessionId).toBe(worshipSessionId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. ATTENDANCE tracking
  // ─────────────────────────────────────────────────────────────
  describe('Attendance Logging', () => {
    it('should log when a participant joins and leaves computing duration', async () => {
      const email = 'alice@guest.com';

      // 1. Join log
      const resJoin = await request(app)
        .post(`/api/meetings/${meetingId}/join-log`)
        .set('x-tenant-id', tenantId)
        .send({ email });

      expect(resJoin.status).toBe(201);
      expect(resJoin.body.data.participantEmail).toBe(email);
      expect(resJoin.body.data.joinedAt).toBeDefined();
      expect(resJoin.body.data.leftAt).toBeNull();

      // 2. Leave log
      const resLeave = await request(app)
        .post(`/api/meetings/${meetingId}/leave-log`)
        .set('x-tenant-id', tenantId)
        .send({ email });

      expect(resLeave.status).toBe(200);
      expect(resLeave.body.data.leftAt).toBeDefined();
      expect(resLeave.body.data.durationMinutes).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. REMINDERS & RECORDING ARCHIVES
  // ─────────────────────────────────────────────────────────────
  describe('Reminders & Recording Archives', () => {
    it('should support setting meeting reminders', async () => {
      const res = await request(app)
        .post(`/api/meetings/${meetingId}/reminders`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sendBeforeMinutes: 10 });

      expect(res.status).toBe(201);
      expect(res.body.data.sendBeforeMinutes).toBe(10);
      expect(res.body.data.status).toBe('pending');

      reminderId = res.body.data.id;
    });

    it('should allow triggering reminders', async () => {
      const res = await request(app)
        .post(`/api/meetings/reminders/${reminderId}/trigger`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('sent');
      expect(res.body.data.sentAt).toBeDefined();
    });

    it('should end the meeting and archive recording in media library', async () => {
      const recUrl = 'https://s3.amazonaws.com/grace-meet/bible-study-rec.mp4';

      const res = await request(app)
        .post(`/api/meetings/${meetingId}/end`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ recordingUrl: recUrl });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ended');
      expect(res.body.data.recordingUrl).toBe(recUrl);

      // Verify that the media asset was automatically created in the DB
      const asset = await prisma.mediaAsset.findFirst({
        where: { sourceUrl: recUrl, tenantId },
      });
      expect(asset).toBeDefined();
      expect(asset!.title).toBe('Recording: Tuesday Midweek Bible Study');
      expect(asset!.type).toBe('video');
    });
  });
});
