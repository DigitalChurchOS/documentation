import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS TV & Video Broadcasting Module', () => {
  jest.setTimeout(30000);
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let guestToken: string;

  let channelId: string;
  let programId: string;
  let scheduleId: string;
  let playlistId: string;
  let playlistItemId: string;
  let archiveId: string;
  let pollId: string;
  let lowerThirdId: string;

  beforeAll(async () => {
    // 1. Clean up database tables
    await prisma.tvPollResponse.deleteMany({});
    await prisma.tvPoll.deleteMany({});
    await prisma.tvLowerThird.deleteMany({});
    await prisma.tvReaction.deleteMany({});
    await prisma.tvChatMessage.deleteMany({});
    await prisma.tvBroadcastArchive.deleteMany({});
    await prisma.tvPlaylistItem.deleteMany({});
    await prisma.tvPlaylist.deleteMany({});
    await prisma.tvSchedule.deleteMany({});
    await prisma.tvProgram.deleteMany({});
    await prisma.tvChannel.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'TV Test Church', subdomain: 'tv-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Setup permissions & roles
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.read', 'tenant.settings'] } },
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
    const memberReadPerm = permissions.find((p) => p.name === 'member.read');
    if (memberReadPerm) {
      await prisma.rolePermission.create({
        data: { roleId: memberRole.id, permissionId: memberReadPerm.id },
      });
    }

    const passHash = await bcrypt.hash('password123', 12);

    // 4. Create Admin User
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@tv-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 5. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@tv-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    await prisma.member.create({
      data: {
        tenantId,
        userId: memberUser.id,
        firstName: 'TV',
        lastName: 'Member',
        membershipStatus: 'member',
      },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // 6. Create Guest User (authenticated but no roles)
    const guestUser = await prisma.user.create({
      data: { tenantId, email: 'guest@tv-test.com', passwordHash: passHash },
    });
    guestToken = jwt.sign({ userId: guestUser.id, tenantId, email: guestUser.email }, JWT_SECRET);

    // 7. Setup AI provider (OpenAI)
    await request(app)
      .post('/api/services')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        providerId: 'openai',
        credentials: { apiKey: 'sk-mock-openai-key-12345' },
        providerMode: 'bring_your_own',
        isActive: true,
      });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Channel Management & Branding CRUD', () => {
    it('should allow admin to create a new TV channel', async () => {
      const res = await request(app)
        .post('/api/tv/channels')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Faith TV',
          slogan: 'Continuous Grace Broadcasts',
          description: 'A 24/7 digital broadcasting network for church services and seminars.',
          streamType: 'managed',
          streamUrl: 'https://assets.mixkit.co/videos/preview/mixkit-worship-team-singing-in-church-41793-large.mp4',
          isAutoProgrammingEnabled: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Faith TV');
      expect(res.body.data.slug).toBe('faith-tv');
      channelId = res.body.data.id;
    });

    it('should refuse guest or member to create a TV channel', async () => {
      const res = await request(app)
        .post('/api/tv/channels')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Member TV' });

      expect(res.status).toBe(403);
    });

    it('should list all channels for a tenant publicly without auth', async () => {
      const res = await request(app)
        .get('/api/tv/channels')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should allow updating a channel profile by admin', async () => {
      const res = await request(app)
        .put(`/api/tv/channels/${channelId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ slogan: 'Uplifting Truth in High Definition' });

      expect(res.status).toBe(200);
      expect(res.body.data.slogan).toBe('Uplifting Truth in High Definition');
    });
  });

  describe('EPG Guides & Programs CRUD', () => {
    it('should allow admin to create a television program', async () => {
      const res = await request(app)
        .post(`/api/tv/channels/${channelId}/programs`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Morning Glory Devotion',
          description: 'Start your mornings with high-energy praise.',
          speaker: 'Pastor Paul',
          category: 'Prayer',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Morning Glory Devotion');
      programId = res.body.data.id;
    });

    it('should allow admin to attach a schedule to a program', async () => {
      const start = new Date();
      start.setHours(start.getHours() + 1);
      const end = new Date();
      end.setHours(end.getHours() + 2);

      const res = await request(app)
        .post(`/api/tv/programs/${programId}/schedules`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          recurrence: 'daily',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.recurrence).toBe('daily');
      scheduleId = res.body.data.id;
    });

    it('should retrieve schedules publicly', async () => {
      const res = await request(app)
        .get(`/api/tv/channels/${channelId}/schedules`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Auto-Programming Playlists', () => {
    it('should allow admin to create an Auto-Programming playlist', async () => {
      const res = await request(app)
        .post(`/api/tv/channels/${channelId}/playlists`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Main Video Feed Loop',
          isAutoProgramming: true,
          rotationRule: 'sequential',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.isAutoProgramming).toBe(true);
      playlistId = res.body.data.id;
    });

    it('should allow adding video tracks/items to playlist', async () => {
      const res = await request(app)
        .post(`/api/tv/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Worship Session Clip 1',
          videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-musicians-performing-at-a-church-service-41794-large.mp4',
          durationSeconds: 240,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Worship Session Clip 1');
      playlistItemId = res.body.data.id;
    });

    it('should list channel playlists', async () => {
      const res = await request(app)
        .get(`/api/tv/channels/${channelId}/playlists`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  describe('Live Broadcast Manual Override & Replay Archives', () => {
    it('should allow admin to toggle live manual takeover', async () => {
      const res = await request(app)
        .post(`/api/tv/channels/${channelId}/go-live`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('live');
    });

    it('should calculate now playing as live manual takeover', async () => {
      const res = await request(app)
        .get(`/api/tv/channels/${channelId}/now-playing`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('live');
      expect(res.body.data.currentProgram.title).toBe('Live TV Broadcast');
    });

    it('should stop live manual takeover and write archive log', async () => {
      const res = await request(app)
        .post(`/api/tv/channels/${channelId}/stop-live`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('offline');

      const arch = await prisma.tvBroadcastArchive.findFirst({
        where: { channelId, tenantId },
      });
      expect(arch).toBeTruthy();
      archiveId = arch!.id;
    });
  });

  describe('Interactive Overlays, Chats, reactions & Polls', () => {
    it('should allow anyone to post a message in live chat with country flag', async () => {
      const res = await request(app)
        .post(`/api/tv/channels/${channelId}/chat`)
        .set('x-tenant-id', tenantId)
        .send({
          displayName: 'Sister Mary',
          message: 'Hallelujah, amen!',
          countryCode: 'UG',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.displayName).toBe('Sister Mary');
      expect(res.body.data.countryCode).toBe('UG');
    });

    it('should retrieve recent chat messages', async () => {
      const res = await request(app)
        .get(`/api/tv/channels/${channelId}/chat`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should allow posting reactions', async () => {
      const res = await request(app)
        .post(`/api/tv/channels/${channelId}/react`)
        .set('x-tenant-id', tenantId)
        .send({ reactionType: 'fire' });

      expect(res.status).toBe(201);
    });

    it('should aggregate reactions tallies', async () => {
      const res = await request(app)
        .get(`/api/tv/channels/${channelId}/reactions`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.fire).toBeGreaterThan(0);
    });

    it('should allow admin to create a poll', async () => {
      const res = await request(app)
        .post(`/api/tv/channels/${channelId}/polls`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          question: 'Are you watching from home?',
          options: ['Yes', 'No', 'In Transit'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.question).toBe('Are you watching from home?');
      pollId = res.body.data.id;
    });

    it('should allow voting on active poll', async () => {
      const res = await request(app)
        .post(`/api/tv/polls/${pollId}/vote`)
        .set('x-tenant-id', tenantId)
        .send({ option: 'Yes' });

      expect(res.status).toBe(201);
    });

    it('should allow admin to schedule interactive lower thirds', async () => {
      const start = new Date();
      start.setMinutes(start.getMinutes() - 10);
      const end = new Date();
      end.setHours(end.getHours() + 1);

      const res = await request(app)
        .post(`/api/tv/channels/${channelId}/lower-thirds`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'salvation',
          title: 'Ready to receive Christ?',
          subtitle: 'Click below to make your decision.',
          buttonText: 'Make Decision',
          actionUrl: 'https://decision.example.com',
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          position: 'bottom-left',
        });

      expect(res.status).toBe(201);
      lowerThirdId = res.body.data.id;
    });

    it('should fetch active lower-thirds for current view playhead', async () => {
      const res = await request(app)
        .get(`/api/tv/channels/${channelId}/lower-thirds`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].title).toBe('Ready to receive Christ?');
    });

    it('should trigger an AI Media Job for a TV archive and process it successfully', async () => {
      const res = await request(app)
        .post(`/api/tv/archives/${archiveId}/ai-job`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          jobType: 'summary',
          transcript: 'This is a sermon on grace and mercy in digital ministries.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('completed');
      expect(res.body.data.summary).toBeTruthy();
    });
  });
});
