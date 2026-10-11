import { Coupon } from '@/models/Coupon';
import { normalizeCouponCode } from '@/lib/coupons/code';
import {
  countRedemptionsForCoupon,
  countRedemptionsForEmail,
} from '@/lib/coupons/redemptions';
import type { CouponPricingInput } from '@/lib/coupons/pricing';
import type { CouponStoredStatus } from '@/lib/coupons/state';

export async function loadCouponForPricing(
  code: string,
  email: string
): Promise<CouponPricingInput | null> {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return null;
  const doc = await Coupon.findOne({ code: normalized }).lean();
  if (!doc) return null;

  const couponId = String(doc._id);
  const [usedCount, emailUseCount] = await Promise.all([
    countRedemptionsForCoupon(couponId),
    countRedemptionsForEmail(couponId, email),
  ]);

  return {
    id: couponId,
    code: String(doc.code),
    discountType: doc.discountType as 'percent' | 'fixed',
    discountValue: Number(doc.discountValue),
    currency: (doc.currency || '') as 'PKR' | 'USD' | '',
    planId: doc.planId || '',
    startsAt: doc.startsAt ? new Date(doc.startsAt) : null,
    endsAt: doc.endsAt ? new Date(doc.endsAt) : null,
    usageLimit: doc.usageLimit ?? null,
    perEmailLimit: Math.max(1, Number(doc.perEmailLimit) || 1),
    status: doc.status as CouponStoredStatus,
    usedCount,
    emailUseCount,
  };
}
