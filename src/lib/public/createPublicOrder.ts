import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { Plan } from '@/models/Plan';
import { Session } from '@/models/Session';
import { connectToDatabase } from '@/lib/db';
import { upsertLeadFromSubmission } from '@/lib/leads/upsert';
import { expireStaleOrders } from '@/lib/orders/expire';
import { ensureOrderIndexes } from '@/lib/orders/syncIndexes';
import { withOrdersTransaction } from '@/lib/orders/tx';
import {
  getCheckoutHoldMinutes,
  holdSeat,
  releaseHold,
  SeatError,
} from '@/lib/orders/seats';
import { isLiveForStatus } from '@/lib/orders/isLive';
import {
  createPublicToken,
  nextOrderNumber,
  normalizeEmail,
} from '@/lib/orders/tokens';
import { ALLOW_INSTALLMENTS } from '@/lib/public/checkoutConfig';
import { getSeatSummary } from '@/lib/sessions/seats';

function isDupKey(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  );
}

export type PublicOrderCreateInput = {
  planId: string;
  name: string;
  email: string;
  phone: string;
  profession?: string;
  sourceKind?: 'checkout' | 'workshop';
  programId?: string;
  programTitle?: string;
  city?: string;
  skillLevel?: string;
  learningGoals?: string[];
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  isTestData?: boolean;
};

export type PublicOrderCreateResult =
  | {
      ok: true;
      publicToken: string;
      orderNumber: string;
      status: string;
      amounts: {
        basePrice: number;
        discountAmount: number;
        finalPrice: number;
        installmentsCount: number;
        totalAmount: number;
        currency: string;
      };
      holdExpiresAt: string | null;
      alreadyExisted: boolean;
    }
  | { ok: false; status: number; code: string; message: string };

