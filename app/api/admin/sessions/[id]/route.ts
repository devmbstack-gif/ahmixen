import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Session } from '@/models/Session';
import { logAudit } from '@/lib/sessions/audit';
import { localDateTimeToUtc, sessionTimezone } from '@/lib/sessions/datetime';
import { serializeAdminSession } from '@/lib/sessions/serialize';
import { sessionPatchSchema } from '@/lib/sessions/schema';
import {
  assertCanOpen,
  canTransitionStatus,
  type SessionStatus,
} from '@/lib/sessions/status';
import { getSeatSummary } from '@/lib/sessions/seats';
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';

type Ctx = { params: Promise<{ id: string }> };

function isId(id: string) {
  return mongoose.Types.ObjectId.isValid(id);
}

export async function GET(_request: Request, ctx: Ctx) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { id } = await ctx.params;
    if (!isId(id)) return notFound();
    const doc = await Session.findById(id);
    if (!doc) return notFound();
    return NextResponse.json({ session: serializeAdminSession(doc) });
  } catch (err) {
    console.error('[sessions GET id]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!isId(id)) return notFound();

    const body = await request.json().catch(() => null);
    const parsed = sessionPatchSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input');

    const existing = await Session.findById(id);
    if (!existing) return notFound();

    if (existing.version !== parsed.data.version) {
      return conflict('This session was changed elsewhere, reload');
    }

    const data = parsed.data;
    const timezone = sessionTimezone(data.timezone ?? existing.timezone);
    let startsAt = existing.startsAt;
    if (data.localDate && data.localTime) {
      startsAt = localDateTimeToUtc(data.localDate, data.localTime, timezone);
    } else if (data.localDate || data.localTime) {
      return badRequest('Both date and time are required');
    }

    const nextStatus = (data.status ?? existing.status) as SessionStatus;
    if (!canTransitionStatus(existing.status as SessionStatus, nextStatus)) {
      return badRequest('Invalid status change');
    }

    const seatsTotal = data.seatsTotal ?? existing.seatsTotal;
    const seats = getSeatSummary(existing);
    if (seatsTotal < seats.confirmed + seats.held) {
      return badRequest(
        `Seats total cannot be below confirmed + held (${seats.confirmed + seats.held})`
      );
    }

    if (nextStatus === 'open') {
      const openErr = assertCanOpen(startsAt, seatsTotal);
      if (openErr) return badRequest(openErr);
    }

    if (nextStatus === 'archived') {
      return badRequest('Use archive action to archive a session');
    }

    const updated = await Session.findOneAndUpdate(
      { _id: id, version: parsed.data.version },
      {
        $set: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          startsAt,
          timezone,
          ...(data.durationMinutes !== undefined
            ? { durationMinutes: data.durationMinutes }
            : {}),
          status: nextStatus,
          seatsTotal,
          ...(data.holdHours !== undefined ? { holdHours: data.holdHours } : {}),
          ...(data.showLimitedSeatsBadge !== undefined
            ? { showLimitedSeatsBadge: data.showLimitedSeatsBadge }
            : {}),
          ...(data.meetingLink !== undefined ? { meetingLink: data.meetingLink } : {}),
          ...(data.recordingUrl !== undefined ? { recordingUrl: data.recordingUrl } : {}),
          updatedBy: gate.admin.sub,
        },
        $inc: { version: 1 },
      },
      { new: true }
    );

    if (!updated) {
      return conflict('This session was changed elsewhere, reload');
    }

    await logAudit({
      adminId: gate.admin.sub,
      action: 'session.update',
      entity: 'session',
      entityId: id,
      meta: { status: updated.status, version: updated.version },
    });

    return NextResponse.json({ session: serializeAdminSession(updated) });
  } catch (err) {
    console.error('[sessions PATCH]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

/** Soft-delete: archive only. */
export async function DELETE(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    if (!isId(id)) return notFound();

    const existing = await Session.findById(id);
    if (!existing) return notFound();

    if (existing.status === 'archived') {
      return NextResponse.json({ session: serializeAdminSession(existing) });
    }

    const seats = getSeatSummary(existing);
    if (seats.confirmed > 0 || seats.held > 0) {
      return badRequest(
        'Cannot archive a session with confirmed seats or active holds'
      );
    }

    if (!canTransitionStatus(existing.status as SessionStatus, 'archived')) {
      return badRequest('Invalid status change');
    }

    existing.status = 'archived';
    existing.isLandingActive = false;
    existing.updatedBy = gate.admin.sub;
    existing.version = (existing.version ?? 1) + 1;
    await existing.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'session.archive',
      entity: 'session',
      entityId: id,
      meta: { title: existing.title },
    });

    return NextResponse.json({ session: serializeAdminSession(existing) });
  } catch (err) {
    console.error('[sessions DELETE]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
