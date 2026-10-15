import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import { Lead } from '@/models/Lead';
import { serverError, withAdminRead } from '@/lib/sessions/api-helpers';
import { expireStaleOrders } from '@/lib/orders/expire';
import { serializeAdminOrderList } from '@/lib/orders/serialize';
import { formatMoneyLabel } from '@/lib/plans/money';
import {
  parsePktDayEnd,
  parsePktDayStart,
  toLocalDateString,
} from '@/lib/dates/pkt';

export const runtime = 'nodejs';

const ORDER_LIST_SELECT = {
  orderNumber: 1,
  createdAt: 1,
  status: 1,
  sessionId: 1,
  planSnapshot: 1,
  amounts: 1,
  coupon: 1,
  customer: 1,
  isTestData: 1,
  isLive: 1,
  sourceKind: 1,
  programTitle: 1,
  programId: 1,
} as const;

export async function GET() {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    // Don't block the dashboard on hold expiry — run in the background.
    void expireStaleOrders().catch(() => undefined);

    const todayPkt = toLocalDateString(new Date());
    const dayStart = parsePktDayStart(todayPkt);
    const dayEnd = parsePktDayEnd(todayPkt);

    const [pendingCount, pendingDocs, newLeadsToday] = await Promise.all([
      Order.countDocuments({ status: 'pending_verification' }),
      Order.find({ status: 'pending_verification' })
        .select(ORDER_LIST_SELECT)
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      dayStart && dayEnd
        ? Lead.countDocuments({
            firstSeenAt: { $gte: dayStart, $lte: dayEnd },
          })
        : Promise.resolve(0),
    ]);

    // Prefer needs-review rows; only load general recent when inbox is empty.
    const listDocs =
      pendingDocs.length > 0
        ? pendingDocs
        : await Order.find({})
            .select(ORDER_LIST_SELECT)
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

    const sessionIds = Array.from(new Set(listDocs.map((d) => d.sessionId)));
    const sessions = await Session.find({
      _id: {
        $in: sessionIds.filter((id) => mongoose.isValidObjectId(id)),
      },
    })
      .select({ title: 1, startsAt: 1, holds: 1 })
      .lean();
    const sessionMap = new Map(
      sessions.map((s) => [String(s._id), s] as const)
    );
    const now = new Date();

    const recentOrders = listDocs.map((d) => {
      const s = sessionMap.get(d.sessionId);
      const row = serializeAdminOrderList(
        d as unknown as Parameters<typeof serializeAdminOrderList>[0],
        {
          sessionTitle: s?.title,
          sessionStartsAt: s?.startsAt ?? null,
          sessionHolds: s?.holds as Array<{
            orderId?: string;
            expiresAt: Date | string;
          }>,
          now,
        }
      );
      return {
        id: row.id,
        name: row.customerName,
        plan: row.planName,
        amount:
          row.installmentLabel ||
          row.amountLabel ||
          formatMoneyLabel(row.currency, row.finalPrice),
        status: row.status,
        statusLabel: row.statusLabel,
        date: row.createdLabel,
        orderNumber: row.orderNumber,
      };
    });

    return NextResponse.json({
      pendingPayments: pendingCount,
      newLeadsToday,
      recentOrders,
    });
  } catch (err) {
    console.error(
      '[orders dashboard]',
      err instanceof Error ? err.message : 'error'
    );
    return serverError();
  }
}
