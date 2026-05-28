import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Media Module', () => {
  let tenantId: string;
  let adminToken: string;

  // Reusable entity IDs populated during tests
  let categoryId: string;
  let childCategoryId: string;
  let tagFaithId: string;
  let tagGraceId: string;
  let tagPrayerId: string;
  let speakerId: string;
  let seriesId: string;
  let platformAssetId: string;
  let youtubeAssetId: string;
  let audioAssetId: string;
  let playlistId: string;

  beforeAll(async () => {
    // 1. Clean up media tables
    await prisma.mediaPlaylistItem.deleteMany({});
    await prisma.mediaPlaylist.deleteMany({});
    await prisma.mediaAssetTag.deleteMany({});
    await prisma.mediaAsset.deleteMany({});
    await prisma.mediaSeries.deleteMany({});
    await prisma.speaker.deleteMany({});
    await prisma.mediaTag.deleteMany({});
    await prisma.mediaCategory.deleteMany({});

    // 2. Clean up auth tables
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 3. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Media Test Church', subdomain: 'media-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 4. Create Admin Role & Permissions
    const permissions = await prisma.permission.findMany({
      where: { name: { in: ['member.create', 'member.read', 'tenant.settings'] } },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // 5. Create Admin User
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@media-test.com', passwordHash: passHash },
    });

    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    await prisma.member.create({
      data: {
        tenantId,
        userId: adminUser.id,
        firstName: 'Media',
        lastName: 'Admin',
        membershipStatus: 'leader',
      },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. CATEGORY CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Categories', () => {
    it('should create a parent category', async () => {
      const res = await request(app)
        .post('/api/media/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Sunday Messages' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Sunday Messages');
      expect(res.body.data.slug).toBe('sunday-messages');
      categoryId = res.body.data.id;
    });

    it('should create a nested child category', async () => {
      const res = await request(app)
        .post('/api/media/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Youth Camp', parentId: categoryId });

      expect(res.status).toBe(201);
      expect(res.body.data.parentId).toBe(categoryId);
      childCategoryId = res.body.data.id;
    });

    it('should list categories with children', async () => {
      const res = await request(app)
        .get('/api/media/categories')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);

      const parent = res.body.data.find((c: any) => c.id === categoryId);
      expect(parent.children.length).toBe(1);
      expect(parent.children[0].id).toBe(childCategoryId);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. TAG CRUD
  // ─────────────────────────────────────────────────────────────
  describe('Tags', () => {
    it('should create multiple tags', async () => {
      const resFaith = await request(app)
        .post('/api/media/tags')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Faith' });
      expect(resFaith.status).toBe(201);
      tagFaithId = resFaith.body.data.id;

      const resGrace = await request(app)
        .post('/api/media/tags')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Grace' });
      expect(resGrace.status).toBe(201);
      tagGraceId = resGrace.body.data.id;

      const resPrayer = await request(app)
        .post('/api/media/tags')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Prayer' });
      expect(resPrayer.status).toBe(201);
      tagPrayerId = resPrayer.body.data.id;
    });

    it('should list tags for tenant', async () => {
      const res = await request(app)
        .get('/api/media/tags')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. SPEAKER MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  describe('Speakers', () => {
    it('should create a speaker with photo and bio', async () => {
      const res = await request(app)
        .post('/api/media/speakers')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Pastor David',
          title: 'Senior Pastor',
          bio: 'Founding pastor of Grace Community Church.',
          photoUrl: 'https://cdn.church.com/pastors/david.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Pastor David');
      expect(res.body.data.title).toBe('Senior Pastor');
      speakerId = res.body.data.id;
    });

    it('should update speaker profile', async () => {
      const res = await request(app)
        .put(`/api/media/speakers/${speakerId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ bio: 'Senior pastor for 15 years at Grace Community Church.' });

      expect(res.status).toBe(200);
      expect(res.body.data.bio).toContain('15 years');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. SERIES MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  describe('Series', () => {
    it('should create a series with cover image', async () => {
      const res = await request(app)
        .post('/api/media/series')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Walking in Faith',
          description: 'A 4-part sermon series on faith foundations.',
          coverImageUrl: 'https://cdn.church.com/series/faith-cover.jpg',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Walking in Faith');
      expect(res.body.data.coverImageUrl).toBeTruthy();
      seriesId = res.body.data.id;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. ASSET REGISTRATION (Platform-managed)
  // ─────────────────────────────────────────────────────────────
  describe('Asset Registration', () => {
    it('should create a platform-managed video asset', async () => {
      const res = await request(app)
        .post('/api/media/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Sunday Sermon: Walking in Faith Part 1',
          description: 'The first message in the Walking in Faith series.',
          type: 'video',
          providerType: 'platform_managed',
          sourceUrl: 'https://cdn.churchos.io/media/sermon-001.mp4',
          thumbnailUrl: 'https://cdn.churchos.io/thumbs/sermon-001.jpg',
          durationSeconds: 2700,
          fileSizeBytes: 524288000,
          mimeType: 'video/mp4',
          categoryId,
          seriesId,
          seriesOrder: 1,
          speakerId,
          visibility: 'public',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.providerType).toBe('platform_managed');
      expect(res.body.data.status).toBe('published');
      expect(res.body.data.publishedAt).toBeTruthy();
      expect(res.body.data.category.id).toBe(categoryId);
      expect(res.body.data.series.id).toBe(seriesId);
      expect(res.body.data.speaker.id).toBe(speakerId);
      platformAssetId = res.body.data.id;
    });

    // 6. ASSET REGISTRATION (External Link — YouTube)
    it('should create an external YouTube video asset', async () => {
      const res = await request(app)
        .post('/api/media/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Special Guest Message',
          type: 'video',
          providerType: 'external_link',
          providerKey: 'youtube',
          sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          speakerId,
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.providerType).toBe('external_link');
      expect(res.body.data.providerKey).toBe('youtube');
      youtubeAssetId = res.body.data.id;
    });

    it('should create an audio asset', async () => {
      const res = await request(app)
        .post('/api/media/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Worship Track: Amazing Grace',
          type: 'audio',
          providerType: 'platform_managed',
          sourceUrl: 'https://cdn.churchos.io/media/worship-001.mp3',
          durationSeconds: 240,
          mimeType: 'audio/mpeg',
          categoryId: childCategoryId,
          status: 'published',
        });

      expect(res.status).toBe(201);
      audioAssetId = res.body.data.id;
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 7. ASSET FILTERING
  // ─────────────────────────────────────────────────────────────
  describe('Asset Filtering', () => {
    it('should filter assets by categoryId', async () => {
      const res = await request(app)
        .get(`/api/media/assets?categoryId=${categoryId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(platformAssetId);
    });

    it('should filter assets by speakerId', async () => {
      const res = await request(app)
        .get(`/api/media/assets?speakerId=${speakerId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      // Both the platform-managed and YouTube assets have the same speaker
      expect(res.body.data.length).toBe(2);
    });

    it('should filter assets by type', async () => {
      const res = await request(app)
        .get('/api/media/assets?type=audio')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('audio');
    });

    it('should search assets by title', async () => {
      const res = await request(app)
        .get('/api/media/assets?search=Walking')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toContain('Walking');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 8. TAGGING
  // ─────────────────────────────────────────────────────────────
  describe('Tagging', () => {
    it('should tag an asset with multiple tags', async () => {
      const res = await request(app)
        .post(`/api/media/assets/${platformAssetId}/tags`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ tagIds: [tagFaithId, tagGraceId] });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should verify tags appear on asset detail', async () => {
      const res = await request(app)
        .get(`/api/media/assets/${platformAssetId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const tagNames = res.body.data.assetTags.map((at: any) => at.tag.name);
      expect(tagNames).toContain('Faith');
      expect(tagNames).toContain('Grace');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 9. PLAYLIST MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  describe('Playlists', () => {
    it('should create a playlist', async () => {
      const res = await request(app)
        .post('/api/media/playlists')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Best of 2026',
          description: 'Top sermons from 2026.',
          isPublic: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Best of 2026');
      playlistId = res.body.data.id;
    });

    it('should add 3 assets to playlist with explicit ordering', async () => {
      await request(app)
        .post(`/api/media/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetId: audioAssetId, order: 3 });

      await request(app)
        .post(`/api/media/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetId: platformAssetId, order: 1 });

      await request(app)
        .post(`/api/media/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ assetId: youtubeAssetId, order: 2 });
    });

    it('should retrieve playlist items in correct order', async () => {
      const res = await request(app)
        .get(`/api/media/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      // Ordered: platformAsset (1), youtubeAsset (2), audioAsset (3)
      expect(res.body.data[0].asset.id).toBe(platformAssetId);
      expect(res.body.data[1].asset.id).toBe(youtubeAssetId);
      expect(res.body.data[2].asset.id).toBe(audioAssetId);
    });

    it('should remove an item from playlist', async () => {
      const delRes = await request(app)
        .delete(`/api/media/playlists/${playlistId}/items/${audioAssetId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);

      const res = await request(app)
        .get(`/api/media/playlists/${playlistId}/items`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.length).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 10. EMBED GENERATION
  // ─────────────────────────────────────────────────────────────
  describe('Embed Code', () => {
    it('should generate YouTube embed iframe for external link asset', async () => {
      const res = await request(app)
        .get(`/api/media/assets/${youtubeAssetId}/embed`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.embedHtml).toContain('<iframe');
      expect(res.body.data.embedHtml).toContain('youtube.com/embed/dQw4w9WgXcQ');
    });

    it('should generate platform embed for platform-managed asset', async () => {
      const res = await request(app)
        .get(`/api/media/assets/${platformAssetId}/embed`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.embedHtml).toContain('<iframe');
      expect(res.body.data.embedHtml).toContain(`/embed/media/${platformAssetId}`);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 11. VISIBILITY SCOPING
  // ─────────────────────────────────────────────────────────────
  describe('Visibility', () => {
    it('should create a members_only asset and verify visibility flag', async () => {
      const res = await request(app)
        .post('/api/media/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Leaders Only Prayer Guide',
          type: 'document',
          providerType: 'platform_managed',
          sourceUrl: 'https://cdn.churchos.io/docs/prayer-guide.pdf',
          mimeType: 'application/pdf',
          visibility: 'members_only',
          status: 'published',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.visibility).toBe('members_only');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 12. ASSET ARCHIVAL (soft-delete)
  // ─────────────────────────────────────────────────────────────
  describe('Archival', () => {
    it('should soft-delete an asset by setting status to archived', async () => {
      const delRes = await request(app)
        .delete(`/api/media/assets/${audioAssetId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(delRes.status).toBe(200);
      expect(delRes.body.data.status).toBe('archived');

      // Verify via detail endpoint
      const getRes = await request(app)
        .get(`/api/media/assets/${audioAssetId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.status).toBe('archived');
    });
  });
});
