import { Order, type OrderDocument, type OrderStatus } from '@/models/Order';
import { isLiveForStatus } from './isLive';
import {
  confirmSeat,
  releaseConfirmedSeat,
  releaseHold,
  SeatError,
} from './seats';
import { withOrdersTransaction, type TxMode } from './tx';
import { deactivateRedemptionsForOrder } from '@/lib/coupons/redemptions';
import {
  cancelReservationEmailJob,
  ensureReservationEmailJob,
} from '@/lib/email/outbox';
import { ensureEmailJobIndexes } from '@/lib/email/syncIndexes';

export type TransitionResult =
  | {
      ok: true;
      order: OrderDocument;
      mode: TxMode;
      emailJobId?: string;
    }
  | { ok: false; status: 409 | 400; error: string; mode?: TxMode };

export async function approveOrder(
  orderId: string,
  adminId: string
): Promise<TransitionResult> {
  const existing = await Order.findById(orderId);
  if (!existing) {
    return { ok: false, status: 400, error: 'Booking not found' };
  }
  if (existing.status !== 'pending_verification') {
    return { ok: false, status: 409, error: 'Already handled' };
  }

  try {
    await ensureEmailJobIndexes();
    const { result, mode } = await withOrdersTransaction(async (session) => {
      const updated = await Order.findOneAndUpdate(
        {
          _id: existing._id,
          status: 'pending_verification',
        },
        {
          $set: {
            status: 'approved' satisfies OrderStatus,
            isLive: isLiveForStatus('approved'),
          },
          $inc: { version: 1 },
          $push: {
            events: {
              type: 'approved',
              at: new Date(),
              adminId,
              note: 'Payment approved — seat confirmed',
            },
          },
        },
        { new: true, ...(session ? { session } : {}) }
      );

      if (!updated) {
        const err = new Error('Already handled');
        (err as Error & { code: string }).code = 'ALREADY_HANDLED';
        throw err;
      }

      let emailJobId = '';
      try {
        await confirmSeat(existing.sessionId, String(existing._id), {
          session,
        });

        // Create email job only after seat confirm succeeds (idempotent upsert).
        const job = await ensureReservationEmailJob(
          String(existing._id),
          existing.customer.email,
          { session }
        );
        emailJobId = String(job._id);
      } catch (seatErr) {
        if (!session) {
          // Compensating mode: revert the order status change and kill any job.
          await Order.findOneAndUpdate(
            { _id: existing._id, status: 'approved' },
            {
              $set: {
                status: 'pending_verification',
                isLive: isLiveForStatus('pending_verification'),
              },
              $inc: { version: 1 },
              $pull: {
                events: { type: 'approved', adminId },
              },
            }
          );
          await cancelReservationEmailJob(String(existing._id));
        }
        throw seatErr;
      }

      return { order: updated, emailJobId };
    });

    return {
      ok: true,
      order: result.order,
      mode,
      emailJobId: result.emailJobId || undefined,
    };
  } catch (err) {
    if (err instanceof Error && (err as { code?: string }).code === 'ALREADY_HANDLED') {
      return { ok: false, status: 409, error: 'Already handled' };
    }
    if (err instanceof SeatError) {
      return { ok: false, status: 400, error: err.message };
    }
    if (err instanceof Error && err.message === 'Already handled') {
      return { ok: false, status: 409, error: 'Already handled' };
    }
    throw err;
  }
}

export async function rejectOrder(
  orderId: string,
  adminId: string,
  reason: string,
  note: string
): Promise<TransitionResult> {
  const existing = await Order.findById(orderId);
  if (!existing) {
    return { ok: false, status: 400, error: 'Booking not found' };
  }
  if (
    existing.status !== 'pending_verification' &&
    existing.status !== 'awaiting_payment'
  ) {
    return { ok: false, status: 409, error: 'Already handled' };
  }

  const prevStatus = existing.status;
  const noteText = note.trim()
    ? `${reason} — ${note.trim()}`
    : reason;

  try {
    const { result, mode } = await withOrdersTransaction(async (session) => {
      const updated = await Order.findOneAndUpdate(
        {
          _id: existing._id,
          status: { $in: ['pending_verification', 'awaiting_payment'] },
        },
        {
          $set: {
            status: 'rejected' satisfies OrderStatus,
            isLive: isLiveForStatus('rejected'),
            rejectionReason: reason,
          },
          $inc: { version: 1 },
          $push: {
            events: {
              type: 'rejected',
              at: new Date(),
              adminId,
              note: noteText,
            },
          },
        },
        { new: true, ...(session ? { session } : {}) }
      );

      if (!updated) {
        const err = new Error('Already handled');
        (err as Error & { code: string }).code = 'ALREADY_HANDLED';
        throw err;
      }

      try {
        await releaseHold(existing.sessionId, String(existing._id), {
          session,
        });
        await deactivateRedemptionsForOrder(String(existing._id), { session });
      } catch (seatErr) {
        if (!session) {
          await Order.findOneAndUpdate(
            { _id: existing._id, status: 'rejected' },
            {
              $set: {
                status: prevStatus,
                isLive: isLiveForStatus(prevStatus),
                rejectionReason: '',
              },
              $inc: { version: 1 },
              $pull: {
                events: { type: 'rejected', adminId },
              },
            }
          );
        }
        throw seatErr;
      }

      return updated;
    });

    return { ok: true, order: result, mode };
  } catch (err) {
    if (
      err instanceof Error &&
      ((err as { code?: string }).code === 'ALREADY_HANDLED' ||
        err.message === 'Already handled')
    ) {
      return { ok: false, status: 409, error: 'Already handled' };
    }
    throw err;
  }
}

export async function cancelOrder(
  orderId: string,
  adminId: string,
  note: string
): Promise<TransitionResult> {
  const existing = await Order.findById(orderId);
  if (!existing) {
    return { ok: false, status: 400, error: 'Booking not found' };
  }
  if (existing.status !== 'approved') {
    return {
      ok: false,
      status: 400,
      error: 'Only approved orders can be cancelled',
    };
  }

  try {
    const { result, mode } = await withOrdersTransaction(async (session) => {
      const updated = await Order.findOneAndUpdate(
        {
          _id: existing._id,
          status: 'approved',
        },
        {
          $set: {
            status: 'cancelled' satisfies OrderStatus,
            isLive: isLiveForStatus('cancelled'),
          },
          $inc: { version: 1 },
          $push: {
            events: {
              type: 'cancelled',
              at: new Date(),
              adminId,
              note: note.trim() || 'Booking cancelled — seat released',
            },
          },
        },
        { new: true, ...(session ? { session } : {}) }
      );

      if (!updated) {
        const err = new Error('Already handled');
        (err as Error & { code: string }).code = 'ALREADY_HANDLED';
        throw err;
      }

      try {
        await releaseConfirmedSeat(existing.sessionId, { session });
        await deactivateRedemptionsForOrder(String(existing._id), { session });
      } catch (seatErr) {
        if (!session) {
          await Order.findOneAndUpdate(
            { _id: existing._id, status: 'cancelled' },
            {
              $set: {
                status: 'approved',
                isLive: isLiveForStatus('approved'),
              },
              $inc: { version: 1 },
              $pull: {
                events: { type: 'cancelled', adminId },
              },
            }
          );
        }
        throw seatErr;
      }

      return updated;
    });

    return { ok: true, order: result, mode };
  } catch (err) {
    if (
      err instanceof Error &&
      ((err as { code?: string }).code === 'ALREADY_HANDLED' ||
        err.message === 'Already handled')
    ) {
      return { ok: false, status: 409, error: 'Already handled' };
    }
    throw err;
  }
}
