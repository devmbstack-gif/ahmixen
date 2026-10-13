import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { Plan } from '@/models/Plan';
import { Session } from '@/models/Session';
import { Lead } from '@/models/Lead';
import { CouponRedemption } from '@/models/CouponRedemption';
import { connectToDatabase } from '@/lib/db';
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
import { loadCouponForPricing } from '@/lib/public/couponLoad';
import { validateCoupon, computeTotals } from '@/lib/coupons/pricing';
import { ALLOW_INSTALLMENTS } from '@/lib/public/checkoutConfig';
import { normalizeCouponCode } from '@/lib/coupons/code';
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
  couponCode?: string;
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
  const planInput = {
    id: String(plan._id),
    type: plan.type as 'one_time' | 'installment',
    currency: plan.currency as 'PKR' | 'USD',
    price: plan.price,
    installmentsCount: plan.installmentsCount ?? null,
  };

  let couponSnap: {
    couponId: string;
    code: string;
    discountAmount: number;
  } | null = null;
  let pricedCoupon: Awaited<ReturnType<typeof loadCouponForPricing>> = null;

  if (input.couponCode?.trim()) {
    pricedCoupon = await loadCouponForPricing(
      normalizeCouponCode(input.couponCode),
      emailNormalized
    );
    const check = validateCoupon({
      coupon: pricedCoupon,
      planId: planInput.id,
      plan: planInput,
      email: emailNormalized,
    });
    if (!check.ok) {
      return {
        ok: false,
        status: 400,
        code: 'invalid_coupon',
        message:
          check.reason === 'You have already used this coupon'
            ? check.reason
            : 'This coupon code is not valid',
      };
    }
    pricedCoupon = check.coupon;
  }

  const finalTotals = computeTotals(planInput, pricedCoupon);
  if (pricedCoupon) {
    couponSnap = {
      couponId: pricedCoupon.id,
      code: pricedCoupon.code,
      discountAmount: finalTotals.discountAmount,
    };
  }

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
            coupon: couponSnap,
            amounts: {
              basePrice: finalTotals.basePrice,
              discountAmount: finalTotals.discountAmount,
              finalPrice: finalTotals.finalPrice,
              installmentsCount: finalTotals.installmentsCount,
              totalAmount: finalTotals.totalAcrossInstallments,
            },
            paymentMethod: 'bank_transfer',
            proof: null,
            status: 'awaiting_payment',
            isLive: isLiveForStatus('awaiting_payment'),
            rejectionReason: '',
            adminNote: '',
            events: [{ type: 'created', at: new Date(), note: 'Booking created' }],
            utm: {
              source: input.utm?.source || '',
              medium: input.utm?.medium || '',
              campaign: input.utm?.campaign || '',
              content: input.utm?.content || '',
              term: input.utm?.term || '',
            },
            leadId: '',
            isTestData:
              Boolean(input.isTestData) ||
              emailNormalized.endsWith('@checkout-test.invalid'),
            version: 1,
          },
        ],
        { session: mongoSession ?? undefined }
      );

      if (couponSnap) {
        await CouponRedemption.create(
          [
            {
              couponId: couponSnap.couponId,
              orderId: String(orderId),
              email: emailNormalized,
              isActive: true,
            },
          ],
          { session: mongoSession ?? undefined }
        );
      }

      return { doc: doc!, holdExpiresAt };
    });

    const orderDoc = result.doc;
    const holdExpiresAt = result.holdExpiresAt;

    const lead = await Lead.findOne({ emailNormalized });
    if (lead) {
      lead.status = 'converted';
      lead.convertedOrderId = String(orderDoc._id);
      lead.lastSeenAt = new Date();
      orderDoc.leadId = String(lead._id);
      await Promise.all([lead.save(), orderDoc.save()]);
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
      return {
        ok: true,
        publicToken: existing.publicToken,
        orderNumber: existing.orderNumber,
        status: existing.status,
        amounts: {
          basePrice: existing.amounts.basePrice,
          discountAmount: existing.amounts.discountAmount,
          finalPrice: existing.amounts.finalPrice,
          installmentsCount: existing.amounts.installmentsCount,
          totalAmount: existing.amounts.totalAmount,
          currency: existing.planSnapshot.currency,
        },
        holdExpiresAt: null,
        alreadyExisted: true,
      };
    }

    throw err;
  }
}
