import type { ClientSession } from 'mongoose';
import { EmailJob, type EmailJobDocument } from '@/models/EmailJob';
import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import { connectToDatabase } from '@/lib/db';
import { getEmailDailyLimit } from './config';
import { sendOutboundEmail } from './sender';
import { buildReservationConfirmedEmail } from './templates/reservationConfirmed';

const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  12 * 60 * 60_000,
  12 * 60 * 60_000,
];

export type PublicEmailStatus =
  | 'sent'
  | 'pending'
  | 'failed'
  | 'skipped'
  | 'not_sent';

export function mapJobToPublicStatus(
  job: Pick<EmailJobDocument, 'status'> | null | undefined
): PublicEmailStatus {
  if (!job) return 'not_sent';
  if (job.status === 'sent') return 'sent';
  if (job.status === 'pending') return 'pending';
  if (job.status === 'failed') return 'failed';
  if (job.status === 'skipped') return 'skipped';
  return 'not_sent';
}

export function emailStatusLabel(status: PublicEmailStatus): string {
  switch (status) {
    case 'sent':
      return 'Sent';
    case 'pending':
      return 'Pending';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Not sent';
  }
}

function nextBackoff(attemptsAfterFail: number): Date {
  const idx = Math.min(
    Math.max(attemptsAfterFail - 1, 0),
    BACKOFF_MS.length - 1
  );
  return new Date(Date.now() + BACKOFF_MS[idx]);
}

/**
 * Idempotent upsert of a reservation_confirmed job.
 * Re-activates skipped/failed/pending jobs after compensating approve reverts;
 * leaves an already-sent job untouched.
 */
export async function ensureReservationEmailJob(
  orderId: string,
  to: string,
  opts?: { session?: ClientSession | null }
): Promise<EmailJobDocument> {
  await connectToDatabase();
  const session = opts?.session ?? null;
  const existing = await EmailJob.findOne(
    { orderId, type: 'reservation_confirmed' },
    null,
    session ? { session } : undefined
  );
  if (existing?.status === 'sent') {
    return existing;
  }

  const updated = await EmailJob.findOneAndUpdate(
    { orderId, type: 'reservation_confirmed' },
    {
      $setOnInsert: {
        orderId,
        type: 'reservation_confirmed',
        attempts: 0,
        sentCount: 0,
        sendLog: [],
        sentAt: null,
      },
      $set: {
        to,
        status: 'pending',
        lastError: '',
        lastNote: '',
        nextAttemptAt: new Date(),
      },
    },
    {
      upsert: true,
      new: true,
      ...(session ? { session } : {}),
    }
  );
  return updated!;
}

/** Remove or mark job when compensating approve is reverted. */
export async function cancelReservationEmailJob(
  orderId: string
): Promise<void> {
  await connectToDatabase();
  await EmailJob.findOneAndUpdate(
    { orderId, type: 'reservation_confirmed', status: { $in: ['pending', 'failed'] } },
    {
      $set: {
        status: 'skipped',
        lastError: 'Order is no longer approved',
        nextAttemptAt: new Date(Date.now() + 365 * 24 * 60 * 60_000),
      },
    }
  );
}

async function dailySentCount(): Promise<number> {
  const since = new Date(Date.now() - 24 * 60 * 60_000);
  return EmailJob.countDocuments({
    status: 'sent',
    sentAt: { $gte: since },
  });
}

async function buildMailForOrder(orderId: string) {
  const order = await Order.findById(orderId).lean();
  if (!order) return { error: 'Booking not found' as const };
  if (order.status !== 'approved') {
    return { error: 'Order is no longer approved' as const, order };
  }
  const session = await Session.findById(order.sessionId).lean();
  if (!session?.startsAt) {
    return { error: 'Session details are missing' as const, order };
  }

  const mail = buildReservationConfirmedEmail({
    orderId: String(order._id),
    customerName: order.customer.name,
    customerEmail: order.customer.email,
    orderNumber: order.orderNumber,
    publicToken: order.publicToken,
    planName: order.planSnapshot.name,
    currency: order.planSnapshot.currency,
    amountPaid: order.amounts.finalPrice,
    sessionTitle: session.title || 'AhmiXen live session',
    startsAt: new Date(session.startsAt),
    durationMinutes: session.durationMinutes || 150,
    timezone: session.timezone || 'Asia/Karachi',
    meetingLink: session.meetingLink || '',
  });
  return { mail, order };
}

