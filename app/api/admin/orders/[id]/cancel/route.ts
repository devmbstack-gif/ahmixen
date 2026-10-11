import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Session } from '@/models/Session';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  withAdminMutating,
} from '@/lib/sessions/api-helpers';
import { cancelFieldsSchema } from '@/lib/orders/schema';
import { cancelOrder } from '@/lib/orders/transitions';
import { serializeAdminOrderDetail } from '@/lib/orders/serialize';
import { getSeatSummary } from '@/lib/sessions/seats';
import { ensureOrderIndexes } from '@/lib/orders/syncIndexes';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    await ensureOrderIndexes();
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const body = await request.json().catch(() => ({}));
    const parsed = cancelFieldsSchema.safeParse(body ?? {});
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message || 'Invalid input');
    }

    const result = await cancelOrder(
      id,
      gate.admin.sub,
      parsed.data.note ?? ''
    );
    if (!result.ok) {
      if (result.status === 409) return conflict(result.error);
      return badRequest(result.error);
    }

    await logAudit({
      adminId: gate.admin.sub,
      action: 'order.cancel',
      entity: 'order',
      entityId: id,
      meta: {
        orderNumber: result.order.orderNumber,
        txMode: result.mode,
      },
    });

    const session = await Session.findById(result.order.sessionId)
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
      order: serializeAdminOrderDetail(result.order, {
        sessionTitle: session?.title,
        sessionStartsAt: session?.startsAt ?? null,
        sessionHolds: session?.holds as Array<{
          orderId?: string;
          expiresAt: Date | string;
        }>,
        seatsLeft: seats?.available ?? null,
      }),
      txMode: result.mode,
    });
  } catch (err) {
    console.error('[orders cancel]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
