import prisma from '../lib/prisma';

/**
 * Helper to get or default the billing period dates for a tenant.
 */
async function getBillingPeriod(tenantId: string): Promise<{ start: Date; end: Date }> {
  const sub = await prisma.tenantSubscription.findUnique({
    where: { tenantId },
  });
  if (sub) {
    return { start: sub.currentPeriodStart, end: sub.currentPeriodEnd };
  }
  // Fallback to current calendar month
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

/**
 * Record usage consumption for a specific metric key.
 */
export async function recordUsage(
  tenantId: string,
  metricKey: string,
  quantity: number
): Promise<void> {
  const period = await getBillingPeriod(tenantId);
  
  // Find an existing usage meter for this period
  const existing = await prisma.usageMeter.findFirst({
    where: {
      tenantId,
      metricKey,
      billingPeriodStart: period.start,
      billingPeriodEnd: period.end,
    },
  });

  if (existing) {
    await prisma.usageMeter.update({
      where: { id: existing.id },
      data: { quantity: existing.quantity + quantity },
    });
  } else {
    await prisma.usageMeter.create({
      data: {
        tenantId,
        metricKey,
        quantity,
        billingPeriodStart: period.start,
        billingPeriodEnd: period.end,
      },
    });
  }
}

/**
 * Check if the tenant is allowed to consume resources based on their subscription plan.
 */
export async function checkSubscriptionLimit(
  tenantId: string,
  metricKey: string,
  requiredQuantity: number = 1
): Promise<{ allowed: boolean; reason?: string }> {
  // Fetch tenant and check if active
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });
  if (!tenant) {
    return { allowed: false, reason: 'Tenant not found' };
  }
  if (tenant.status === 'suspended') {
    return { allowed: false, reason: 'Tenant account is suspended' };
  }

  const sub = await prisma.tenantSubscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!sub) {
    return { allowed: false, reason: 'No active subscription plan found' };
  }

  if (sub.status === 'suspended' || sub.status === 'unpaid') {
    return { allowed: false, reason: `Subscription status is ${sub.status}` };
  }

  const plan = sub.plan;
  const period = { start: sub.currentPeriodStart, end: sub.currentPeriodEnd };

  if (metricKey === 'active_members') {
    const count = await prisma.member.count({ where: { tenantId } });
    if (count + requiredQuantity > plan.includedMembers) {
      // Free plans block addition immediately; paid plans allow overage fees
      if (plan.basePrice === 0) {
        return { allowed: false, reason: `Plan member limit of ${plan.includedMembers} reached` };
      }
    }
  } else if (metricKey === 'sms_sent') {
    const meter = await prisma.usageMeter.findFirst({
      where: { tenantId, metricKey, billingPeriodStart: period.start, billingPeriodEnd: period.end },
    });
    const current = meter ? meter.quantity : 0;
    if (current + requiredQuantity > plan.includedSms) {
      if (plan.basePrice === 0) {
        return { allowed: false, reason: `Plan SMS limit of ${plan.includedSms} reached` };
      }
    }
  } else if (metricKey === 'storage_gb') {
    const meter = await prisma.usageMeter.findFirst({
      where: { tenantId, metricKey, billingPeriodStart: period.start, billingPeriodEnd: period.end },
    });
    const current = meter ? meter.quantity : 0;
    if (current + requiredQuantity > plan.includedStorageGb) {
      if (plan.basePrice === 0) {
        return { allowed: false, reason: `Plan storage limit of ${plan.includedStorageGb} GB reached` };
      }
    }
  }

  return { allowed: true };
}

/**
 * Generate invoice for the current period and advance the billing period cycle.
 */
export async function generateInvoice(tenantId: string): Promise<any> {
  const sub = await prisma.tenantSubscription.findUnique({
    where: { tenantId },
    include: { plan: true },
  });

  if (!sub) {
    throw new Error('No active subscription found for tenant');
  }

  const plan = sub.plan;
  const periodStart = sub.currentPeriodStart;
  const periodEnd = sub.currentPeriodEnd;

  let amount = plan.basePrice;

  // 1. Members count overage
  const memberCount = await prisma.member.count({ where: { tenantId } });
  if (memberCount > plan.includedMembers) {
    const memberOverage = memberCount - plan.includedMembers;
    amount += memberOverage * plan.memberOverageRate;
  }

  // 2. SMS sent overage
  const smsMeter = await prisma.usageMeter.findFirst({
    where: { tenantId, metricKey: 'sms_sent', billingPeriodStart: periodStart, billingPeriodEnd: periodEnd },
  });
  const smsQuantity = smsMeter ? smsMeter.quantity : 0;
  if (smsQuantity > plan.includedSms) {
    const smsOverage = smsQuantity - plan.includedSms;
    amount += smsOverage * plan.smsOverageRate;
  }

  // 3. Storage overage
  const storageMeter = await prisma.usageMeter.findFirst({
    where: { tenantId, metricKey: 'storage_gb', billingPeriodStart: periodStart, billingPeriodEnd: periodEnd },
  });
  const storageQuantity = storageMeter ? storageMeter.quantity : 0;
  if (storageQuantity > plan.includedStorageGb) {
    const storageOverage = storageQuantity - plan.includedStorageGb;
    amount += storageOverage * plan.storageOverageRate;
  }

  // Round to 2 decimal places
  amount = Math.round(amount * 100) / 100;

  // Create Invoice
  const invoice = await prisma.invoice.create({
    data: {
      tenantId,
      amount,
      status: 'open',
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
    },
  });

  // Advance billing cycle dates
  const nextStart = periodEnd;
  const nextEnd = new Date(periodEnd);
  nextEnd.setMonth(nextEnd.getMonth() + 1);

  await prisma.tenantSubscription.update({
    where: { id: sub.id },
    data: {
      currentPeriodStart: nextStart,
      currentPeriodEnd: nextEnd,
    },
  });

  return invoice;
}

/**
 * Handle payments webhook updates (simulate Stripe/PayPal/Paystack transitions).
 */
export async function handlePaymentWebhook(
  tenantId: string,
  invoiceId: string,
  event: 'payment_intent.succeeded' | 'payment_intent.payment_failed'
): Promise<void> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, tenantId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  if (event === 'payment_intent.succeeded') {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'paid' },
    });

    await prisma.tenantSubscription.update({
      where: { tenantId },
      data: { status: 'active' },
    });

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'active' },
    });
  } else if (event === 'payment_intent.payment_failed') {
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'open' },
    });

    await prisma.tenantSubscription.update({
      where: { tenantId },
      data: { status: 'unpaid' },
    });

    // Suspend the tenant on payment failure
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { status: 'suspended' },
    });
  }
}
