import mongoose from 'mongoose';
import { Plan } from '@/models/Plan';
import type { z } from 'zod';
import type { couponFieldsSchema } from './schema';

type CouponFields = z.infer<typeof couponFieldsSchema>;

/** Extra DB-backed rules for create/update (plan match, usage floor, etc.). */
export async function assertCouponBusinessRules(
  data: CouponFields,
  opts: { usedCount?: number } = {}
): Promise<string | null> {
  const usedCount = opts.usedCount ?? 0;

  if (
    data.usageLimit != null &&
    Number.isInteger(data.usageLimit) &&
    data.usageLimit < usedCount
  ) {
    return `Total uses cannot be lower than the current used count (${usedCount})`;
  }

  if (data.planId) {
    if (!mongoose.isValidObjectId(data.planId)) {
      return 'Choose a valid plan or All plans';
    }
    const plan = await Plan.findById(data.planId)
      .select({ type: 1, currency: 1, price: 1, status: 1, name: 1 })
      .lean();
    if (!plan || plan.status === 'archived') {
      return 'Choose a valid plan or All plans';
    }

    if (data.discountType === 'fixed') {
      if (plan.type === 'installment') {
        return 'Fixed amount coupons cannot be tied to an installment plan';
      }
      if (data.currency && data.currency !== plan.currency) {
        return 'Coupon currency must match the selected plan currency';
      }
      if (data.discountValue >= plan.price) {
        return 'Fixed discount must be lower than the plan price';
      }
    }
  }

  return null;
}

export function isMongoDuplicateKey(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  );
}

export function duplicateKeyField(err: unknown): string | null {
  if (!isMongoDuplicateKey(err)) return null;
  const key =
    typeof err === 'object' &&
    err !== null &&
    'keyPattern' in err &&
    typeof (err as { keyPattern?: Record<string, number> }).keyPattern ===
      'object'
      ? (err as { keyPattern: Record<string, number> }).keyPattern
      : null;
  if (!key) return null;
  if ('code' in key) return 'code';
  if ('isPopupCoupon' in key) return 'isPopupCoupon';
  return null;
}
