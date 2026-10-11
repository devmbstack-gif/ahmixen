import { NextResponse } from 'next/server';
import { Session } from '@/models/Session';
import { logAudit } from '@/lib/sessions/audit';
import { localDateTimeToUtc, sessionTimezone } from '@/lib/sessions/datetime';
import { serializeAdminSession } from '@/lib/sessions/serialize';
import { sessionWriteSchema } from '@/lib/sessions/schema';
import { assertCanOpen, canTransitionStatus, type SessionStatus } from '@/lib/sessions/status';
import {
  badRequest,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';

export async function GET(request: Request) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const q = (searchParams.get('q') || '').trim();
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (!includeArchived) filter.status = { $ne: 'archived' };
    if (status && status !== 'all') filter.status = status;
    if (q) filter.title = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const docs = await Session.find(filter).sort({ startsAt: 1 }).lean();
    const now = new Date();
    return NextResponse.json({
      sessions: docs.map((d) =>
        serializeAdminSession(d as unknown as Parameters<typeof serializeAdminSession>[0], now)
      ),
    });
  } catch (err) {
    console.error('[sessions GET]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function POST(request: Request) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const body = await request.json().catch(() => null);
    const parsed = sessionWriteSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid input');

    const data = parsed.data;
    const timezone = sessionTimezone(data.timezone);
    const startsAt = localDateTimeToUtc(data.localDate, data.localTime, timezone);
    const status = (data.status ?? 'draft') as SessionStatus;

    if (!canTransitionStatus('draft', status) && status !== 'draft') {
      return badRequest('Invalid status');
    }

    if (status === 'open') {
      const openErr = assertCanOpen(startsAt, data.seatsTotal);
      if (openErr) return badRequest(openErr);
    }

    if (status === 'archived') {
      return badRequest('Create as draft or open first');
    }

    const doc = await Session.create({
      title: data.title,
      description: data.description ?? '',
      startsAt,
      durationMinutes: data.durationMinutes,
      timezone,
      status,
      seatsTotal: data.seatsTotal,
      seatsConfirmed: 0,
      holds: [],
      holdHours: data.holdHours ?? 24,
      showLimitedSeatsBadge: data.showLimitedSeatsBadge ?? true,
      meetingLink: data.meetingLink ?? '',
      recordingUrl: data.recordingUrl ?? '',
      isLandingActive: false,
      version: 1,
      createdBy: gate.admin.sub,
      updatedBy: gate.admin.sub,
    });

    await logAudit({
      adminId: gate.admin.sub,
      action: 'session.create',
      entity: 'session',
      entityId: String(doc._id),
      meta: { title: doc.title, status: doc.status },
    });

    return NextResponse.json(
      { session: serializeAdminSession(doc) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[sessions POST]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
