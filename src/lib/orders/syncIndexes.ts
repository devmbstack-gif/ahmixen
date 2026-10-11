import { Order } from '@/models/Order';
import { Counter } from '@/models/Counter';
import { CouponRedemption } from '@/models/CouponRedemption';
import { Lead } from '@/models/Lead';
import { RateLimit } from '@/models/RateLimit';

let syncPromise: Promise<void> | null = null;

/** Ensure order-related indexes exist (autoIndex may be off). Safe to call often. */
export async function ensureOrderIndexes(): Promise<void> {
  if (!syncPromise) {
    syncPromise = (async () => {
      await Counter.init();
      await Order.syncIndexes();
      await CouponRedemption.syncIndexes();
      await Lead.syncIndexes();
      await RateLimit.syncIndexes();
    })().catch((err) => {
      syncPromise = null;
      throw err;
    });
  }
  await syncPromise;
}
