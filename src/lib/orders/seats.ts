/**
 * Atomic seat hold / confirm / release against the sessions document.
 * available = max(0, seatsTotal - seatsConfirmed - activeHolds) — never stored.
 */
import mongoose, { type ClientSession } from 'mongoose';
import { Session } from '@/models/Session';
import { getCheckoutHoldMinutes } from './holdMinutes';

/** @deprecated Prefer getCheckoutHoldMinutes() — value is resolved at module load. */
export const CHECKOUT_HOLD_MINUTES = getCheckoutHoldMinutes();
export { getCheckoutHoldMinutes };

export class SeatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeatError';
  }
}

type SessionOpts = { session?: ClientSession | null };

function oid(sessionId: string) {
  return new mongoose.Types.ObjectId(sessionId);
}

/**
 * Hold a seat for checkout. Fails with "sold out" when none available or not open.
 * ONE atomic update with $expr guards.
 */
export async function holdSeat(
  sessionId: string,
  orderId: string,
  minutes: number = getCheckoutHoldMinutes(),
  opts: SessionOpts = {}
): Promise<Date> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + Math.max(1, minutes) * 60_000);

  const updated = await Session.findOneAndUpdate(
    {
      _id: oid(sessionId),
      status: 'open',
      $expr: {
        $gt: [
          {
            $subtract: [
              '$seatsTotal',
              {
                $add: [
                  '$seatsConfirmed',
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ['$holds', []] },
                        as: 'h',
                        cond: { $gt: ['$$h.expiresAt', now] },
                      },
                    },
                  },
                ],
              },
            ],
          },
          0,
        ],
      },
      'holds.orderId': { $ne: orderId },
    },
    {
      $push: { holds: { orderId, expiresAt } },
      $inc: { version: 1 },
    },
    { new: true, ...(opts.session ? { session: opts.session } : {}) }
  );

  if (!updated) {
    throw new SeatError('sold out');
  }
  return expiresAt;
}

/** Move an existing hold's expiry (e.g. after proof upload → session.holdHours). */
export async function extendHold(
  sessionId: string,
  orderId: string,
  newExpiry: Date,
  opts: SessionOpts = {}
): Promise<boolean> {
  const updated = await Session.findOneAndUpdate(
    {
      _id: oid(sessionId),
      'holds.orderId': orderId,
    },
    {
      $set: { 'holds.$.expiresAt': newExpiry },
      $inc: { version: 1 },
    },
    { new: true, ...(opts.session ? { session: opts.session } : {}) }
  );
  return Boolean(updated);
}

/**
 * Confirm a seat: pull hold and inc seatsConfirmed.
 * If the hold is gone, re-take a seat only when available > 0.
 */
export async function confirmSeat(
  sessionId: string,
  orderId: string,
  opts: SessionOpts = {}
): Promise<void> {
  const now = new Date();
  const sid = oid(sessionId);

  // Path A: hold still present — remove it and confirm.
  const withHold = await Session.findOneAndUpdate(
    {
      _id: sid,
      'holds.orderId': orderId,
    },
    {
      $pull: { holds: { orderId } },
      $inc: { seatsConfirmed: 1, version: 1 },
    },
    { new: true, ...(opts.session ? { session: opts.session } : {}) }
  );
  if (withHold) return;

  // Path B: hold expired/missing — claim a free seat atomically.
  const retake = await Session.findOneAndUpdate(
    {
      _id: sid,
      status: 'open',
      $expr: {
        $gt: [
          {
            $subtract: [
              '$seatsTotal',
              {
                $add: [
                  '$seatsConfirmed',
                  {
                    $size: {
                      $filter: {
                        input: { $ifNull: ['$holds', []] },
                        as: 'h',
                        cond: { $gt: ['$$h.expiresAt', now] },
                      },
                    },
                  },
                ],
              },
            ],
          },
          0,
        ],
      },
    },
    {
      $inc: { seatsConfirmed: 1, version: 1 },
    },
    { new: true, ...(opts.session ? { session: opts.session } : {}) }
  );

  if (!retake) {
    throw new SeatError(
      'The seat hold expired and the session is full'
    );
  }
}

export async function releaseHold(
  sessionId: string,
  orderId: string,
  opts: SessionOpts = {}
): Promise<void> {
  await Session.findOneAndUpdate(
    { _id: oid(sessionId) },
    {
      $pull: { holds: { orderId } },
      $inc: { version: 1 },
    },
    { ...(opts.session ? { session: opts.session } : {}) }
  );
}

/** Used when an approved order is cancelled. Never goes below 0. */
export async function releaseConfirmedSeat(
  sessionId: string,
  opts: SessionOpts = {}
): Promise<void> {
  await Session.findOneAndUpdate(
    {
      _id: oid(sessionId),
      seatsConfirmed: { $gt: 0 },
    },
    {
      $inc: { seatsConfirmed: -1, version: 1 },
    },
    { ...(opts.session ? { session: opts.session } : {}) }
  );
}

/** Best-effort cleanup — correctness never depends on this. */
export async function cleanupExpiredHolds(
  sessionId?: string,
  opts: SessionOpts = {}
): Promise<number> {
  const now = new Date();
  const filter: Record<string, unknown> = {
    'holds.expiresAt': { $lte: now },
  };
  if (sessionId) filter._id = oid(sessionId);

  const res = await Session.updateMany(
    filter,
    {
      $pull: { holds: { expiresAt: { $lte: now } } },
      $inc: { version: 1 },
    },
    { ...(opts.session ? { session: opts.session } : {}) }
  );
  return res.modifiedCount ?? 0;
}

export function holdStillActive(
  holds: Array<{ orderId?: string; expiresAt: Date | string }> | undefined,
  orderId: string,
  now = new Date()
): boolean {
  const h = (holds ?? []).find((x) => x.orderId === orderId);
  if (!h) return false;
  const exp = h.expiresAt instanceof Date ? h.expiresAt : new Date(h.expiresAt);
  return exp.getTime() > now.getTime();
}
