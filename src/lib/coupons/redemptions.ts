import type { ClientSession } from 'mongoose';
import { CouponRedemption } from '@/models/CouponRedemption';

/** Legacy docs without isActive count as active. */
export const ACTIVE_REDEMPTION_FILTER = {
  isActive: { $ne: false },
} as const;

export async function countRedemptionsByCouponIds(
  ids: string[]
): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (ids.length === 0) return map;

  const rows = await CouponRedemption.aggregate<{
    _id: string;
    count: number;
  }>([
    { $match: { couponId: { $in: ids }, ...ACTIVE_REDEMPTION_FILTER } },
    { $group: { _id: '$couponId', count: { $sum: 1 } } },
  ]);

  for (const row of rows) map.set(String(row._id), row.count);
  for (const id of ids) {
    if (!map.has(id)) map.set(id, 0);
  }
  return map;
}

export async function countRedemptionsForCoupon(id: string): Promise<number> {
  return CouponRedemption.countDocuments({
    couponId: id,
    ...ACTIVE_REDEMPTION_FILTER,
  });
}

export async function countRedemptionsForEmail(
  couponId: string,
  email: string
): Promise<number> {
  return CouponRedemption.countDocuments({
    couponId,
    email: email.trim().toLowerCase(),
    ...ACTIVE_REDEMPTION_FILTER,
  });
}

export async function deactivateRedemptionsForOrder(
  orderId: string,
  opts: { session?: ClientSession | null } = {}
): Promise<void> {
  await CouponRedemption.updateMany(
    { orderId, isActive: { $ne: false } },
    { $set: { isActive: false } },
    { ...(opts.session ? { session: opts.session } : {}) }
  );
}
