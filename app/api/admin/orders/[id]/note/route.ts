import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Order } from '@/models/Order';
import { Session } from '@/models/Session';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  notFound,
  serverError,
  withAdminMutating,
} from '@/lib/sessions/api-helpers';
import { notePatchSchema } from '@/lib/orders/schema';
import { serializeAdminOrderDetail } from '@/lib/orders/serialize';
import { getSeatSummary } from '@/lib/sessions/seats';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const body = await request.json().catch(() => null);
    const parsed = notePatchSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid note');
    }

    const doc = await Order.findById(id);
    if (!doc) return notFound();

    doc.adminNote = parsed.data.adminNote;
    doc.version = (doc.version ?? 1) + 1;
    doc.events.push({
      type: 'note',
      at: new Date(),
      adminId: gate.admin.sub,
      note: 'Admin note updated',
    });
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'order.note',
      entity: 'order',
      entityId: id,
      meta: { orderNumber: doc.orderNumber },
    });

    const session = await Session.findById(doc.sessionId)
      .select({ title: 1, startsAt: 1, holds: 1, seatsTotal: 1, seatsConfirmed: 1 })
      .lean();
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
    console.error('[orders note]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
