/**
 * Server-side coupon validation and price math.
 *
 * IMPORTANT: Every future public checkout / apply-coupon route MUST call
 * validateCoupon() and computeTotals() on the server and NEVER trust a
 * discount amount or final total sent by the browser.
 *
 * These helpers are pure (aside from the data you pass in). Callers load
 * coupons, plans, and redemption counts from the database first.
 */

import { computeCouponState, type CouponStoredStatus } from './state';

export type CouponPricingInput = {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  currency: 'PKR' | 'USD' | '';
  planId: string;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  perEmailLimit: number;
  status: CouponStoredStatus;
  usedCount: number;
  emailUseCount: number;
};

export type PlanPricingInput = {
  id: string;
  type: 'one_time' | 'installment';
  currency: 'PKR' | 'USD';
  price: number;
  installmentsCount: number | null;
};

export type ValidateCouponOk = { ok: true; coupon: CouponPricingInput };
export type ValidateCouponFail = { ok: false; reason: string };
export type ValidateCouponResult = ValidateCouponOk | ValidateCouponFail;

export type ComputeTotalsResult = {
  currency: 'PKR' | 'USD';
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  installmentsCount: number;
  totalAcrossInstallments: number;
};

function asDate(value: Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Validate whether a coupon may be applied right now for a plan + email.
 * Reasons are plain English for UI/toasts.
 */
export function validateCoupon(input: {
  coupon: CouponPricingInput | null | undefined;
  planId: string;
  plan?: PlanPricingInput | null;
  email: string;
  now?: Date;
}): ValidateCouponResult {
  const { coupon, planId, plan, now = new Date() } = input;

  if (!coupon) {
    return { ok: false, reason: 'This coupon code does not exist' };
  }

  const state = computeCouponState({
    status: coupon.status,
    startsAt: asDate(coupon.startsAt),
    endsAt: asDate(coupon.endsAt),
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    now,
  });

  if (state === 'paused' || state === 'archived') {
    return { ok: false, reason: 'This coupon is not active' };
  }
  if (state === 'scheduled') {
    return { ok: false, reason: 'This coupon has not started yet' };
  }
  if (state === 'expired') {
    return { ok: false, reason: 'This coupon has expired' };
  }
  if (state === 'used up') {
    return { ok: false, reason: 'This coupon has reached its usage limit' };
  }

  const emailLimit = Math.max(1, coupon.perEmailLimit || 1);
  if (coupon.emailUseCount >= emailLimit) {
    return { ok: false, reason: 'You have already used this coupon' };
  }

  if (coupon.planId && coupon.planId !== planId) {
    return { ok: false, reason: 'This coupon is not valid for this plan' };
  }

  if (coupon.discountType === 'fixed') {
    if (plan?.type === 'installment') {
      return {
        ok: false,
        reason: 'This coupon does not apply to installment plans',
      };
    }
    if (
      plan &&
      coupon.currency &&
      coupon.currency !== plan.currency
    ) {
      return { ok: false, reason: 'This coupon uses a different currency' };
    }
  }

  return { ok: true, coupon };
}

/**
 * Compute whole-integer totals for a plan + coupon.
 * Percent discounts apply to EACH installment. Fixed discounts only for one-time.
 * finalPrice is never below 0.
 */
export function computeTotals(
  plan: PlanPricingInput,
  coupon: CouponPricingInput | null | undefined
): ComputeTotalsResult {
  const basePrice = Math.max(0, Math.trunc(plan.price));
  const installmentsCount =
    plan.type === 'installment' &&
    plan.installmentsCount != null &&
    plan.installmentsCount >= 2
      ? Math.trunc(plan.installmentsCount)
      : 1;

  if (!coupon) {
    return {
      currency: plan.currency,
      basePrice,
      discountAmount: 0,
      finalPrice: basePrice,
      installmentsCount,
      totalAcrossInstallments: basePrice * installmentsCount,
    };
  }

  let discountAmount = 0;

  if (coupon.discountType === 'percent') {
    const pct = Math.min(100, Math.max(0, Math.trunc(coupon.discountValue)));
    discountAmount = Math.round((basePrice * pct) / 100);
  } else {
    // Fixed: only meaningful for one-time plans with matching currency.
    const value = Math.max(0, Math.trunc(coupon.discountValue));
    discountAmount = Math.min(value, basePrice);
  }

  const finalPrice = Math.max(0, basePrice - discountAmount);

  return {
    currency: plan.currency,
    basePrice,
    discountAmount,
    finalPrice,
    installmentsCount,
    totalAcrossInstallments: finalPrice * installmentsCount,
  };
}
