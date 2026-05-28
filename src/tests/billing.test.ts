import request from 'supertest';
import app from '../app';
import prisma from '../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

describe('ChurchOS Billing & Subscription Management Module', () => {
  let tenantId: string;
  let adminToken: string;
  let freePlanId: string;
  let growthPlanId: string;

  beforeAll(async () => {
    // 1. Clean up database records
    await prisma.invoice.deleteMany({});
    await prisma.usageMeter.deleteMany({});
    await prisma.tenantSubscription.deleteMany({});
    await prisma.subscriptionPlan.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.tenant.deleteMany({});

    // 2. Create Tenant
    const tenant = await prisma.tenant.create({
      data: { name: 'Billing Test Church', subdomain: 'billing-test', status: 'active' },
    });
    tenantId = tenant.id;

    // 3. Create Admin Role & Permissions
    const permissions = await prisma.permission.findMany({
      where: {
        name: { in: ['member.create', 'member.read', 'tenant.settings', 'member.update'] },
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
      data: { tenantId, email: 'admin@billing-test.com', passwordHash: passHash },
    });
    await prisma.userRole.create({
      data: { userId: adminUser.id, roleId: adminRole.id },
    });

    adminToken = jwt.sign(
      { userId: adminUser.id, tenantId, email: adminUser.email },
      JWT_SECRET
    );

    // 5. Seed default Twilio integration keys (to allow SMS sending resolver to function)
    await prisma.tenantConnectedService.create({
      data: {
        tenantId,
        providerId: 'twilio',
        encryptedCredentials: require('../lib/vault').encryptCredentials(
          JSON.stringify({ accountSid: 'AC_test', authToken: 'auth_test', fromNumber: '+1234' }),
          tenantId
        ),
      },
    });

    // 6. Seed Plans
    const freePlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Free Plan',
        basePrice: 0.0,
        includedMembers: 1,
        includedSms: 2,
        includedStorageGb: 1.0,
        memberOverageRate: 0.0, // Hard limit, no overage allowed
        smsOverageRate: 0.0,
        storageOverageRate: 0.0,
      },
    });
    freePlanId = freePlan.id;

    const growthPlan = await prisma.subscriptionPlan.create({
      data: {
        name: 'Growth Plan',
        basePrice: 49.0,
        includedMembers: 2,
        includedSms: 5,
        includedStorageGb: 10.0,
        memberOverageRate: 5.0, // Overage cost per extra member
        smsOverageRate: 0.1,    // Overage cost per extra SMS
        storageOverageRate: 2.0, // Overage cost per extra GB
      },
    });
    growthPlanId = growthPlan.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // A. PLANS LISTING & SUBSCRIPTION
  // ─────────────────────────────────────────────────────────────
  describe('Subscription Plans Management', () => {
    it('should list all active plans successfully', async () => {
      const res = await request(app)
        .get('/api/billing/plans')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.find((p: any) => p.name === 'Free Plan')).toBeDefined();
    });

    it('should subscribe the tenant to the Free Plan', async () => {
      const res = await request(app)
        .post('/api/billing/subscribe')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ planId: freePlanId });

      expect(res.status).toBe(201);
      expect(res.body.data.planId).toBe(freePlanId);
      expect(res.body.data.status).toBe('active');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // B. LIMIT ENFORCEMENT (HARD LIMIT ON FREE PLAN)
  // ─────────────────────────────────────────────────────────────
  describe('Strict Limit Enforcement (Free Plan)', () => {
    it('should allow creating first member (within limit)', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Member', lastName: 'One' });

      expect(res.status).toBe(201);
    });

    it('should block creating second member (exceeds hard limit)', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Member', lastName: 'Two' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('limit of 1 reached');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // C. PLAN UPGRADE & SOFT LIMIT OVERAGE
  // ─────────────────────────────────────────────────────────────
  describe('Plan Upgrades & Overage Billing (Growth Plan)', () => {
    it('should upgrade the tenant to the Growth Plan', async () => {
      const res = await request(app)
        .post('/api/billing/subscribe')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ planId: growthPlanId });

      expect(res.status).toBe(201);
      expect(res.body.data.planId).toBe(growthPlanId);
    });

    it('should now allow creating second member (allowed with overage)', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Member', lastName: 'Two' });

      expect(res.status).toBe(201);
    });

    it('should allow creating third member (allowed with overage)', async () => {
      const res = await request(app)
        .post('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Member', lastName: 'Three' });

      expect(res.status).toBe(201);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // D. METERED DISPATCH USAGE
  // ─────────────────────────────────────────────────────────────
  describe('Metered Usage Tracking', () => {
    it('should compile template and dispatch SMS, incrementing usage', async () => {
      const template = await request(app)
        .post('/api/communication/templates')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Verification Code',
          type: 'sms',
          body: 'Code: 9999',
        });
      const templateId = template.body.data.id;

      // Seed consent
      const member = await prisma.member.findFirst({ where: { firstName: 'Member', lastName: 'One' } });
      await prisma.member.update({ where: { id: member!.id }, data: { phone: '+1999888777' } });
      await request(app)
        .post('/api/communication/consent')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          memberId: member!.id,
          optInSms: true,
        });

      // Send 6 SMS (limit is 5, 6th causes overage)
      for (let i = 0; i < 6; i++) {
        const sendRes = await request(app)
          .post('/api/communication/send')
          .set('x-tenant-id', tenantId)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ memberId: member!.id, templateId });
        expect(sendRes.status).toBe(200);
      }

      // Check usage stats
      const usageRes = await request(app)
        .get('/api/billing/usage')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(usageRes.status).toBe(200);
      expect(usageRes.body.data.usage.sms_sent).toBe(6);
      expect(usageRes.body.data.usage.active_members).toBe(3);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // E. INVOICING & WEBHOOK GATING
  // ─────────────────────────────────────────────────────────────
  describe('Invoice Calculation & Webhook Suspensions', () => {
    let invoiceId: string;

    it('should generate invoice with base rate + overages', async () => {
      const res = await request(app)
        .post('/api/billing/invoice/trigger')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(201);
      
      // Expected Cost Calculation:
      // Base: $49.00
      // Member count: 3. Included: 2. Overage: 1 * $5.00 = $5.00
      // SMS count: 6. Included: 5. Overage: 1 * $0.10 = $0.10
      // Total Expected = $54.10
      expect(res.body.data.amount).toBe(54.10);
      expect(res.body.data.status).toBe('open');
      invoiceId = res.body.data.id;
    });

    it('should suspend tenant account upon invoice payment failure webhook', async () => {
      const webhookRes = await request(app)
        .post('/api/billing/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId, event: 'payment_intent.payment_failed' });

      expect(webhookRes.status).toBe(200);
      expect(webhookRes.body.success).toBe(true);

      // Verify tenant has been suspended
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant!.status).toBe('suspended');

      // Verify that member queries are blocked due to suspension
      const membersQuery = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      // Gated by tenant status verification in tenantMiddleware
      expect(membersQuery.status).toBe(403);
      expect(membersQuery.body.error).toContain('suspended');
    });

    it('should restore tenant account upon invoice payment success webhook', async () => {
      const webhookRes = await request(app)
        .post('/api/billing/webhook')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId, event: 'payment_intent.succeeded' });

      expect(webhookRes.status).toBe(200);

      // Verify tenant has been activated
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      expect(tenant!.status).toBe('active');

      // Verify queries are allowed again
      const membersQuery = await request(app)
        .get('/api/members')
        .set('x-tenant-id', tenantId)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(membersQuery.status).toBe(200);
      expect(membersQuery.body.data.length).toBe(3);
    });
  });
});