export async function createPublicOrder(
  input: PublicOrderCreateInput
): Promise<PublicOrderCreateResult> {
  await connectToDatabase();
  await ensureOrderIndexes();
  await expireStaleOrders();

  const sessionDoc = await Session.findOne({
    isLandingActive: true,
    status: 'open',
  });
  if (!sessionDoc) {
    return {
      ok: false,
      status: 409,
      code: 'sold_out',
      message: 'Sorry, all seats are taken',
    };
  }

  const sessionId = String(sessionDoc._id);
  const seats = getSeatSummary(sessionDoc);
  if (seats.available <= 0) {
    return {
      ok: false,
      status: 409,
      code: 'sold_out',
      message: 'Sorry, all seats are taken',
    };
  }

  if (!mongoose.isValidObjectId(input.planId)) {
    return {
      ok: false,
      status: 400,
      code: 'invalid_plan',
      message: 'This plan is not available',
    };
  }

  const plan = await Plan.findById(input.planId);
  if (
    !plan ||
    plan.status !== 'active' ||
    (!ALLOW_INSTALLMENTS && plan.type !== 'one_time') ||
    (plan.sessionId && plan.sessionId !== sessionId)
  ) {
    return {
      ok: false,
      status: 400,
      code: 'invalid_plan',
      message: 'This plan is not available',
    };
  }
  if (plan.validUntil && new Date(plan.validUntil).getTime() < Date.now()) {
    return {
      ok: false,
      status: 400,
      code: 'invalid_plan',
      message: 'This plan is not available',
    };
  }

  const emailNormalized = normalizeEmail(input.email);

  const existingLive = await Order.findOne({
    sessionId,
    'customer.emailNormalized': emailNormalized,
    isLive: true,
  });
  if (existingLive) {
    // Ensure a Leads row exists even for bookings created before lead upsert.
    try {
      const { leadId } = await upsertLeadFromSubmission({
        name: existingLive.customer.name || input.name,
        email: existingLive.customer.email || input.email,
        phone: existingLive.customer.phone || input.phone,
        profession:
          existingLive.customer.profession || input.profession || '',
        kind: existingLive.sourceKind === 'workshop' ? 'workshop' : 'general',
        programId: existingLive.programId || input.programId || '',
        programTitle: existingLive.programTitle || input.programTitle || '',
        city: existingLive.workshopMeta?.city || input.city || '',
        skillLevel:
          existingLive.workshopMeta?.skillLevel || input.skillLevel || '',
        learningGoals:
          existingLive.workshopMeta?.learningGoals ||
          input.learningGoals ||
          [],
        paidConfirmed:
          existingLive.status === 'pending_verification' ||
          existingLive.status === 'approved',
        markConverted: existingLive.status === 'approved',
        orderId: String(existingLive._id),
        utm: existingLive.utm || input.utm,
        message:
          existingLive.sourceKind === 'workshop'
            ? `Workshop booking: ${existingLive.programTitle || 'program'}`
            : 'Reserve form submission',
      });
      if (!existingLive.leadId) {
        existingLive.leadId = leadId;
        await existingLive.save().catch(() => undefined);
      }
    } catch {
      // Lead upsert must not block the booking conflict response.
    }

    if (existingLive.status === 'approved') {
      return {
        ok: false,
        status: 409,
        code: 'already_confirmed',
        message: 'You already have a confirmed seat for this session',
      };
    }
    if (
      existingLive.status === 'awaiting_payment' ||
      existingLive.status === 'pending_verification'
    ) {
      return {
        ok: false,
        status: 409,
        code: 'already_submitted',
        message:
          'You already submitted your form. Admin will shortly review your payment details and send you a seat confirmation email.',
      };
    }
  }

  const installmentsCount =
    plan.type === 'installment' && plan.installmentsCount
      ? plan.installmentsCount
      : 1;
  const basePrice = plan.price;
  const finalPrice = basePrice;
  const totalAmount = finalPrice * installmentsCount;

  const orderId = new mongoose.Types.ObjectId();
  const publicToken = createPublicToken();

  try {
    const { result } = await withOrdersTransaction(async (mongoSession) => {
      const holdExpiresAt = await holdSeat(
        sessionId,
        String(orderId),
        getCheckoutHoldMinutes(),
        { session: mongoSession }
      );

      const orderNumber = await nextOrderNumber(mongoSession);
      const [doc] = await Order.create(
        [
          {
            _id: orderId,
            orderNumber,
            publicToken,
            sessionId,
            planId: String(plan._id),
            customer: {
              name: input.name.trim(),
              email: input.email.trim(),
              emailNormalized,
              phone: input.phone.trim(),
              profession: input.profession?.trim() || '',
            },
            planSnapshot: {
              name: plan.name,
              type: plan.type,
              currency: plan.currency,
              price: plan.price,
              installmentsCount: plan.installmentsCount ?? null,
            },
            coupon: null,
            amounts: {
              basePrice,
              discountAmount: 0,
              finalPrice,
              installmentsCount,
              totalAmount,
            },
            paymentMethod: 'bank_transfer',
            proof: null,
            status: 'awaiting_payment',
            isLive: isLiveForStatus('awaiting_payment'),
            rejectionReason: '',
            adminNote: '',
            events: [
              {
                type: 'created',
                at: new Date(),
                note:
                  input.sourceKind === 'workshop'
                    ? `Workshop booking: ${(input.programTitle || '').trim() || plan.name}`
                    : 'Booking created',
              },
            ],
            utm: {
              source: input.utm?.source || '',
              medium: input.utm?.medium || '',
              campaign: input.utm?.campaign || '',
              content: input.utm?.content || '',
              term: input.utm?.term || '',
            },
            leadId: '',
            sourceKind: input.sourceKind === 'workshop' ? 'workshop' : 'checkout',
            programId:
              input.sourceKind === 'workshop'
                ? (input.programId || '').trim().slice(0, 80)
                : '',
            programTitle:
              input.sourceKind === 'workshop'
                ? (input.programTitle || '').trim().slice(0, 120)
                : '',
            workshopMeta:
              input.sourceKind === 'workshop'
                ? {
                    city: (input.city || '').trim().slice(0, 80),
                    skillLevel: (input.skillLevel || '').trim().slice(0, 40),
                    learningGoals: Array.isArray(input.learningGoals)
                      ? input.learningGoals.map(String).slice(0, 8)
                      : [],
                  }
                : null,
            isTestData:
              Boolean(input.isTestData) ||
              emailNormalized.endsWith('@checkout-test.invalid'),
            version: 1,
          },
        ],
        { session: mongoSession ?? undefined }
      );

      return { doc: doc!, holdExpiresAt };
    });

    const orderDoc = result.doc;
    const holdExpiresAt = result.holdExpiresAt;
    const isWorkshop = orderDoc.sourceKind === 'workshop';

    try {
      const { leadId } = await upsertLeadFromSubmission({
        name: orderDoc.customer.name,
        email: orderDoc.customer.email,
        phone: orderDoc.customer.phone,
        profession: orderDoc.customer.profession || '',
        kind: isWorkshop ? 'workshop' : 'general',
        programId: orderDoc.programId || '',
        programTitle: orderDoc.programTitle || '',
        city: orderDoc.workshopMeta?.city || '',
        skillLevel: orderDoc.workshopMeta?.skillLevel || '',
        learningGoals: orderDoc.workshopMeta?.learningGoals || [],
        paidConfirmed: false,
        markConverted: false,
        orderId: String(orderDoc._id),
        utm: orderDoc.utm,
        message: isWorkshop
          ? `Workshop booking: ${orderDoc.programTitle || orderDoc.planSnapshot.name}`
          : 'Reserve form submission',
      });
      orderDoc.leadId = leadId;
      await orderDoc.save();
    } catch (err) {
      console.error(
        '[createPublicOrder lead]',
        err instanceof Error ? err.message : 'upsert failed'
      );
    }

    return {
      ok: true,
      publicToken: orderDoc.publicToken,
      orderNumber: orderDoc.orderNumber,
      status: orderDoc.status,
      amounts: {
        basePrice: orderDoc.amounts.basePrice,
        discountAmount: orderDoc.amounts.discountAmount,
        finalPrice: orderDoc.amounts.finalPrice,
        installmentsCount: orderDoc.amounts.installmentsCount,
        totalAmount: orderDoc.amounts.totalAmount,
        currency: orderDoc.planSnapshot.currency,
      },
      holdExpiresAt: holdExpiresAt.toISOString(),
      alreadyExisted: false,
    };
  } catch (err) {
    if (err instanceof SeatError) {
      return {
        ok: false,
        status: 409,
        code: 'sold_out',
        message: 'Sorry, all seats are taken',
      };
    }

    if (isDupKey(err)) {
      await releaseHold(sessionId, String(orderId)).catch(() => undefined);
      const existing = await Order.findOne({
        sessionId,
        'customer.emailNormalized': emailNormalized,
        isLive: true,
      });
      if (!existing) {
        return {
          ok: false,
          status: 409,
          code: 'conflict',
          message: 'Could not create your order. Please try again.',
        };
      }
      if (existing.status === 'approved') {
        return {
          ok: false,
          status: 409,
          code: 'already_confirmed',
          message: 'You already have a confirmed seat for this session',
        };
      }
      if (
        existing.status === 'awaiting_payment' ||
        existing.status === 'pending_verification'
      ) {
        return {
          ok: false,
          status: 409,
          code: 'already_submitted',
          message:
            'You already submitted your form. Admin will shortly review your payment details and send you a seat confirmation email.',
        };
      }
      return {
        ok: false,
        status: 409,
        code: 'conflict',
        message: 'Could not create your order. Please try again.',
      };
    }

    throw err;
  }
}
