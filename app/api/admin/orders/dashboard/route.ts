import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import { serverError, withAdminRead } from '@/lib/sessions/api-helpers';
import { ensureOrderIndexes } from '@/lib/orders/syncIndexes';
import { expireStaleOrders } from '@/lib/orders/expire';
import { serializeAdminOrderList } from '@/lib/orders/serialize';
import { formatMoneyLabel } from '@/lib/plans/money';

export async function GET() {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    await ensureOrderIndexes();
    await expireStaleOrders();

    const [pendingCount, recentDocs] = await Promise.all([
      Order.countDocuments({ status: 'pending_verification' }),
      Order.find({}).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    const sessionIds = Array.from(new Set(recentDocs.map((d) => d.sessionId)));
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

    const recentOrders = recentDocs.map((d) => {
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
        amount: row.installmentLabel || row.amountLabel || formatMoneyLabel(row.currency, row.finalPrice),
        status: row.status,
        statusLabel: row.statusLabel,
        date: row.createdLabel,
        orderNumber: row.orderNumber,
      };
    });

    return NextResponse.json({
      pendingPayments: pendingCount,
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
