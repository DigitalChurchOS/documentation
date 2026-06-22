import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Developer Marketplace Module', () => {
  let tenantId: string;
  let adminToken: string;
  let adminUserId: string;

  beforeAll(async () => {
    // 1. Clean up database records
    await prisma.sandboxTenant.deleteMany({});
    await prisma.assetPurchase.deleteMany({});
    await prisma.assetFeedback.deleteMany({});
    await prisma.submissionReview.deleteMany({});
    await prisma.assetSubmission.deleteMany({});
    await prisma.marketplaceAsset.deleteMany({});
    await prisma.developerProfile.deleteMany({});
    await prisma.tenantPlugin.deleteMany({});
    await prisma.pluginDefinition.deleteMany({});
    await prisma.page.deleteMany({});
    await prisma.website.deleteMany({});
    await prisma.theme.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Marketplace Test Church', subdomain: 'market-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create Admin Role & Permissions
    const permissions = await prisma.permission.findMany({
      where: {
        name: { in: ['member.create', 'member.read', 'tenant.settings'] },
      },
    });

    const adminRole = await prisma.role.create({
      data: { tenantId, name: 'Admin', isCustom: false },
    });

    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({ roleId: adminRole.id, permissionId: p.id })),
    });

    // 4. Create Admin User
    const passHash = await bcrypt.hash('password123', 12);
    const adminUser = await prisma.user.create({
      data: { tenantId, email: 'admin@market-test.com', passwordHash: passHash },
    });
    adminUserId = adminUser.id;

    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
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
  // 1. DEVELOPER REGISTRATION
  // ─────────────────────────────────────────────────────────────
  describe('Developer Registration', () => {
    it('should successfully register a developer profile for the user', async () => {
      const res = await request(app)
        .post('/api/marketplace/developer/register')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyName: 'Acme Devs',
          website: 'https://acme.org',
          payoutEmail: 'payouts@acme.org',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.companyName).toBe('Acme Devs');
      expect(res.body.data.status).toBe('active');
    });

    it('should fail if user tries to register developer profile again', async () => {
      const res = await request(app)
        .post('/api/marketplace/developer/register')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          companyName: 'Duplicate Acme Devs',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Developer profile already exists');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. SANDBOX PROVISIONING
  // ─────────────────────────────────────────────────────────────
  describe('Sandbox Provisioning', () => {
    it('should provision a sandbox tenant workspace for the developer', async () => {
      const res = await request(app)
        .post('/api/marketplace/developer/sandbox')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.tenant.subdomain).toContain('sandbox-dev-');
      expect(res.body.data.tenant.status).toBe('trialing');
      expect(res.body.data.sandbox.expiresAt).toBeDefined();

      const dbSandbox = await prisma.sandboxTenant.findUnique({
        where: { tenantId: res.body.data.tenant.id },
      });
      expect(dbSandbox).not.toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. ASSET SUBMISSION & REVIEW WORKFLOW (PLUGINS & THEMES)
  // ─────────────────────────────────────────────────────────────
  describe('Asset Submission & Review Workflow', () => {
    let pluginAssetId: string;
    let pluginSubmissionId: string;
    let themeAssetId: string;
    let themeSubmissionId: string;

    it('should allow developer to define a new draft plugin asset', async () => {
      const res = await request(app)
        .post('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'WhatsApp Notify Extra',
          description: 'Custom notifier integration',
          type: 'plugin',
          pricingType: 'paid',
          price: 15.0,
          assetConfig: {
            requiredPermissions: ['member.read'],
            requiredOsVersion: '1.0.0',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('WhatsApp Notify Extra');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.price).toBe(15.0);

      pluginAssetId = res.body.data.id;
    });

    it('should submit plugin version for review', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: '1.0.1',
          changelog: 'Initial release',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');
      expect(res.body.data.version).toBe('1.0.1');

      pluginSubmissionId = res.body.data.id;

      const asset = await prisma.marketplaceAsset.findUnique({
        where: { id: pluginAssetId },
      });
      expect(asset?.status).toBe('under_review');
    });

    it('should allow admin to review and approve plugin submission, creating global PluginDefinition', async () => {
      const res = await request(app)
        .post(`/api/marketplace/submissions/${pluginSubmissionId}/review`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'approved',
          notes: 'Meets quality standards',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.decision).toBe('approved');

      // Verify asset updated to approved
      const asset = await prisma.marketplaceAsset.findUnique({
        where: { id: pluginAssetId },
      });
      expect(asset?.status).toBe('approved');
      expect(asset?.version).toBe('1.0.1');

      // Verify PluginDefinition upserted
      const definition = await prisma.pluginDefinition.findUnique({
        where: { id: pluginAssetId },
      });
      expect(definition).not.toBeNull();
      expect(definition?.name).toBe('WhatsApp Notify Extra');
      expect(definition?.price).toBe(15.0);
    });

    it('should allow developer to define a new draft theme asset', async () => {
      const res = await request(app)
        .post('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Modern Grace Theme',
          description: 'A beautiful sleek dark theme template',
          type: 'theme',
          pricingType: 'paid',
          price: 9.99,
          assetConfig: {
            colors: { primary: '#1a1a1a', secondary: '#ffffff' },
            font: 'Outfit',
          },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Modern Grace Theme');
      expect(res.body.data.status).toBe('draft');
      expect(res.body.data.type).toBe('theme');
      expect(res.body.data.price).toBe(9.99);

      themeAssetId = res.body.data.id;
    });

    it('should submit theme version for review', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${themeAssetId}/submit`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          version: '1.0.0',
          changelog: 'First theme layout version',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('pending');

      themeSubmissionId = res.body.data.id;
    });

    it('should allow admin to approve theme submission, registering it as a global Theme template', async () => {
      const res = await request(app)
        .post(`/api/marketplace/submissions/${themeSubmissionId}/review`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'approved',
          notes: 'Theme layout approved',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.decision).toBe('approved');

      // Verify Theme upserted in global database (tenantId = null)
      const globalTheme = await prisma.theme.findUnique({
        where: { id: themeAssetId },
      });
      expect(globalTheme).not.toBeNull();
      expect(globalTheme?.tenantId).toBeNull();
      expect(globalTheme?.name).toBe('Modern Grace Theme');
      expect(JSON.parse(globalTheme?.settings || '{}').font).toBe('Outfit');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 4. STOREFRONT BROWSING
  // ─────────────────────────────────────────────────────────────
  describe('Storefront Listing', () => {
    it('should return approved assets in the marketplace browse feed', async () => {
      const res = await request(app)
        .get('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2); // WhatsApp Notify Extra + Modern Grace Theme
    });

    it('should return detailed info for a specific approved asset', async () => {
      const browse = await request(app)
        .get('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      const assetId = browse.body.data[0].id;

      const res = await request(app)
        .get(`/api/marketplace/assets/${assetId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.averageRating).toBe(5); // default
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 5. PURCHASE & REVENUE SHARE CALCULATIONS (THEMES & PLUGINS)
  // ─────────────────────────────────────────────────────────────
  describe('Purchase & Revenue Split', () => {
    let pluginAssetId: string;
    let themeAssetId: string;

    beforeAll(async () => {
      const browse = await request(app)
        .get('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      const plugin = browse.body.data.find((a: any) => a.type === 'plugin');
      const theme = browse.body.data.find((a: any) => a.type === 'theme');
      pluginAssetId = plugin.id;
      themeAssetId = theme.id;
    });

    it('should successfully purchase plugin asset, calculating 70/30 developer/platform split', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/purchase`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.amountPaid).toBe(15.0);
      expect(res.body.data.developerShare).toBe(10.5); // 15 * 0.70
      expect(res.body.data.platformShare).toBe(4.5);   // 15 * 0.30

      // Verify auto-installed in TenantPlugin
      const installed = await prisma.tenantPlugin.findUnique({
        where: {
          tenantId_pluginId: { tenantId, pluginId: pluginAssetId },
        },
      });
      expect(installed).not.toBeNull();
      expect(installed?.status).toBe('pending');
    });

    it('should successfully purchase theme asset, generating a tenant-scoped copy', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${themeAssetId}/purchase`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.amountPaid).toBe(9.99);
      expect(res.body.data.developerShare).toBe(6.99); // 9.99 * 0.70 rounded
      expect(res.body.data.platformShare).toBe(3.00);  // 9.99 * 0.30 rounded

      // Verify tenant-scoped Theme record is created
      const tenantTheme = await prisma.theme.findFirst({
        where: { tenantId, name: 'Modern Grace Theme' },
      });
      expect(tenantTheme).not.toBeNull();
      expect(tenantTheme?.isCustom).toBe(true);
      expect(JSON.parse(tenantTheme?.settings || '{}').font).toBe('Outfit');
    });

    it('should reject purchase if asset was already purchased/installed', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/purchase`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('already been purchased/installed');
    });

    it('should reflect total consolidated earnings inside the developer payouts report', async () => {
      const res = await request(app)
        .get('/api/marketplace/developer/payouts')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalSales).toBe(24.99); // 15.00 + 9.99
      expect(res.body.data.totalDeveloperShare).toBe(17.49); // 10.50 + 6.99
      expect(res.body.data.totalPlatformShare).toBe(7.50);   // 4.50 + 3.00
      expect(res.body.data.purchases.length).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 6. RATINGS & RATINGS FEEDBACK
  // ─────────────────────────────────────────────────────────────
  describe('Feedback & Ratings', () => {
    let pluginAssetId: string;

    beforeAll(async () => {
      const browse = await request(app)
        .get('/api/marketplace/assets')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      const plugin = browse.body.data.find((a: any) => a.type === 'plugin');
      pluginAssetId = plugin.id;
    });

    it('should submit feedback rating successfully', async () => {
      const res = await request(app)
        .post(`/api/marketplace/assets/${pluginAssetId}/feedback`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rating: 4,
          comment: 'Works well but needs better layout.',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.rating).toBe(4);
      expect(res.body.data.comment).toBe('Works well but needs better layout.');
    });

    it('should compute updated average rating in asset details', async () => {
      const res = await request(app)
        .get(`/api/marketplace/assets/${pluginAssetId}`)
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.averageRating).toBe(4);
      expect(res.body.data.totalFeedback).toBe(1);
    });
  });
});
