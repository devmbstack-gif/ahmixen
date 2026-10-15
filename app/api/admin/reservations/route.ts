import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import { serverError, withAdminRead } from '@/lib/sessions/api-helpers';
import { getSeatSummary } from '@/lib/sessions/seats';
import { escapeRegex, sanitizeAdminSearch } from '@/lib/admin/search';
import { serializeAdminReservation } from '@/lib/reservations/serialize';
import { formatMoneyLabel } from '@/lib/plans/money';
import { toLocalDateString } from '@/lib/dates/pkt';
import { ensureOrderIndexes } from '@/lib/orders/syncIndexes';
import { expireStaleOrders } from '@/lib/orders/expire';
import {
  emailStatusLabel,
  getJobsForOrderIds,
  mapJobToPublicStatus,
  processDueEmailJobs,
} from '@/lib/email/outbox';
import { ensureEmailJobIndexes } from '@/lib/email/syncIndexes';

const PAGE_SIZE = 25;

type SessionOption = {
  id: string;
  title: string;
  startsAt: string | null;
  dateLabel: string;
  isLandingActive: boolean;
};

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    await ensureOrderIndexes();
    await ensureEmailJobIndexes();
    await expireStaleOrders();
    try {
      await processDueEmailJobs(5);
    } catch {
      /* never block list load */
    }

    const { searchParams } = new URL(request.url);
    const q = sanitizeAdminSearch(searchParams.get('q'));
    const page = Math.max(1, Number(searchParams.get('page') || 1) || 1);
    let sessionId = (searchParams.get('sessionId') || '').trim();

    const sessionDocs = await Session.find({ status: { $ne: 'archived' } })
      .sort({ startsAt: -1 })
      .select({
        title: 1,
        startsAt: 1,
        isLandingActive: 1,
        seatsTotal: 1,
        seatsConfirmed: 1,
        holds: 1,
      })
      .lean();

    sessionDocs.sort((a, b) => {
      if (Boolean(a.isLandingActive) !== Boolean(b.isLandingActive)) {
        return a.isLandingActive ? -1 : 1;
      }
      return 0;
    });

    const sessions: SessionOption[] = sessionDocs.map((s) => ({
      id: String(s._id),
      title: s.title,
      startsAt: s.startsAt instanceof Date ? s.startsAt.toISOString() : null,
      dateLabel: toLocalDateString(s.startsAt) || '',
      isLandingActive: Boolean(s.isLandingActive),
    }));

    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
      sessionId = sessions[0]?.id || '';
    }

    if (!sessionId) {
      return NextResponse.json({
        sessions: [],
        sessionId: '',
        reservations: [],
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
        summary: { total: 0, confirmed: 0, held: 0, available: 0 },
        collected: [],
        allEmails: '',
      });
    }

    const sessionDoc = sessionDocs.find((s) => String(s._id) === sessionId);
    const summary = sessionDoc
      ? getSeatSummary({
          seatsTotal: sessionDoc.seatsTotal,
          seatsConfirmed: sessionDoc.seatsConfirmed,
          holds: sessionDoc.holds as Array<{ orderId?: string; expiresAt: Date | string }>,
        })
      : { total: 0, confirmed: 0, held: 0, available: 0 };

    const filter: Record<string, unknown> = {
      sessionId,
      status: 'approved',
    };

    if (q) {
      const re = new RegExp(escapeRegex(q), 'i');
      filter.$or = [
        { orderNumber: re },
        { 'customer.name': re },
        { 'customer.email': re },
        { 'customer.emailNormalized': re },
        { 'customer.phone': re },
      ];
    }

    const [total, docs, collectedAgg, allEmailDocs] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * PAGE_SIZE)
        .limit(PAGE_SIZE)
        .lean(),
      Order.aggregate<{ _id: string; total: number }>([
        { $match: { sessionId, status: 'approved' } },
        {
          $group: {
            _id: '$planSnapshot.currency',
            total: { $sum: '$amounts.finalPrice' },
          },
        },
      ]),
      Order.find({ sessionId, status: 'approved' })
        .select({ 'customer.email': 1 })
        .lean(),
    ]);

    const collected = collectedAgg.map((c) => ({
      currency: c._id,
      total: c.total,
      label: formatMoneyLabel(c._id as 'PKR' | 'USD', c.total),
    }));

    const allEmails = allEmailDocs
      .map((d) => d.customer?.email || '')
      .filter(Boolean)
      .join(', ');

    const jobs = await getJobsForOrderIds(docs.map((d) => String(d._id)));
    const reservations = docs.map((d) => {
      const job = jobs.get(String(d._id));
      const status = mapJobToPublicStatus(job);
      return serializeAdminReservation(
        d as unknown as Parameters<typeof serializeAdminReservation>[0],
        {
          status,
          label: emailStatusLabel(status),
          reason: job?.lastError || '',
        }
      );
    });

    return NextResponse.json({
      sessions,
      sessionId,
      reservations,
      page,
      limit: PAGE_SIZE,
      total,
      totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
      summary,
      collected,
      allEmails,
    });
  } catch (err) {
    console.error(
      '[reservations list]',
      err instanceof Error ? err.message : 'error'
    );
    return serverError();
  }
}
