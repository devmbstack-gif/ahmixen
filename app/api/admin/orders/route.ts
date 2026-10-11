import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import {
  serverError,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { ensureOrderIndexes } from '@/lib/orders/syncIndexes';
import { expireStaleOrders } from '@/lib/orders/expire';
import { serializeAdminOrderList } from '@/lib/orders/serialize';
import { getOrdersTxMode } from '@/lib/orders/tx';

export async function GET(request: Request) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    await ensureOrderIndexes();
    await expireStaleOrders();

    const { searchParams } = new URL(request.url);
    const status = (searchParams.get('status') || 'needs_review').trim();
    const sessionId = (searchParams.get('sessionId') || '').trim();
    const q = (searchParams.get('q') || '').trim();
    const page = Math.max(1, Number(searchParams.get('page') || 1) || 1);
    const limit = Math.min(
      50,
      Math.max(1, Number(searchParams.get('limit') || 20) || 20)
    );

    const filter: Record<string, unknown> = {};
    if (sessionId && mongoose.isValidObjectId(sessionId)) {
      filter.sessionId = sessionId;
    }

    if (status === 'needs_review') {
      filter.status = 'pending_verification';
    } else if (status === 'awaiting_payment') {
      filter.status = 'awaiting_payment';
    } else if (status === 'approved') {
      filter.status = 'approved';
    } else if (status === 'rejected') {
      filter.status = 'rejected';
    } else if (status === 'expired_cancelled') {
      filter.status = { $in: ['expired', 'cancelled'] };
    } else if (status === 'all') {
      /* no status filter */
    } else {
      filter.status = 'pending_verification';
    }

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(escaped, 'i');
      filter.$or = [
        { orderNumber: re },
        { 'customer.name': re },
        { 'customer.email': re },
        { 'customer.emailNormalized': re },
        { 'customer.phone': re },
      ];
    }

    const [total, docs, countsAgg] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const countMap = new Map(countsAgg.map((c) => [c._id, c.count]));
    const counts = {
      needs_review: countMap.get('pending_verification') ?? 0,
      awaiting_payment: countMap.get('awaiting_payment') ?? 0,
      approved: countMap.get('approved') ?? 0,
      rejected: countMap.get('rejected') ?? 0,
      expired_cancelled:
        (countMap.get('expired') ?? 0) + (countMap.get('cancelled') ?? 0),
      all: Array.from(countMap.values()).reduce((a, b) => a + b, 0),
    };

    const sessionIds = Array.from(new Set(docs.map((d) => d.sessionId)));
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

    const orders = docs.map((d) => {
      const s = sessionMap.get(d.sessionId);
      return serializeAdminOrderList(
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
    });

    return NextResponse.json({
      orders,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts,
      txMode: getOrdersTxMode(),
    });
  } catch (err) {
    console.error('[orders GET]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
