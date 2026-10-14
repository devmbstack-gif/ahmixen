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
import { approveOrder } from '@/lib/orders/transitions';
import { serializeAdminOrderDetail } from '@/lib/orders/serialize';
import { getSeatSummary } from '@/lib/sessions/seats';
import { ensureOrderIndexes } from '@/lib/orders/syncIndexes';
import { scheduleEmailJobSend } from '@/lib/email/scheduleSend';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    await ensureOrderIndexes();
    const { id } = await ctx.params;
    if (!mongoose.isValidObjectId(id)) return notFound();

    const result = await approveOrder(id, gate.admin.sub);
    if (!result.ok) {
      if (result.status === 409) return conflict(result.error);
      return badRequest(result.error);
    }

    if (result.emailJobId) {
      scheduleEmailJobSend(result.emailJobId);
    }

    await logAudit({
      adminId: gate.admin.sub,
      action: 'order.approve',
      entity: 'order',
      entityId: id,
      meta: {
        orderNumber: result.order.orderNumber,
        txMode: result.mode,
        emailJobQueued: Boolean(result.emailJobId),
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
        emailStatus: result.emailJobId ? 'pending' : 'not_sent',
        emailStatusLabel: result.emailJobId ? 'Pending' : 'Not sent',
        emailReason: '',
      }),
      txMode: result.mode,
    });
  } catch (err) {
    console.error('[orders approve]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
