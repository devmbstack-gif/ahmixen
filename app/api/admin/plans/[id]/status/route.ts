import { NextResponse } from 'next/server';
import { Plan } from '@/models/Plan';
import { Session } from '@/models/Session';
import { logAudit } from '@/lib/sessions/audit';
import {
  badRequest,
  conflict,
  notFound,
  serverError,
  withAdminMutating,
} from '@/lib/sessions/api-helpers';
import { planStatusSchema } from '@/lib/plans/schema';
import { serializeAdminPlan } from '@/lib/plans/serialize';
import { assertActiveValidUntil } from '@/lib/plans/validate';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const gate = await withAdminMutating(request);
  if (gate.error || !gate.admin) return gate.error!;

  try {
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const parsed = planStatusSchema.safeParse(body);
    if (!parsed.success) return badRequest('Invalid status');

    const doc = await Plan.findById(id);
    if (!doc) return notFound();
    if (doc.status === 'archived') {
      return badRequest('Archived plans cannot be shown or hidden');
    }
    if (parsed.data.version !== doc.version) {
      return conflict('This plan was changed elsewhere, reload');
    }

    if (parsed.data.status === 'active') {
      const validLocal = doc.validUntil
        ? new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Karachi',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(doc.validUntil)
        : null;
      const validErr = assertActiveValidUntil('active', validLocal);
      if (validErr) return badRequest(validErr);
    }

    doc.status = parsed.data.status;
    if (parsed.data.status !== 'active') {
      doc.isLandingPlan = false;
    }
    doc.updatedBy = gate.admin.sub;
    doc.version = (doc.version ?? 1) + 1;
    await doc.save();

    await logAudit({
      adminId: gate.admin.sub,
      action: 'plan.status',
      entity: 'plan',
      entityId: String(doc._id),
      meta: { name: doc.name, status: doc.status },
    });

    const title = doc.sessionId
      ? (
          await Session.findById(doc.sessionId).select({ title: 1 }).lean()
        )?.title ?? null
      : null;
    const landingSession = await Session.findOne({ isLandingActive: true })
      .select({ _id: 1 })
      .lean();

    return NextResponse.json({
      plan: serializeAdminPlan(
        doc,
        title,
        new Date(),
        landingSession ? String(landingSession._id) : null
      ),
    });
  } catch (err) {
    console.error('[plans status]', err instanceof Error ? err.message : 'error');
    return serverError();
  }
}
