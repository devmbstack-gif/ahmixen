/**
 * Creates 8 sample isTestData orders on the landing-active session
 * through the same seat helpers as production.
 *
 * Usage: npm run seed:orders
 */
import mongoose from 'mongoose';
import { Session } from '../src/models/Session';
import { Plan } from '../src/models/Plan';
import { Order } from '../src/models/Order';
import { createOrderInternal } from '../src/lib/orders/createInternal';
import {
  confirmSeat,
  holdSeat,
  releaseHold,
  CHECKOUT_HOLD_MINUTES,
} from '../src/lib/orders/seats';
import { saveProof, tinyPngBuffer } from '../src/lib/orders/gridfs';
import { ensureOrderIndexes } from '../src/lib/orders/syncIndexes';
import { isLiveForStatus } from '../src/lib/orders/isLive';
import {
  createPublicToken,
  nextOrderNumber,
  normalizeEmail,
} from '../src/lib/orders/tokens';
import {
  assertSeedAllowed,
  clearTestOrders,
  loadEnvFile,
} from './seed-orders-clear';

async function main() {
  loadEnvFile('.env.local');
  loadEnvFile('.env');
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  assertSeedAllowed(uri);

  await mongoose.connect(uri);
  await ensureOrderIndexes();

  const cleared = await clearTestOrders();
  console.log('Cleared previous test orders:', cleared);

  const session =
    (await Session.findOne({ isLandingActive: true, status: 'open' })) ||
    (await Session.findOne({ status: 'open' }).sort({ startsAt: 1 }));
  if (!session) {
    throw new Error('No open session found. Create a session first.');
  }

  const plan =
    (await Plan.findOne({ status: 'active', type: 'one_time' }).sort({
      sortOrder: 1,
    })) ||
    (await Plan.findOne({ status: { $ne: 'archived' }, type: 'one_time' }));
  if (!plan) {
    throw new Error('No one-time plan found. Create a pricing plan first.');
  }

  const sessionId = String(session._id);
  const planId = String(plan._id);
  const planSnapshot = {
    name: plan.name,
    type: plan.type as 'one_time' | 'installment',
    currency: plan.currency as 'PKR' | 'USD',
    price: plan.price,
    installmentsCount: plan.installmentsCount ?? null,
  };
  const amounts = {
    basePrice: plan.price,
    discountAmount: 0,
    finalPrice: plan.price,
    installmentsCount: 1,
    totalAmount: plan.price,
  };

  const people = [
    { name: 'Ayesha Khan', email: 'ayesha.test@example.com', phone: '923001111111' },
    { name: 'Bilal Ahmed', email: 'bilal.test@example.com', phone: '923002222222' },
    { name: 'Sara Malik', email: 'sara.test@example.com', phone: '923003333333' },
    { name: 'Hassan Raza', email: 'hassan.test@example.com', phone: '923004444444' },
    { name: 'Fatima Noor', email: 'fatima.test@example.com', phone: '923005555555' },
    { name: 'Omar Siddiqui', email: 'omar.test@example.com', phone: '923006666666' },
    { name: 'Nadia Ali', email: 'nadia.test@example.com', phone: '923007777777' },
    { name: 'Zain Abbas', email: 'zain.test@example.com', phone: '923008888888' },
  ];

  const created: string[] = [];

  // 3 pending_verification with PNG proof
  for (let i = 0; i < 3; i++) {
    const p = people[i]!;
    const orderId = new mongoose.Types.ObjectId();
    await holdSeat(sessionId, String(orderId), CHECKOUT_HOLD_MINUTES);
    const proof = await saveProof(tinyPngBuffer(), {
      orderId: String(orderId),
    });
    const holdHours = Math.max(1, session.holdHours || 24);
    const newExpiry = new Date(Date.now() + holdHours * 3600_000);
    await Session.updateOne(
      { _id: session._id, 'holds.orderId': String(orderId) },
      { $set: { 'holds.$.expiresAt': newExpiry } }
    );

    const doc = await Order.create({
      _id: orderId,
      orderNumber: await nextOrderNumber(),
      publicToken: createPublicToken(),
      sessionId,
      planId,
      customer: {
        name: p.name,
        email: p.email,
        emailNormalized: normalizeEmail(p.email),
        phone: p.phone,
        profession: 'Student',
      },
      planSnapshot,
      coupon: null,
      amounts,
      paymentMethod: 'bank_transfer',
      proof: {
        fileId: proof.fileId,
        contentType: proof.contentType,
        size: proof.size,
        uploadedAt: new Date(),
      },
      status: 'pending_verification',
      isLive: true,
      rejectionReason: '',
      adminNote: '',
      events: [
        { type: 'created', at: new Date(), note: 'Seed order' },
        {
          type: 'proof_uploaded',
          at: new Date(),
          note: 'Payment screenshot uploaded',
        },
      ],
      isTestData: true,
      version: 1,
    });
    created.push(`${doc.orderNumber} pending_verification`);
  }

  // 2 approved
  for (let i = 3; i < 5; i++) {
    const p = people[i]!;
    const orderId = new mongoose.Types.ObjectId();
    await holdSeat(sessionId, String(orderId), CHECKOUT_HOLD_MINUTES);
    try {
      const doc = await Order.create({
        _id: orderId,
        orderNumber: await nextOrderNumber(),
        publicToken: createPublicToken(),
        sessionId,
        planId,
        customer: {
          name: p.name,
          email: p.email,
          emailNormalized: normalizeEmail(p.email),
          phone: p.phone,
          profession: '',
        },
        planSnapshot,
        coupon: null,
        amounts,
        paymentMethod: 'bank_transfer',
        proof: null,
        status: 'approved',
        isLive: isLiveForStatus('approved'),
        rejectionReason: '',
        adminNote: '',
        events: [
          { type: 'created', at: new Date(), note: 'Seed order' },
          { type: 'approved', at: new Date(), note: 'Seed approved' },
        ],
        isTestData: true,
        version: 1,
      });
      await confirmSeat(sessionId, String(orderId));
      created.push(`${doc.orderNumber} approved`);
    } catch (err) {
      await releaseHold(sessionId, String(orderId)).catch(() => undefined);
      throw err;
    }
  }

  // 1 rejected
  {
    const p = people[5]!;
    const doc = await createOrderInternal({
      sessionId,
      planId,
      customer: p,
      planSnapshot,
      amounts,
      status: 'rejected',
      isTestData: true,
      skipHold: true,
      rejectionReason: 'Payment not received',
      events: [
        { type: 'created', at: new Date(), note: 'Seed order' },
        {
          type: 'rejected',
          at: new Date(),
          note: 'Payment not received',
        },
      ],
    });
    created.push(`${doc.orderNumber} rejected`);
  }

  // 1 awaiting_payment
  {
    const p = people[6]!;
    const doc = await createOrderInternal({
      sessionId,
      planId,
      customer: p,
      planSnapshot,
      amounts,
      status: 'awaiting_payment',
      isTestData: true,
      holdMinutes: CHECKOUT_HOLD_MINUTES,
    });
    created.push(`${doc.orderNumber} awaiting_payment`);
  }

  // 1 expired (no live hold)
  {
    const p = people[7]!;
    const doc = await createOrderInternal({
      sessionId,
      planId,
      customer: p,
      planSnapshot,
      amounts,
      status: 'expired',
      isTestData: true,
      skipHold: true,
      events: [
        { type: 'created', at: new Date(), note: 'Seed order' },
        {
          type: 'expired',
          at: new Date(),
          note: 'Checkout hold ended without payment proof',
        },
      ],
    });
    created.push(`${doc.orderNumber} expired`);
  }

  const refreshed = await Session.findById(sessionId).lean();
  console.log('seed:orders summary');
  console.log(
    JSON.stringify(
      {
        sessionId,
        sessionTitle: session.title,
        plan: plan.name,
        created,
        seatsConfirmed: refreshed?.seatsConfirmed,
        holds: (refreshed?.holds ?? []).length,
      },
      null,
      2
    )
  );
}

main()
  .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await mongoose.disconnect().catch(() => undefined);
    process.exit(1);
  });
