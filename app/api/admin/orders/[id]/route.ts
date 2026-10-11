import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import {
  notFound,
  serverError,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { ensureOrderIndexes } from '@/lib/orders/syncIndexes';
import { expireStaleOrders } from '@/lib/orders/expire';
import { serializeAdminOrderDetail } from '@/lib/orders/serialize';
import { getSeatSummary } from '@/lib/sessions/seats';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    await ensureOrderIndexes();
    await expireStaleOrders();

    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const doc = await Order.findById(id);
    if (!doc) return notFound();

    const session = mongoose.isValidObjectId(doc.sessionId)
      ? await Session.findById(doc.sessionId)
          .select({ title: 1, startsAt: 1, holds: 1, seatsTotal: 1, seatsConfirmed: 1 })
          .lean()
      : null;

    const seats = session
      ? getSeatSummary({
          seatsTotal: session.seatsTotal,
          seatsConfirmed: session.seatsConfirmed,
          holds: session.holds ?? [],
        })
      : null;

    return NextResponse.json({
      order: serializeAdminOrderDetail(doc, {
        sessionTitle: session?.title,
        sessionStartsAt: session?.startsAt ?? null,
        sessionHolds: session?.holds as Array<{
          orderId?: string;
          expiresAt: Date | string;
        }>,
        seatsLeft: seats?.available ?? null,
      }),
    });
  } catch (err) {
    console.error('[orders GET id]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
