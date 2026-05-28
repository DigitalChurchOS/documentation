import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import {
  recordUsage,
  checkSubscriptionLimit,
  generateInvoice,
  handlePaymentWebhook,
} from '../services/billing';

const router = Router();

// All billing routes require authentication
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// GET /api/billing/plans
// ─────────────────────────────────────────────────────────────
// Get all available subscription plans
// ─────────────────────────────────────────────────────────────
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
    });
    res.json({ data: plans });
  } catch (err) {
    console.error('Get plans error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/billing/subscribe
// ─────────────────────────────────────────────────────────────
// Subscribe tenant to a plan
// Body: { planId }
// ─────────────────────────────────────────────────────────────
router.post('/subscribe', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { planId } = req.body;
    const tenantId = req.tenantId!;

    if (!planId) {
      res.status(400).json({ error: 'planId is required' });
      return;
    }

    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan) {
      res.status(404).json({ error: 'Plan not found' });
      return;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await prisma.tenantSubscription.upsert({
      where: { tenantId },
      update: {
        planId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      create: {
        tenantId,
        planId,
        status: 'active',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });

    // Automatically make sure the tenant is active
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'active' },
    });

    res.status(201).json({ data: subscription });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/billing/usage
// ─────────────────────────────────────────────────────────────
// Get active subscription and metered usage stats
// ─────────────────────────────────────────────────────────────
router.get('/usage', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    const sub = await prisma.tenantSubscription.findUnique({
      where: { tenantId },
      include: { plan: true },
    });

    if (!sub) {
      res.status(404).json({ error: 'No active subscription found' });
      return;
    }

    const periodStart = sub.currentPeriodStart;
    const periodEnd = sub.currentPeriodEnd;

    const meters = await prisma.usageMeter.findMany({
      where: {
        tenantId,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
      },
    });

    const memberCount = await prisma.member.count({ where: { tenantId } });

    res.json({
      data: {
        subscription: sub,
        usage: {
          active_members: memberCount,
          sms_sent: meters.find((m) => m.metricKey === 'sms_sent')?.quantity || 0,
          storage_gb: meters.find((m) => m.metricKey === 'storage_gb')?.quantity || 0,
          ai_tokens: meters.find((m) => m.metricKey === 'ai_tokens')?.quantity || 0,
          meeting_hours: meters.find((m) => m.metricKey === 'meeting_hours')?.quantity || 0,
        },
      },
    });
  } catch (err) {
    console.error('Get usage stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/billing/invoices
// ─────────────────────────────────────────────────────────────
// Get all billing invoices for tenant
// ─────────────────────────────────────────────────────────────
router.get('/invoices', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const invoices = await prisma.invoice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ data: invoices });
  } catch (err) {
    console.error('Get invoices error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/billing/invoice/trigger
// ─────────────────────────────────────────────────────────────
// Manually trigger invoice generation for test purposes
// ─────────────────────────────────────────────────────────────
router.post('/invoice/trigger', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const invoice = await generateInvoice(tenantId);
    res.status(201).json({ data: invoice });
  } catch (err: any) {
    console.error('Trigger invoice error:', err);
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/billing/webhook
// ─────────────────────────────────────────────────────────────
// Simulate payment gateway webhook
// Body: { invoiceId, event }
// ─────────────────────────────────────────────────────────────
router.post('/webhook', requirePermission('tenant.settings'), async (req: Request, res: Response) => {
  try {
    const { invoiceId, event } = req.body;
    const tenantId = req.tenantId!;

    if (!invoiceId || !event) {
      res.status(400).json({ error: 'invoiceId and event are required' });
      return;
    }

    if (event !== 'payment_intent.succeeded' && event !== 'payment_intent.payment_failed') {
      res.status(400).json({ error: 'Invalid event type' });
      return;
    }

    await handlePaymentWebhook(tenantId, invoiceId, event);
    res.json({ success: true, message: 'Webhook handled successfully' });
  } catch (err: any) {
    console.error('Handle webhook error:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;
