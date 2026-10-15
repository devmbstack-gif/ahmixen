import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import {
  badRequest,
  serverError,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { escapeRegex, sanitizeAdminSearch } from '@/lib/admin/search';
import { buildCsv, csvResponse } from '@/lib/admin/csv';
import { logAudit } from '@/lib/sessions/audit';
import {
  rateLimit,
  rateLimitIdentityKey,
} from '@/lib/public/rateLimit';
import { toLocalDateString } from '@/lib/dates/pkt';
import { approvedAtFromEvents } from '@/lib/reservations/serialize';
import { ensureOrderIndexes } from '@/lib/orders/syncIndexes';
import { expireStaleOrders } from '@/lib/orders/expire';

const EXPORT_CAP = 5000;

export async function GET(request: Request) {
  const gate = await withAdminRead();
  if (gate.error || !gate.admin) return gate.error!;

  try {
    await ensureOrderIndexes();
    await expireStaleOrders();

    const rl = await rateLimit(
      rateLimitIdentityKey('admin-reservations-export', gate.admin.sub),
      10,
      3600
    );
    if (!rl.ok) {
      return badRequest(
        `Export limit reached. Try again in about ${rl.retryAfterSeconds} seconds.`
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = (searchParams.get('sessionId') || '').trim();
    const q = sanitizeAdminSearch(searchParams.get('q'));

    if (!sessionId || !mongoose.isValidObjectId(sessionId)) {
      return badRequest('Choose a session first');
    }

    const session = await Session.findById(sessionId)
      .select({ startsAt: 1 })
      .lean();
    if (!session) return badRequest('Session not found');

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

    const docs = await Order.find(filter)
      .sort({ updatedAt: -1 })
      .limit(EXPORT_CAP)
      .lean();

    const rows: Array<Array<string | number>> = [
      [
        'Name',
        'Email',
        'WhatsApp',
        'Plan',
        'Amount',
        'Currency',
        'Order number',
        'Approved date',
      ],
    ];

    for (const d of docs) {
      const approvedAt = approvedAtFromEvents(
        d.events as Array<{ type?: string; at?: Date | string }>
      );
      rows.push([
        d.customer?.name || '',
        d.customer?.email || '',
        d.customer?.phone || '',
        d.planSnapshot?.name || '',
        d.amounts?.finalPrice ?? 0,
        d.planSnapshot?.currency || '',
        d.orderNumber || '',
        approvedAt
          ? approvedAt.toISOString()
          : d.updatedAt instanceof Date
            ? d.updatedAt.toISOString()
            : '',
      ]);
    }

    const datePart = toLocalDateString(session.startsAt) || 'session';
    const fileName = `reservations-${datePart}.csv`;
    const body = buildCsv(rows);

    await logAudit({
      adminId: gate.admin.sub,
      action: 'reservation.export',
      entity: 'reservation',
      entityId: sessionId,
      meta: { rowCount: docs.length },
    });

    return csvResponse(body, fileName);
  } catch (err) {
    console.error(
      '[reservations export]',
      err instanceof Error ? err.message : 'error'
    );
    return serverError();
  }
}
