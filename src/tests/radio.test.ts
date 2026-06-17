import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Radio Broadcasting Module', () => {
  let tenantId: string;
  let adminToken: string;
  let memberToken: string;
  let guestToken: string;

  let stationId: string;
  let programId: string;
  let scheduleId: string;
  let playlistId: string;
  let playlistItemId: string;
  let archiveId: string;

  beforeAll(async () => {
    // 1. Clean up database tables
    await prisma.radioReaction.deleteMany({});
    await prisma.radioChatMessage.deleteMany({});
    await prisma.radioBroadcastArchive.deleteMany({});
    await prisma.radioPlaylistItem.deleteMany({});
    await prisma.radioPlaylist.deleteMany({});
    await prisma.radioSchedule.deleteMany({});
    await prisma.radioProgram.deleteMany({});
    await prisma.radioStation.deleteMany({});
    await prisma.podcastEpisode.deleteMany({});
    await prisma.podcastShow.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Radio Test Church', subdomain: 'radio-test', status: 'active' },
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
      data: { tenantId, email: 'admin@radio-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });
    adminToken = jwt.sign({ userId: adminUser.id, tenantId, email: adminUser.email }, JWT_SECRET);

    // 5. Create Member User
    const memberUser = await prisma.user.create({
      data: { tenantId, email: 'member@radio-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: memberUser.id, roleId: memberRole.id },
    });
    await prisma.member.create({
      data: {
        tenantId,
        userId: memberUser.id,
        firstName: 'Radio',
        lastName: 'Member',
        membershipStatus: 'member',
      },
    });
    memberToken = jwt.sign({ userId: memberUser.id, tenantId, email: memberUser.email }, JWT_SECRET);

    // 6. Create Guest User (authenticated but no roles)
    const guestUser = await prisma.user.create({
      data: { tenantId, email: 'guest@radio-test.com', passwordHash: passHash },
    });
    guestToken = jwt.sign({ userId: guestUser.id, tenantId, email: guestUser.email }, JWT_SECRET);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Station Creation & Branding CRUD', () => {
    it('should allow admin to create a new radio station', async () => {
      const res = await request(app)
        .post('/api/radio/stations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Praise FM',
          slogan: 'Continuous Grace Streams',
          description: 'A 24/7 digital broadcasting portal for prayer and devotionals.',
          streamingType: 'MANAGED',
          streamFormat: 'Icecast',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.name).toBe('Praise FM');
      stationId = res.body.data.id;
    });

    it('should refuse guest or member to create a radio station', async () => {
      const res = await request(app)
        .post('/api/radio/stations')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: 'Member FM' });

      expect(res.status).toBe(403);
    });

    it('should return list of stations for public listeners', async () => {
      const res = await request(app)
        .get('/api/radio/stations')
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Praise FM');
    });

    it('should allow admin to update station branding configurations', async () => {
      const res = await request(app)
        .put(`/api/radio/stations/${stationId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          slogan: 'Your Daily Spiritual Connection',
          coverImageUrl: 'https://images.unsplash.com/photo-test',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.slogan).toBe('Your Daily Spiritual Connection');
      expect(res.body.data.coverImageUrl).toBe('https://images.unsplash.com/photo-test');
    });
  });

  describe('Program Scheduling Control', () => {
    it('should allow admin to create a program profile', async () => {
      const res = await request(app)
        .post(`/api/radio/stations/${stationId}/programs`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Morning Prayer Devotional',
          speaker: 'Pastor Chris Oyakhilome',
          category: 'Prayer',
          description: 'A morning session starting the day in grace and power.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Morning Prayer Devotional');
      programId = res.body.data.id;
    });

    it('should allow admin to schedule the program slot', async () => {
      const start = new Date(Date.now() + 2 * 3600 * 1000);
      const end = new Date(Date.now() + 3 * 3600 * 1000);

      const res = await request(app)
        .post(`/api/radio/programs/${programId}/schedules`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startTime: start.toISOString(),
          endTime: end.toISOString(),
          recurrence: 'daily',
          daysOfWeek: 'daily',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.startTime).toBeDefined();
      scheduleId = res.body.data.id;
    });

    it('should return schedules under public listings', async () => {
      const res = await request(app)
        .get(`/api/radio/stations/${stationId}/schedules`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].programId).toBe(programId);
    });
  });

  describe('Auto DJ Rotation Configuration', () => {
    it('should create an Auto DJ playlist', async () => {
      const res = await request(app)
        .post(`/api/radio/stations/${stationId}/playlists`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Main Rotation Playlist',
          description: 'Offline continuous rotation tracks.',
          isAutoDj: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Main Rotation Playlist');
      playlistId = res.body.data.id;
    });

    it('should add a custom audio track to playlist', async () => {
      const res = await request(app)
        .post(`/api/radio/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Divine Grace Worship Track',
          audioUrl: 'https://assets.churched.online/music/divine-grace.mp3',
          durationSeconds: 300,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Divine Grace Worship Track');
      playlistItemId = res.body.data.id;
    });

    it('should return playlists inside admin listings', async () => {
      const res = await request(app)
        .get(`/api/radio/stations/${stationId}/playlists`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].items.length).toBe(1);
    });
  });

  describe('Live Broadcasting & Stream State', () => {
    it('should allow admin to start a live broadcast', async () => {
      const res = await request(app)
        .post(`/api/radio/stations/${stationId}/go-live`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('live');
    });

    it('should reflect LIVE status on now-playing endpoint', async () => {
      const res = await request(app)
        .get(`/api/radio/stations/${stationId}/now-playing`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('live');
      expect(res.body.data.currentProgram.title).toBe('Live Radio Broadcast');
    });

    it('should allow admin to stop the live stream and save archive log', async () => {
      const res = await request(app)
        .post(`/api/radio/stations/${stationId}/stop-live`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('offline');

      // Check that an archive was created
      const archRes = await prisma.radioBroadcastArchive.findFirst({
        where: { stationId },
      });
      expect(archRes).not.toBeNull();
      expect(archRes?.title).toContain('Live Broadcast');
      archiveId = archRes!.id;
    });
  });

  describe('Now Playing Simulation & Auto DJ Synchronization', () => {
    it('should compute playheads offsets based on timestamp when status is OFFLINE', async () => {
      const res = await request(app)
        .get(`/api/radio/stations/${stationId}/now-playing`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('automated');
      expect(res.body.data.nowPlayingTrack.audioUrl).toBe('https://assets.churched.online/music/divine-grace.mp3');
      expect(res.body.data.nowPlayingTrack.offsetSeconds).toBeLessThanOrEqual(300);
      expect(res.body.data.nowPlayingTrack.durationSeconds).toBe(300);
    });
  });

  describe('Live Engagement Chat & Reactions', () => {
    it('should allow posting public chat messages', async () => {
      const res = await request(app)
        .post(`/api/radio/stations/${stationId}/chat`)
        .set('x-tenant-id', tenantId)
        .send({
          displayName: 'Guest Listener',
          message: 'Praise the Lord! Amen.',
        })
        .set('X-Tenant-Id', tenantId);

      expect(res.status).toBe(201);
      expect(res.body.data.displayName).toBe('Guest Listener');
      expect(res.body.data.message).toBe('Praise the Lord! Amen.');
    });

    it('should return recent messages for public listeners', async () => {
      const res = await request(app)
        .get(`/api/radio/stations/${stationId}/chat`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].message).toBe('Praise the Lord! Amen.');
    });

    it('should register reaction clicks', async () => {
      const reactRes = await request(app)
        .post(`/api/radio/stations/${stationId}/react`)
        .set('x-tenant-id', tenantId)
        .send({ reactionType: 'amen' });

      expect(reactRes.status).toBe(201);

      const res = await request(app)
        .get(`/api/radio/stations/${stationId}/reactions`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.data.amen).toBe(1);
    });
  });

  describe('Podcast Syndication converter', () => {
    let podcastShowId: string;

    beforeAll(async () => {
      // Setup a podcast channel show first
      const show = await prisma.podcastShow.create({
        data: {
          tenantId,
          title: 'Daily Radio Devotions Podcast',
          description: 'Podcast feed for radio archives.',
          slug: 'daily-devotions-podcast',
          coverImageUrl: 'https://images.unsplash.com/photo-pod',
          copyright: 'Copyright 2026',
          author: 'Pastor Chris',
          category: 'Religion & Spirituality',
        },
      });
      podcastShowId = show.id;
    });

    it('should convert an archived live stream into a podcast episode', async () => {
      const res = await request(app)
        .post(`/api/radio/archives/${archiveId}/convert-to-podcast`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ showId: podcastShowId });

      expect(res.status).toBe(201);
      expect(res.body.data.showId).toBe(podcastShowId);
      expect(res.body.data.title).toBeDefined();

      // Verify relation is created
      const updatedArchive = await prisma.radioBroadcastArchive.findUnique({
        where: { id: archiveId },
      });
      expect(updatedArchive?.podcastEpisodeId).toBe(res.body.data.id);
    });
  });
});
