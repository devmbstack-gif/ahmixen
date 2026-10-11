import mongoose from 'mongoose';
import { Plan } from '@/models/Plan';
import { connectToDatabase } from '@/lib/db';
import { couponCheckFieldsSchema } from '@/lib/public/schema';
import {
  assertPublicOrigin,
  publicError,
  publicOk,
  publicRateLimited,
} from '@/lib/public/response';
import {
  rateLimit,
  rateLimitIdentityKey,
  rateLimitKey,
} from '@/lib/public/rateLimit';
import { PUBLIC_RATE_LIMITS } from '@/lib/public/rateLimitConfig';
import { loadCouponForPricing } from '@/lib/public/couponLoad';
import { validateCoupon, computeTotals } from '@/lib/coupons/pricing';
import { ALLOW_INSTALLMENTS } from '@/lib/public/checkoutConfig';
import { normalizeCouponCode } from '@/lib/coupons/code';

const GENERIC = 'This coupon code is not valid';

export async function POST(request: Request) {
  try {
    if (!assertPublicOrigin(request)) {
      return publicError('forbidden', 'Forbidden', 403);
    }

    const ipRule = PUBLIC_RATE_LIMITS.couponsIp;
    const rlIp = await rateLimit(
      rateLimitKey('public:coupons-check', request),
      ipRule.limit,
      ipRule.windowSeconds
    );
    if (!rlIp.ok) return publicRateLimited(rlIp.retryAfterSeconds);

    const body = await request.json().catch(() => null);
    const parsed = couponCheckFieldsSchema.safeParse(body);
    if (!parsed.success) {
      return publicError('invalid_coupon', GENERIC, 400);
    }

    const emailRule = PUBLIC_RATE_LIMITS.couponsEmail;
    const rlEmail = await rateLimit(
      rateLimitIdentityKey('public:coupons-check:email', parsed.data.email),
      emailRule.limit,
      emailRule.windowSeconds
    );
    if (!rlEmail.ok) return publicRateLimited(rlEmail.retryAfterSeconds);

    await connectToDatabase();
    const { code, planId, email } = parsed.data;

    if (!mongoose.isValidObjectId(planId)) {
      return publicError('invalid_coupon', GENERIC, 400);
    }

    const plan = await Plan.findById(planId).lean();
    if (!plan || plan.status !== 'active') {
      return publicError('invalid_coupon', GENERIC, 400);
    }
    if (!ALLOW_INSTALLMENTS && plan.type !== 'one_time') {
      return publicError('invalid_coupon', GENERIC, 400);
    }

    const coupon = await loadCouponForPricing(normalizeCouponCode(code), email);
    const planInput = {
      id: String(plan._id),
      type: plan.type as 'one_time' | 'installment',
      currency: plan.currency as 'PKR' | 'USD',
      price: plan.price,
      installmentsCount: plan.installmentsCount ?? null,
    };

    const check = validateCoupon({
      coupon,
      planId: planInput.id,
      plan: planInput,
      email,
    });

    if (!check.ok) {
      if (check.reason === 'You have already used this coupon') {
        return publicError('coupon_used', check.reason, 400);
      }
      return publicError('invalid_coupon', GENERIC, 400);
    }

    const totals = computeTotals(planInput, check.coupon);
    return publicOk({
      currency: totals.currency,
      basePrice: totals.basePrice,
      discountAmount: totals.discountAmount,
      finalPrice: totals.finalPrice,
    });
  } catch (err) {
    console.error(
      '[public coupons/check]',
      err instanceof Error ? err.name : 'error'
    );
    return publicError('server_error', 'Something went wrong', 500);
  }
}
