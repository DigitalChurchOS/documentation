import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';

describe('Tenant registration and onboarding synchronization', () => {
  const suffix = Date.now().toString(36);
  const subdomain = `sync-${suffix}`;
  let tenantId = '';
  let token = '';

  afterAll(async () => {
    if (tenantId) {
      await prisma.tenant.delete({ where: { id: tenantId } }).catch(() => undefined);
    }
    await prisma.$disconnect();
  });

  it('registers a church tenant, owner, subscription, website, and churched.online subdomain', async () => {
    const res = await request(app)
      .post('/api/auth/register-tenant')
      .send({
        name: 'Sync Test Church',
        ownerName: 'Ada Owner',
        ownerEmail: `owner-${suffix}@example.com`,
        ownerPassword: 'StrongPass123!',
        subdomain,
        city: 'Calgary',
        country: 'Canada',
        plan: 'growth',
      });

    expect(res.status).toBe(201);
    expect(res.body.tenant.subdomain).toBe(subdomain);
    expect(res.body.tenant.subdomainHost).toBe(`${subdomain}.churched.online`);
    expect(res.body.token).toBeTruthy();
    tenantId = res.body.tenantId;
    token = res.body.token;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: { include: { member: true } },
        websites: true,
        subscription: { include: { plan: true } },
      },
    });

    expect(tenant?.subdomain).toBe(subdomain);
    expect(tenant?.websites[0].domain).toBe(`${subdomain}.churched.online`);
    expect(tenant?.users[0].member?.firstName).toBe('Ada');
    expect(tenant?.subscription?.plan.slug).toBe('growth');
  });

  it('resolves the public subdomain and loads billing-aware onboarding state', async () => {
    const resolveRes = await request(app)
      .post('/api/public/resolve-subdomain')
      .send({ subdomain });

    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.id).toBe(tenantId);

    const currentPlan = await request(app)
      .get('/api/billing-subscription-management/current')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`);

    expect(currentPlan.status).toBe(200);
    expect(currentPlan.body.plan.slug).toBe('growth');

    const onboarding = await request(app)
      .get('/api/onboarding')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`);

    expect(onboarding.status).toBe(200);
    expect(onboarding.body.data.tenant.subdomainHost).toBe(`${subdomain}.churched.online`);
    expect(onboarding.body.data.steps.some((step: any) => step.stepKey === 'profile')).toBe(true);
  });

  it('syncs onboarding profile data into tenant dashboard and central dashboard views', async () => {
    const profileRes = await request(app)
      .patch('/api/onboarding/profile')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: '123 Sync Road',
        email: 'hello@synctest.org',
        phoneCode: '+1',
        phone: '555-0100',
        timezone: 'America/Edmonton',
        serviceTimes: [{ day: 'Sunday', time: '09:30' }],
      });

    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.progressPercent).toBeGreaterThan(0);

    const branding = await request(app)
      .get('/api/tenant/branding')
      .set('x-tenant-id', tenantId)
      .set('Authorization', `Bearer ${token}`);

    expect(branding.status).toBe(200);
    expect(branding.body.data.branding.address).toBe('123 Sync Road');
    expect(branding.body.data.branding.publicEmail).toBe('hello@synctest.org');

    const centralTenants = await request(app).get(`/api/super-admin/tenants?search=${subdomain}`);
    expect(centralTenants.status).toBe(200);
    expect(centralTenants.body.data[0].subdomainHost).toBe(`${subdomain}.churched.online`);
    expect(centralTenants.body.data[0].onboardingStatus).toBe('in_progress');

    const centralDetail = await request(app).get(`/api/super-admin/tenants/${tenantId}`);
    expect(centralDetail.status).toBe(200);
    expect(centralDetail.body.data.tenantDomains[0].domain).toBe(`${subdomain}.churched.online`);
  });
});
