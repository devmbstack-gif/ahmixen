import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { Plan } from '@/models/Plan';
import { Session } from '@/models/Session';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  serverError,
  withAdminMutating,
  withAdminRead,
} from '@/lib/sessions/api-helpers';
import { planWriteSchema } from '@/lib/plans/schema';
import { serializeAdminPlan } from '@/lib/plans/serialize';
import { assertActiveValidUntil, parseValidUntil } from '@/lib/plans/validate';
import { ensurePlanIndexes } from '@/lib/plans/syncIndexes';

async function sessionTitleMap(ids: string[]) {
  const unique = Array.from(
    new Set(ids.filter((id) => id && mongoose.isValidObjectId(id)))
  );
  if (unique.length === 0) return new Map<string, string>();
  const docs = await Session.find({ _id: { $in: unique } })
    .select({ title: 1 })
    .lean();
  const map = new Map<string, string>();
  for (const d of docs) map.set(String(d._id), d.title);
  return map;
}

export async function GET(request: Request) {
  const gate = await withAdminRead();
  if (gate.error) return gate.error;

  try {
    await ensurePlanIndexes();
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const q = (searchParams.get('q') || '').trim();
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (!includeArchived) filter.status = { $ne: 'archived' };
    if (status && status !== 'all') filter.status = status;
    if (q) filter.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };

    const landingSession = await Session.findOne({ isLandingActive: true })
      .select({ _id: 1 })
      .lean();
    const activeLandingSessionId = landingSession
      ? String(landingSession._id)
      : null;

    // Heal stale session binding on the landing-flagged plan so admin pills
    // and checkout filters stay aligned with the public landing session.
    if (activeLandingSessionId) {
      await Plan.updateMany(
        {
          isLandingPlan: true,
          sessionId: { $nin: [activeLandingSessionId, ''] },
        },
        { $set: { sessionId: activeLandingSessionId } }
      );
    } else {
      await Plan.updateMany(
        { isLandingPlan: true, sessionId: { $nin: ['', null] } },
        { $set: { sessionId: '' } }
      );
    }

    const docs = await Plan.find(filter).sort({ sortOrder: 1, createdAt: -1 }).lean();
    const titles = await sessionTitleMap(docs.map((d) => d.sessionId || ''));
    const now = new Date();

    return NextResponse.json({
      plans: docs.map((d) =>
        serializeAdminPlan(
          d as unknown as Parameters<typeof serializeAdminPlan>[0],
          d.sessionId ? titles.get(d.sessionId) ?? null : null,
          now,
          activeLandingSessionId
        )
      ),
    });
  } catch (err) {
    console.error('[plans GET]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}

export async function POST(request: Request) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const body = await request.json().catch(() => null);
    const parsed = planWriteSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message || 'Invalid input';
      return badRequest(msg);
    }

    const data = parsed.data;
    if (data.status === 'archived') {
      return badRequest('Create as active or hidden first');
    }

    const validErr = assertActiveValidUntil(data.status ?? 'hidden', data.validUntil);
    if (validErr) return badRequest(validErr);

    if (data.sessionId) {
      if (!mongoose.isValidObjectId(data.sessionId)) {
        return badRequest('Choose a valid session or All sessions');
      }
      const session = await Session.findById(data.sessionId).select({ _id: 1 }).lean();
      if (!session) return badRequest('Choose a valid session or All sessions');
    }

    const features = (data.features ?? []).map((f) => f.trim()).filter(Boolean).slice(0, 8);
    const installmentsCount =
      data.type === 'installment' ? data.installmentsCount ?? null : null;

    const doc = await Plan.create({
      name: data.name,
      shortDescription: data.shortDescription ?? '',
      type: data.type,
      currency: data.currency,
      price: data.price,
      originalPrice: data.originalPrice ?? null,
      installmentsCount,
      features,
      sessionId: data.sessionId ?? '',
      validUntil: parseValidUntil(data.validUntil),
      status: data.status ?? 'hidden',
      sortOrder: data.sortOrder ?? 0,
      version: 1,
      createdBy: gate.admin.sub,
      updatedBy: gate.admin.sub,
    });

    await logAudit({
      adminId: gate.admin.sub,
      action: 'plan.create',
      entity: 'plan',
      entityId: String(doc._id),
      meta: { name: doc.name, status: doc.status },
    });

    const title =
      doc.sessionId
        ? (
            await Session.findById(doc.sessionId).select({ title: 1 }).lean()
          )?.title ?? null
        : null;

    return NextResponse.json(
      { plan: serializeAdminPlan(doc, title) },
      { status: 201 }
    );
  } catch (err) {
    console.error('[plans POST]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
