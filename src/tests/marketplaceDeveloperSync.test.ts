import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';

describe('Marketplace and developer hub synchronization', () => {
  const suffix = Date.now().toString(36);
  const subdomain = `market-sync-${suffix}`;
  const ownerEmail = `market-sync-${suffix}@example.com`;
  let tenantId = '';
  let token = '';
  let developerId = '';
  let assetId = '';
  let submissionId = '';

  afterAll(async () => {
    if (developerId) {
      const assets = await prisma.marketplaceAsset.findMany({
        where: { developerId },
        select: { id: true },
      });
      const assetIds = assets.map((asset) => asset.id);
      const submissions = await prisma.assetSubmission.findMany({
        where: { assetId: { in: assetIds } },
        select: { id: true },
      });
      const submissionIds = submissions.map((submission) => submission.id);
      await prisma.assetFeedback.deleteMany({ where: { assetId: { in: assetIds } } });
      await prisma.assetPurchase.deleteMany({ where: { assetId: { in: assetIds } } });
      await prisma.submissionReview.deleteMany({ where: { submissionId: { in: submissionIds } } });
      await prisma.assetSubmission.deleteMany({ where: { assetId: { in: assetIds } } });
      await prisma.tenantPlugin.deleteMany({ where: { pluginId: { in: assetIds } } });
      await prisma.pluginDefinition.deleteMany({ where: { id: { in: assetIds } } });
      await prisma.marketplaceAsset.deleteMany({ where: { id: { in: assetIds } } });
    }
    if (tenantId) {
      await prisma.developerMarketplaceModuleActivity.deleteMany({ where: { tenantId } });
      await prisma.developerProfile.deleteMany({ where: { user: { tenantId } } });
      await prisma.tenant.deleteMany({ where: { id: tenantId } });
    }
    await prisma.$disconnect();
  });

  it('provisions marketplace/developer access for a newly registered church', async () => {
    const res = await request(app)
      .post('/api/auth/register-tenant')
      .send({
        name: 'Marketplace Sync Church',
        subdomain,
        ownerName: 'Marketplace Owner',
        ownerEmail,
        ownerPassword: 'Password123!',
        plan: 'growth',
      });

    expect(res.status).toBe(201);
    tenantId = res.body.tenantId;
    token = res.body.token;

    const modules = await prisma.tenantModule.findMany({ where: { tenantId } });
    expect(modules.map((item) => item.moduleKey)).toEqual(
      expect.arrayContaining(['marketplace', 'developer-marketplace', 'plugin-extensions-engine'])
    );

    const overview = await request(app)
      .get('/api/marketplace/developer/overview')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`);

    expect(overview.status).toBe(200);
    expect(overview.body.data.profile).toBeNull();
  });

  it('syncs developer profile, submission, central review, and tenant install', async () => {
    const profile = await request(app)
      .post('/api/marketplace/developer/register')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyName: 'Marketplace Sync Studio',
        website: `https://${subdomain}.churched.online`,
        payoutEmail: ownerEmail,
      });

    expect(profile.status).toBe(201);
    developerId = profile.body.data.id;

    const asset = await request(app)
      .post('/api/marketplace/assets')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Prayer Sync Plugin ${suffix}`,
        description: 'A synchronized marketplace test plugin.',
        type: 'plugin',
        pricingType: 'free',
        price: 0,
        assetConfig: {
          requiredPermissions: ['member.read'],
          requiredModules: ['plugin-extensions-engine'],
          version: '1.0.0',
        },
      });

    expect(asset.status).toBe(201);
    assetId = asset.body.data.id;

    const submission = await request(app)
      .post(`/api/marketplace/assets/${assetId}/submit`)
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`)
      .send({ version: '1.0.0', changelog: 'Initial sync test release' });

    expect(submission.status).toBe(201);
    submissionId = submission.body.data.id;

    const centralQueue = await request(app).get('/api/super-admin/marketplace');
    expect(centralQueue.status).toBe(200);
    expect(centralQueue.body.data.some((item: any) => item.id === submissionId)).toBe(true);

    const review = await request(app)
      .post(`/api/super-admin/submissions/${submissionId}/review`)
      .send({ decision: 'approved', notes: 'Approved by sync test' });

    expect(review.status).toBe(201);

    const storefront = await request(app)
      .get('/api/marketplace/assets?type=plugin')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`);

    expect(storefront.status).toBe(200);
    expect(storefront.body.data.find((item: any) => item.id === assetId)?.versions[0].version).toBe('1.0.0');

    const install = await request(app)
      .post(`/api/marketplace/assets/${assetId}/install`)
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`)
      .send({ versionId: submissionId });

    expect(install.status).toBe(201);
    expect(install.body.data.status).toBe('pending_permissions');

    const permissions = await request(app)
      .post(`/api/marketplace/assets/${assetId}/permissions`)
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissions: ['member.read'] });

    expect(permissions.status).toBe(200);
    expect(permissions.body.data.status).toBe('active');

    const installed = await request(app)
      .get('/api/marketplace/installed')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`);

    expect(installed.status).toBe(200);
    expect(installed.body.data.find((item: any) => item.assetId === assetId)?.status).toBe('active');

    const centralAssets = await request(app).get('/api/super-admin/marketplace/assets');
    expect(centralAssets.status).toBe(200);
    expect(centralAssets.body.data.find((item: any) => item.id === assetId)?.installs).toBe(1);

    const audits = await request(app).get('/api/super-admin/marketplace/audit-logs');
    expect(audits.status).toBe(200);
    expect(audits.body.data.some((item: any) => item.assetId === assetId && item.action === 'install_asset')).toBe(true);
  });
});
