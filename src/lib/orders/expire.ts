import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import { isLiveForStatus } from './isLive';
import { releaseHold } from './seats';
import { withOrdersTransaction } from './tx';
import { ensureOrderIndexes } from './syncIndexes';
import { deactivateRedemptionsForOrder } from '@/lib/coupons/redemptions';

/**
 * Mark awaiting_payment orders whose seat hold has expired.
 * pending_verification is NEVER auto-expired.
 * Updates orders + sessions together (transaction when available).
 */
export async function expireStaleOrders(now = new Date()): Promise<number> {
  await ensureOrderIndexes();

  const candidates = await Order.find({
    status: 'awaiting_payment',
    isLive: true,
  })
    .select({ _id: 1, sessionId: 1 })
    .lean();

  if (candidates.length === 0) return 0;

  const sessionIds = Array.from(new Set(candidates.map((c) => c.sessionId)));
  const sessions = await Session.find({ _id: { $in: sessionIds } })
    .select({ holds: 1 })
    .lean();
  const holdMap = new Map<string, Array<{ orderId: string; expiresAt: Date }>>();
  for (const s of sessions) {
    holdMap.set(
      String(s._id),
      (s.holds ?? []).map((h) => ({
        orderId: String(h.orderId),
        expiresAt:
          h.expiresAt instanceof Date ? h.expiresAt : new Date(h.expiresAt),
      }))
    );
  }

  let expired = 0;
  for (const c of candidates) {
    const orderId = String(c._id);
    const holds = holdMap.get(c.sessionId) ?? [];
    const hold = holds.find((h) => h.orderId === orderId);
    const holdAlive = hold && hold.expiresAt.getTime() > now.getTime();
    if (holdAlive) continue;

    try {
      await withOrdersTransaction(async (mongoSession) => {
        const updated = await Order.findOneAndUpdate(
          {
            _id: c._id,
            status: 'awaiting_payment',
            isLive: true,
          },
          {
            $set: {
              status: 'expired',
              isLive: isLiveForStatus('expired'),
            },
            $inc: { version: 1 },
            $push: {
              events: {
                type: 'expired',
                at: now,
                note: 'Checkout hold ended without payment proof',
              },
            },
          },
          {
            new: true,
            ...(mongoSession ? { session: mongoSession } : {}),
          }
        );
        if (!updated) return;

        await releaseHold(c.sessionId, orderId, { session: mongoSession });
        await deactivateRedemptionsForOrder(orderId, { session: mongoSession });
      });
      expired += 1;
    } catch (err) {
      console.error(
        '[expireStaleOrders]',
        orderId,
        err instanceof Error ? err.message : 'error'
      );
    }
  }

  return expired;
}
