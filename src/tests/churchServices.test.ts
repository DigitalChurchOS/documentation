import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Church Services Module', () => {
  let tenantId: string;
  let adminToken: string;

  let speakerId: string;
  let sermonMediaId: string;
  let audioMediaId: string;
  let livestreamId: string;
  let sundayServiceId: string;
  let midweekServiceId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.serviceAttachment.deleteMany({});
    await prisma.serviceScripture.deleteMany({});
    await prisma.churchService.deleteMany({});
    await prisma.livestream.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.speaker.deleteMany({});

    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Services Church', subdomain: 'services-test', status: 'active' },
    });
    tenantId = tenant.id;

    // Create Admin Role & Permissions
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.create', 'member.read', 'tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@services-test.com', passwordHash: passHash },
    });

    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Service',
        lastName: 'Admin',
        membershipStatus: 'leader',
      },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );

    // Create supporting entities
    const speaker = await prisma.speaker.create({
      data: { tenantId, name: 'Pastor Grace', title: 'Lead Pastor' },
    });
    speakerId = speaker.id;

    const sermonMedia = await prisma.mediaAsset.create({
      data: {
        tenantId,
        title: 'Sunday Sermon Video',
        type: 'video',
        providerType: 'platform_managed',
        sourceUrl: 'https://cdn.church.com/sermons/sunday-001.mp4',
        status: 'published',
      },
    });
    sermonMediaId = sermonMedia.id;

    const audioMedia = await prisma.mediaAsset.create({
      data: {
        tenantId,
        title: 'Sunday Sermon Audio',
        type: 'audio',
        providerType: 'platform_managed',
        sourceUrl: 'https://cdn.church.com/sermons/sunday-001.mp3',
        mimeType: 'audio/mpeg',
        status: 'published',
      },
    });
    audioMediaId = audioMedia.id;

    const livestream = await prisma.livestream.create({
      data: {
        tenantId,
        title: 'Sunday Live',
        status: 'ended',
        startedAt: new Date('2026-06-01T10:00:00Z'),
        endedAt: new Date('2026-06-01T12:00:00Z'),
      },
    });
    livestreamId = livestream.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. CREATE SUNDAY SERVICE
  // ─────────────────────────────────────────────────────────────
  describe('Create Sunday Service', () => {
    it('should create a sunday service with speaker and thumbnail', async () => {
      const res = await request(app)
        .post('/api/church-services')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sunday Morning Service - 2026-06-01',
          serviceType: 'sunday',
          serviceDate: '2026-06-01T10:00:00Z',
          description: 'Regular Sunday morning worship service.',
          notes: 'Topic: Walking in Faith. Key Points: 1) Trust God 2) Step out in faith 3) Stand firm.',
          thumbnailUrl: 'https://cdn.church.com/thumbs/sunday-june-01.jpg',
          speakerId,
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.serviceType).toBe('sunday');
      expect(res.body.data.speaker.name).toBe('Pastor Grace');
      expect(res.body.data.status).toBe('published');
      sundayServiceId = res.body.data.id;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. CREATE MIDWEEK SERVICE
  // ─────────────────────────────────────────────────────────────
  describe('Create Midweek Service', () => {
    it('should create a midweek service with different type', async () => {
      const res = await request(app)
        .post('/api/church-services')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Wednesday Bible Study',
          serviceType: 'midweek',
          serviceDate: '2026-06-04T19:00:00Z',
          description: 'Midweek Bible study and prayer.',
          speakerId,
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.serviceType).toBe('midweek');
      midweekServiceId = res.body.data.id;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. FILTER BY TYPE
  // ─────────────────────────────────────────────────────────────
  describe('Filter by Type', () => {
    it('should list only sunday services', async () => {
      const res = await request(app)
        .get('/api/church-services?serviceType=sunday')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].serviceType).toBe('sunday');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. FILTER BY DATE RANGE
  // ─────────────────────────────────────────────────────────────
  describe('Filter by Date Range', () => {
    it('should filter services within a date range', async () => {
      const res = await request(app)
        .get('/api/church-services?dateFrom=2026-06-01&dateTo=2026-06-03')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(sundayServiceId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. SORT ASCENDING / DESCENDING
  // ─────────────────────────────────────────────────────────────
  describe('Sort Order', () => {
    it('should sort services ascending by date', async () => {
      const res = await request(app)
        .get('/api/church-services?sortOrder=asc')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      // Sunday (June 1) before midweek (June 4) in ascending order
      expect(res.body.data[0].id).toBe(sundayServiceId);
      expect(res.body.data[1].id).toBe(midweekServiceId);
    });

    it('should sort services descending by date', async () => {
      const res = await request(app)
        .get('/api/church-services?sortOrder=desc')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // Midweek (June 4) before Sunday (June 1) in descending order
      expect(res.body.data[0].id).toBe(midweekServiceId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. SEARCH BY TITLE
  // ─────────────────────────────────────────────────────────────
  describe('Search by Title', () => {
    it('should search services by title keyword', async () => {
      const res = await request(app)
        .get('/api/church-services?search=Bible')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toContain('Bible');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. GENERATE RECURRING SERVICES
  // ─────────────────────────────────────────────────────────────
  describe('Recurring Services', () => {
    it('should generate 4 weekly sunday services', async () => {
      const res = await request(app)
        .post('/api/church-services/recurring')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          serviceType: 'sunday',
          titleTemplate: 'Sunday Morning Service',
          dayOfWeek: 0, // Sunday
          startDate: '2026-07-01',
          count: 4,
          speakerId,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.length).toBe(4);
      // All should be draft status
      expect(res.body.data[0].status).toBe('draft');
      expect(res.body.data[0].serviceType).toBe('sunday');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. ATTACH SERMON MEDIA
  // ─────────────────────────────────────────────────────────────
  describe('Attach Sermon Media', () => {
    it('should link a MediaAsset as sermon video', async () => {
      const res = await request(app)
        .put(`/api/church-services/${sundayServiceId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ sermonMediaId });

      expect(res.status).toBe(200);
      expect(res.body.data.sermonMedia).toBeTruthy();
      expect(res.body.data.sermonMedia.title).toBe('Sunday Sermon Video');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 9. ATTACH LIVESTREAM
  // ─────────────────────────────────────────────────────────────
  describe('Attach Livestream', () => {
    it('should link a Livestream to the service', async () => {
      const res = await request(app)
        .put(`/api/church-services/${sundayServiceId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ livestreamId, serviceAudioId: audioMediaId });

      expect(res.status).toBe(200);
      expect(res.body.data.livestream).toBeTruthy();
      expect(res.body.data.serviceAudio).toBeTruthy();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 10 & 11. SCRIPTURE REFERENCES
  // ─────────────────────────────────────────────────────────────
  describe('Scripture References', () => {
    it('should add scripture references to a service', async () => {
      const res = await request(app)
        .post(`/api/church-services/${sundayServiceId}/scriptures`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          references: [
            { reference: 'Hebrews 11:1', order: 1 },
            { reference: 'Romans 8:28', order: 2 },
            { reference: 'John 3:16', order: 3 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.length).toBe(3);
    });

    it('should retrieve scriptures in order', async () => {
      const res = await request(app)
        .get(`/api/church-services/${sundayServiceId}/scriptures`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].reference).toBe('Hebrews 11:1');
      expect(res.body.data[2].reference).toBe('John 3:16');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 12. ADD ATTACHMENT
  // ─────────────────────────────────────────────────────────────
  describe('Attachments', () => {
    it('should add a bulletin PDF attachment', async () => {
      const res = await request(app)
        .post(`/api/church-services/${sundayServiceId}/attachments`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sunday Bulletin - June 1',
          fileUrl: 'https://cdn.church.com/bulletins/june-01.pdf',
          fileType: 'pdf',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Sunday Bulletin - June 1');
      expect(res.body.data.fileType).toBe('pdf');
    });

    it('should retrieve attachments', async () => {
      const res = await request(app)
        .get(`/api/church-services/${sundayServiceId}/attachments`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 13. UPDATE ATTENDANCE / GIVING / SALVATION
  // ─────────────────────────────────────────────────────────────
  describe('Attendance & Giving', () => {
    it('should update attendance, giving total, and salvation count', async () => {
      const res = await request(app)
        .put(`/api/church-services/${sundayServiceId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          attendanceCount: 350,
          givingTotal: 12500.75,
          salvationCount: 3,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.attendanceCount).toBe(350);
      expect(res.body.data.givingTotal).toBe(12500.75);
      expect(res.body.data.salvationCount).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 14. SPEAKER ASSIGNMENT
  // ─────────────────────────────────────────────────────────────
  describe('Speaker Assignment', () => {
    it('should verify speaker relation on service detail', async () => {
      const res = await request(app)
        .get(`/api/church-services/${sundayServiceId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.speaker).toBeTruthy();
      expect(res.body.data.speaker.name).toBe('Pastor Grace');
      expect(res.body.data.speaker.title).toBe('Lead Pastor');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 15. SERVICE ARCHIVE (published filter)
  // ─────────────────────────────────────────────────────────────
  describe('Service Archive', () => {
    it('should filter published services for the archive', async () => {
      const res = await request(app)
        .get('/api/church-services?status=published')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // Only 2 manually published services (recurring ones are draft)
      expect(res.body.data.length).toBe(2);
      res.body.data.forEach((s: any) => {
        expect(s.status).toBe('published');
      });
    });
  });
});