export async function attemptSendEmailJob(
  jobId: string
): Promise<{ status: PublicEmailStatus; reason?: string }> {
  await connectToDatabase();

  const limit = getEmailDailyLimit();
  const sentToday = await dailySentCount();
  if (sentToday >= limit) {
    await EmailJob.findByIdAndUpdate(jobId, {
      $set: {
        lastError: 'Daily sending limit reached.',
        nextAttemptAt: new Date(Date.now() + 60 * 60_000),
      },
    });
    return { status: 'pending', reason: 'Daily sending limit reached.' };
  }

  const job = await EmailJob.findById(jobId);
  if (!job) return { status: 'not_sent' };

  const built = await buildMailForOrder(job.orderId);
  // Never send unless the order still exists and is approved.
  if (
    'error' in built &&
    (built.error === 'Order is no longer approved' ||
      built.error === 'Booking not found')
  ) {
    job.status = 'skipped';
    job.lastError = 'Order is no longer approved';
    await job.save();
    return { status: 'skipped', reason: job.lastError };
  }
  if (!('mail' in built) || !built.mail) {
    job.status = 'failed';
    job.attempts += 1;
    job.lastError = built.error || 'Email could not be sent.';
    job.nextAttemptAt = nextBackoff(job.attempts);
    await job.save();
    return { status: 'failed', reason: job.lastError };
  }

  const result = await sendOutboundEmail(built.mail);
  if (result.status === 'skipped') {
    job.status = 'skipped';
    job.lastError = result.reason;
    job.attempts += 1;
    await job.save();
    return { status: 'skipped', reason: result.reason };
  }
  if (result.status === 'sent') {
    const now = new Date();
    const windowStart = now.getTime() - 24 * 60 * 60_000;
    const prior = asDateList(job.sendLog).filter(
      (d) => d.getTime() >= windowStart
    );
    prior.push(now);
    job.status = 'sent';
    job.sentCount = (job.sentCount || 0) + 1;
    job.sentAt = now;
    job.set('sendLog', prior);
    job.lastError = '';
    job.lastNote = result.note || '';
    job.attempts += 1;
    await job.save();
    return { status: 'sent' };
  }

  job.status = 'failed';
  job.attempts += 1;
  job.lastError = result.reason;
  job.nextAttemptAt = nextBackoff(job.attempts);
  await job.save();
  return { status: 'failed', reason: result.reason };
}

/**
 * Atomically claim due jobs and attempt send. Safe for concurrent admins.
 */
export async function processDueEmailJobs(limit = 5): Promise<number> {
  await connectToDatabase();
  let processed = 0;
  for (let i = 0; i < limit; i += 1) {
    const now = new Date();
    const claimed = await EmailJob.findOneAndUpdate(
      {
        status: { $in: ['pending', 'failed'] },
        attempts: { $lt: MAX_ATTEMPTS },
        nextAttemptAt: { $lte: now },
      },
      {
        $set: {
          // Soft claim: push nextAttemptAt briefly so another worker skips it
          nextAttemptAt: new Date(Date.now() + 60_000),
        },
      },
      { sort: { nextAttemptAt: 1 }, new: true }
    );
    if (!claimed) break;
    await attemptSendEmailJob(String(claimed._id));
    processed += 1;
  }
  return processed;
}

function asDateList(raw: unknown): Date[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((d) => {
      if (d instanceof Date) return d;
      if (typeof d === 'string' || typeof d === 'number') return new Date(d);
      return null;
    })
    .filter((d): d is Date => d != null && !Number.isNaN(d.getTime()));
}

export async function countSendsLast24h(orderId: string): Promise<number> {
  const job = await EmailJob.findOne({
    orderId,
    type: 'reservation_confirmed',
  }).lean();
  if (!job) return 0;
  const windowStart = Date.now() - 24 * 60 * 60_000;
  return asDateList(job.sendLog).filter((d) => d.getTime() >= windowStart)
    .length;
}

/**
 * Create-or-reset job and send for an approved order (Send / Resend).
 */
export async function queueAndSendConfirmationEmail(
  orderId: string
): Promise<{
  ok: boolean;
  status: PublicEmailStatus;
  reason?: string;
  error?: string;
}> {
  await connectToDatabase();
  const order = await Order.findById(orderId).lean();
  if (!order) return { ok: false, status: 'not_sent', error: 'Booking not found' };
  if (order.status !== 'approved') {
    return {
      ok: false,
      status: 'not_sent',
      error: 'Only approved bookings can receive a confirmation email',
    };
  }

  const existing = await EmailJob.findOne({
    orderId,
    type: 'reservation_confirmed',
  });
  if (existing) {
    const sends = await countSendsLast24h(orderId);
    if (sends >= 3) {
      return {
        ok: false,
        status: mapJobToPublicStatus(existing),
        error: 'You can send at most 3 confirmation emails per booking every 24 hours.',
      };
    }
    existing.status = 'pending';
    existing.lastError = '';
    existing.nextAttemptAt = new Date();
    await existing.save();
    const result = await attemptSendEmailJob(String(existing._id));
    return { ok: true, status: result.status, reason: result.reason };
  }

  const job = await ensureReservationEmailJob(
    orderId,
    order.customer.email
  );
  const result = await attemptSendEmailJob(String(job._id));
  return { ok: true, status: result.status, reason: result.reason };
}

export async function getJobsForOrderIds(
  orderIds: string[]
): Promise<Map<string, EmailJobDocument>> {
  const map = new Map<string, EmailJobDocument>();
  if (orderIds.length === 0) return map;
  const jobs = await EmailJob.find({
    orderId: { $in: orderIds },
    type: 'reservation_confirmed',
  }).lean();
  for (const j of jobs) {
    map.set(j.orderId, j as EmailJobDocument);
  }
  return map;
}
